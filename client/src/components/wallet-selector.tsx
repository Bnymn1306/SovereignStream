import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useWallet } from "@/components/wallet-context";
import { ExternalLink, AlertCircle, Loader2, CheckCircle2, LogOut } from "lucide-react";

export function WalletSelector() {
  const {
    availableWallets,
    connectSpecific,
    showWalletSelector,
    setShowWalletSelector,
    connectionError,
    connected,
    address,
    walletName,
    disconnect,
    isWalletLoading,
  } = useWallet();

  const supportedWallets = [
    {
      name: "Petra",
      description: "Recommended wallet for Shelby Protocol",
      installUrl: "https://petra.app",
    },
    {
      name: "Martian",
      description: "Multi-chain wallet compatible with Shelby",
      installUrl: "https://martianwallet.xyz",
    },
  ];

  const hasAnyDetected = supportedWallets.some((sw) =>
    availableWallets.find((w) => w.name.toLowerCase().includes(sw.name.toLowerCase()))
  );

  const handleConnect = (name: string) => {
    connectSpecific(name);
  };

  const handleDisconnect = async () => {
    await disconnect();
    setShowWalletSelector(false);
  };

  return (
    <Dialog open={showWalletSelector} onOpenChange={setShowWalletSelector}>
      <DialogContent className="sm:max-w-md glass-panel border-border/50" data-testid="dialog-wallet-selector">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            {connected ? "Wallet Connected" : "Connect Wallet"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            {connected
              ? "Your wallet is connected to SovereignStream via Shelby Protocol."
              : "Select a wallet to connect to SovereignStream via Shelby Protocol."}
          </DialogDescription>
        </DialogHeader>

        {connected && address && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3.5 rounded-lg glass-card">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{walletName || "Connected"}</p>
                <p className="text-xs text-muted-foreground font-mono truncate" data-testid="text-selector-address">
                  {address.slice(0, 8)}...{address.slice(-6)}
                </p>
              </div>
              <Badge variant="secondary" className="text-[10px] shrink-0">
                Shelby
              </Badge>
            </div>
            <button
              type="button"
              onClick={handleDisconnect}
              data-testid="button-selector-disconnect"
              className="flex items-center justify-center gap-2 w-full p-2.5 rounded-lg border border-destructive/20 text-destructive hover:bg-destructive/10 transition-colors text-sm font-medium cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Disconnect Wallet
            </button>
          </div>
        )}

        {!connected && (
          <>
            {connectionError && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm" data-testid="text-connection-error">
                <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                <p className="text-destructive text-xs">
                  {connectionError}
                </p>
              </div>
            )}

            {isWalletLoading && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10 text-sm">
                <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" />
                <p className="text-muted-foreground text-xs">
                  Connecting to wallet... Please check your wallet extension for approval.
                </p>
              </div>
            )}

            {!hasAnyDetected && !isWalletLoading && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10 text-sm">
                <AlertCircle className="w-4 h-4 text-primary/60 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs">
                    No supported wallets detected. Install Petra or Martian to connect.
                  </p>
                  <p className="text-muted-foreground/60 text-[10px]">
                    If you just installed a wallet, refresh this page.
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-2 pt-1">
              {supportedWallets.map((sw) => {
                const detected = availableWallets.find(
                  (w) => w.name.toLowerCase().includes(sw.name.toLowerCase())
                );

                return (
                  <button
                    key={sw.name}
                    type="button"
                    className="flex items-center justify-between gap-3 p-3.5 rounded-lg glass-card cursor-pointer w-full text-left disabled:opacity-50"
                    disabled={isWalletLoading}
                    onClick={() => {
                      if (detected) {
                        handleConnect(detected.name);
                      } else {
                        window.open(sw.installUrl, "_blank");
                      }
                    }}
                    data-testid={`button-wallet-${sw.name.toLowerCase()}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {detected?.icon ? (
                        <img
                          src={detected.icon}
                          alt={sw.name}
                          className="w-9 h-9 rounded-lg"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center text-xs font-bold text-white">
                          {sw.name[0]}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">{sw.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {sw.description}
                        </p>
                      </div>
                    </div>
                    <div>
                      {detected ? (
                        <Badge className="gradient-primary text-white border-0 text-[10px]">Connect</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px]">
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Install
                        </Badge>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}

        <p className="text-xs text-muted-foreground/60 text-center pt-2 font-mono">
          Shelby Protocol v1.0 — Hot Storage
        </p>
      </DialogContent>
    </Dialog>
  );
}
