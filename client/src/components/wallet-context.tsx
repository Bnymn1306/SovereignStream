import { createContext, useContext, useMemo, useCallback, useState, useEffect, useRef } from "react";
import {
  AptosWalletAdapterProvider,
  useWallet as useAptosWallet,
} from "@aptos-labs/wallet-adapter-react";
import { Network } from "@aptos-labs/ts-sdk";
import { useQuery } from "@tanstack/react-query";

interface ShelbyConfig {
  protocolVersion: string;
  hotStorageEnabled: boolean;
  clayCodes: boolean;
  targetLatencyMs: number;
  maxFragmentSize: number;
}

interface NetworkConfig {
  network: string;
  rpcUrl: string;
  shelby: ShelbyConfig;
  indexerAuthenticated: boolean;
}

interface WalletState {
  connected: boolean;
  address: string | null;
  balance: string;
  connect: () => void;
  disconnect: () => void;
  walletName: string | null;
  availableWallets: { name: string; icon?: string; url?: string; readyState?: string }[];
  connectSpecific: (walletName: string) => void;
  showWalletSelector: boolean;
  setShowWalletSelector: (show: boolean) => void;
  networkConfig: NetworkConfig | null;
  isCorrectNetwork: boolean;
  signAndSubmitTransaction: (payload: any) => Promise<any>;
  signMessage: (message: { message: string; nonce: string }) => Promise<any>;
  connectionError: string | null;
  isWalletLoading: boolean;
  walletNetworkUrl: string | null;
  walletNetworkName: string | null;
}

const WalletContext = createContext<WalletState>({
  connected: false,
  address: null,
  balance: "0",
  connect: () => {},
  disconnect: () => {},
  walletName: null,
  availableWallets: [],
  connectSpecific: () => {},
  showWalletSelector: false,
  setShowWalletSelector: () => {},
  networkConfig: null,
  isCorrectNetwork: true,
  signAndSubmitTransaction: () => Promise.reject(new Error("Wallet not connected")),
  signMessage: () => Promise.reject(new Error("Wallet not connected")),
  connectionError: null,
  isWalletLoading: false,
  walletNetworkUrl: null,
  walletNetworkName: null,
});

function isTestnetNetwork(networkName: string | undefined | null): boolean {
  if (!networkName) return false;
  const normalized = networkName.toLowerCase().trim();
  return normalized === "testnet" || normalized === "aptos testnet" || normalized === Network.TESTNET;
}

const adapterErrorRef = { current: null as string | null };

function WalletBridge({ children, networkConfig }: { children: React.ReactNode; networkConfig: NetworkConfig | null }) {
  const {
    account,
    connected: adapterConnected,
    isLoading: adapterLoading,
    wallet,
    wallets,
    connect: aptosConnect,
    disconnect: aptosDisconnect,
    network,
    signAndSubmitTransaction: aptosSignAndSubmit,
    signMessage: aptosSignMessage,
  } = useAptosWallet();

  const [showWalletSelector, setShowWalletSelector] = useState(false);
  const [balance] = useState("0.0000");
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [userConnecting, setUserConnecting] = useState(false);
  const prevConnectedRef = useRef(false);

  useEffect(() => {
    console.log("[shelbynet] Adapter state:", {
      connected: adapterConnected,
      isLoading: adapterLoading,
      account: account?.address?.toString()?.slice(0, 12),
      wallet: wallet?.name,
      network: network?.name,
      walletsDetected: wallets?.map((w: any) => `${w.name}(${w.readyState})`).join(", "),
    });
  }, [adapterConnected, adapterLoading, account, wallet, network, wallets]);

  const isCorrectNetwork = useMemo(() => {
    if (!adapterConnected) return true;
    if (!network || !network.name) return true;
    return isTestnetNetwork(network.name);
  }, [adapterConnected, network]);

  useEffect(() => {
    if (adapterConnected && !prevConnectedRef.current) {
      console.log("[shelbynet] Wallet CONNECTED:", {
        address: account?.address?.toString()?.slice(0, 12) + "...",
        walletName: wallet?.name,
        network: network?.name || "unknown",
      });
      setConnectionError(null);
      setShowWalletSelector(false);
      setUserConnecting(false);
    }
    if (!adapterConnected && prevConnectedRef.current) {
      console.log("[shelbynet] Wallet DISCONNECTED");
      setUserConnecting(false);
    }
    prevConnectedRef.current = adapterConnected;
  }, [adapterConnected, account, wallet, network]);

  useEffect(() => {
    if (adapterConnected && network && network.name && !isTestnetNetwork(network.name)) {
      setConnectionError(`Network: ${network.name}. Shelby Protocol requires a compatible network.`);
    }
  }, [adapterConnected, network]);

  useEffect(() => {
    const err = adapterErrorRef.current;
    if (err) {
      adapterErrorRef.current = null;
      const errLower = err.toLowerCase();
      console.log("[shelbynet] Processing adapter error:", err);
      if (errLower.includes("already connected")) {
        setConnectionError(null);
        setShowWalletSelector(false);
        setUserConnecting(false);
      } else if (errLower.includes("rejected") || errLower.includes("cancelled") || errLower.includes("denied")) {
        setConnectionError("Connection request was rejected.");
        setUserConnecting(false);
      } else {
        setConnectionError(err);
        setUserConnecting(false);
      }
    }
  });

  const address = useMemo(() => {
    if (account?.address) {
      return account.address.toString();
    }
    return null;
  }, [account]);

  const walletName = wallet?.name || null;

  const availableWallets = useMemo(() => {
    return (wallets || []).map((w: any) => ({
      name: w.name,
      icon: w.icon,
      url: w.url,
      readyState: w.readyState,
    }));
  }, [wallets]);

  const connect = useCallback(() => {
    if (adapterConnected) {
      return;
    }
    setConnectionError(null);
    setShowWalletSelector(true);
  }, [adapterConnected]);

  const connectSpecific = useCallback(
    (name: string) => {
      if (userConnecting) {
        console.log("[shelbynet] Connection already in progress, ignoring duplicate click");
        return;
      }

      if (adapterConnected && wallet?.name === name) {
        console.log("[shelbynet] Already connected to", name);
        setShowWalletSelector(false);
        setConnectionError(null);
        return;
      }

      setConnectionError(null);
      setUserConnecting(true);

      if (adapterConnected) {
        console.log("[shelbynet] Disconnecting current wallet before switching to", name);
        aptosDisconnect().then(() => {
          setTimeout(() => {
            console.log("[shelbynet] Now connecting to", name);
            aptosConnect(name);
          }, 500);
        }).catch(() => {
          aptosConnect(name);
        });
      } else {
        console.log("[shelbynet] Connecting to", name);
        aptosConnect(name);
      }

      setTimeout(() => {
        setUserConnecting(false);
      }, 15000);
    },
    [aptosConnect, aptosDisconnect, adapterConnected, wallet, userConnecting]
  );

  const disconnect = useCallback(async () => {
    try {
      setConnectionError(null);
      await aptosDisconnect();
    } catch (err) {
      console.error("[shelbynet] Failed to disconnect wallet:", err);
    }
  }, [aptosDisconnect]);

  const walletNetworkUrl = useMemo(() => {
    return (network as any)?.url || null;
  }, [network]);

  const walletNetworkName = useMemo(() => {
    return network?.name || null;
  }, [network]);

  const signAndSubmitTransaction = useCallback(
    async (payload: any) => {
      if (!adapterConnected) {
        throw new Error("Wallet not connected");
      }
      console.log("[shelbynet] signAndSubmitTransaction called, wallet network:", network?.name, "url:", (network as any)?.url);
      const response = await aptosSignAndSubmit(payload);
      console.log("[shelbynet] signAndSubmitTransaction raw response:", JSON.stringify(response, null, 2));
      console.log("[shelbynet] response type:", typeof response, "keys:", response ? Object.keys(response) : "null");
      return response;
    },
    [adapterConnected, network, aptosSignAndSubmit]
  );

  const signMessage = useCallback(
    async (payload: { message: string; nonce: string }) => {
      if (!adapterConnected) {
        throw new Error("Wallet not connected");
      }
      console.log("[shelbynet] signMessage called");
      const response = await aptosSignMessage(payload);
      console.log("[shelbynet] signMessage response:", response);
      return response;
    },
    [adapterConnected, aptosSignMessage]
  );

  return (
    <WalletContext.Provider
      value={{
        connected: adapterConnected,
        address,
        balance,
        connect,
        disconnect,
        walletName,
        availableWallets,
        connectSpecific,
        showWalletSelector,
        setShowWalletSelector,
        networkConfig,
        isCorrectNetwork,
        signAndSubmitTransaction,
        signMessage,
        connectionError,
        isWalletLoading: userConnecting,
        walletNetworkUrl,
        walletNetworkName,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const { data: config } = useQuery<NetworkConfig>({
    queryKey: ["/api/config"],
  });

  return (
    <AptosWalletAdapterProvider
      autoConnect={false}
      dappConfig={{
        network: Network.TESTNET,
        aptosConnectDappId: undefined,
      }}
      optInWallets={["Petra", "Martian"]}
      onError={(error) => {
        const msg = typeof error === "string" ? error : error?.message || String(error);
        console.error("[shelbynet] Adapter onError:", msg);
        adapterErrorRef.current = msg;
      }}
    >
      <WalletBridge networkConfig={config || null}>{children}</WalletBridge>
    </AptosWalletAdapterProvider>
  );
}

export const useWallet = () => useContext(WalletContext);
