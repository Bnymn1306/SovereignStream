import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/components/wallet-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Play,
  Lock,
  Unlock,
  Wallet,
  Loader2,
  Eye,
  Coins,
  FileText,
  ArrowLeft,
  CheckCircle2,
  Zap,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  Info,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import type { Content, Creator } from "@shared/schema";

interface StreamData {
  contentId: string;
  blobId: string;
  contentType: string;
  totalFragments: number;
  fragments: { index: number; fragmentId: string; size: number; clayCoded: boolean; status: string }[];
  streamReady: boolean;
  latencyMs: number;
  storageType: string;
  clayCodes: boolean;
}

type ContentWithFile = Content & { localFilename?: string | null };

function isShelbyBlob(content: ContentWithFile): boolean {
  return !!content.shelbyBlobId && content.shelbyBlobId.startsWith("files/");
}

function hasFile(content: ContentWithFile): boolean {
  return isShelbyBlob(content) || !!content.localFilename;
}

function getFileUrl(content: ContentWithFile, address: string): string {
  if (isShelbyBlob(content)) {
    return `/api/shelby-content/${content.id}?wallet=${encodeURIComponent(address)}`;
  }
  return `/api/content-file/${content.id}?wallet=${encodeURIComponent(address)}`;
}

const SHELBYUSD_DECIMALS = 100_000_000;
const SHELBYUSD_FA_METADATA = "0x1b18363a9f1fe5e6ebf247daba5cc1c18052bb232efdc4c50f556053922d98e1";

function shelbyUsdToUnits(amount: string | number): number {
  return Math.round(parseFloat(String(amount)) * SHELBYUSD_DECIMALS);
}

export default function ContentViewer() {
  const [, params] = useRoute("/content/:id");
  const contentId = params?.id;
  const { connected, address, connect, networkConfig, signAndSubmitTransaction, walletNetworkUrl, walletNetworkName } = useWallet();
  const { toast } = useToast();
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamProgress, setStreamProgress] = useState(0);
  const [fragmentsLoaded, setFragmentsLoaded] = useState(0);
  const [totalFragments, setTotalFragments] = useState(0);
  const [streamLatency, setStreamLatency] = useState<number | null>(null);
  const [txConfirming, setTxConfirming] = useState(false);
  const [accessGranted, setAccessGranted] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txStage, setTxStage] = useState<string>("");
  const [contentLoadMs, setContentLoadMs] = useState<number | null>(null);
  const contentLoadStart = useState(() => performance.now())[0];

  const { data: content, isLoading: contentLoading } = useQuery<ContentWithFile>({
    queryKey: ["/api/contents", contentId],
    enabled: !!contentId,
  });

  const { data: creator } = useQuery<Creator>({
    queryKey: ["/api/creators", content?.creatorId],
    enabled: !!content?.creatorId,
  });

  const { data: hasAccess } = useQuery<{ hasAccess: boolean }>({
    queryKey: ["/api/access", contentId, address],
    enabled: !!contentId && !!address && connected,
  });

  const { data: shelbyBalance } = useQuery<{
    balance: string;
    balanceFormatted: string;
    balanceUnits: number;
    hasBalance: boolean;
    error?: string;
  }>({
    queryKey: ["/api/shelbyusd-balance", address],
    enabled: !!address && connected && !accessGranted,
    refetchInterval: false,
  });

  useEffect(() => {
    if (hasAccess?.hasAccess) {
      setAccessGranted(true);
    }
  }, [hasAccess]);

  useEffect(() => {
    if (content && !contentLoadMs) {
      setContentLoadMs(Math.round(performance.now() - contentLoadStart));
    }
  }, [content, contentLoadMs, contentLoadStart]);

  const purchaseMutation = useMutation({
    mutationFn: async () => {
      if (!content || !creator) throw new Error("Content or creator data not available");
      if (!connected || !address) throw new Error("Wallet not connected");

      setTxConfirming(true);
      setTxStage("Preparing transaction...");

      const priceInUnits = shelbyUsdToUnits(content.priceShelbyUsd);
      const creatorAddress = creator.walletAddress;

      setTxStage("Awaiting wallet approval...");

      let submittedTxHash: string;

      try {
        const response = await signAndSubmitTransaction({
          data: {
            function: "0x1::primary_fungible_store::transfer",
            typeArguments: ["0x1::fungible_asset::Metadata"],
            functionArguments: [SHELBYUSD_FA_METADATA, creatorAddress, priceInUnits],
          },
        });

        submittedTxHash = response?.hash
          || response?.args?.hash
          || (typeof response === "string" ? response : "");

        if (!submittedTxHash && typeof response === "object" && response !== null) {
          for (const key of Object.keys(response)) {
            const val = (response as any)[key];
            if (typeof val === "string" && /^0x[a-fA-F0-9]{60,66}$/.test(val)) {
              submittedTxHash = val;
              break;
            }
          }
        }

        console.log("[shelbynet] Extracted tx hash:", submittedTxHash);
      } catch (walletErr: any) {
        const msg = walletErr?.message || String(walletErr);
        console.error("[shelbynet] Transaction error:", msg);
        if (msg.includes("rejected") || msg.includes("cancelled") || msg.includes("denied") || msg.includes("User rejected")) {
          throw new Error("Transaction rejected by user");
        }
        if (msg.includes("insufficient") || msg.includes("INSUFFICIENT") || msg.includes("balance")) {
          throw new Error("Insufficient APT balance. Please fund your wallet via Shelby faucet.");
        }
        throw new Error(`Wallet error: ${msg}`);
      }

      if (!submittedTxHash || !submittedTxHash.startsWith("0x")) {
        throw new Error("Could not extract transaction hash from wallet response");
      }

      setTxHash(submittedTxHash);
      setTxStage("Confirming transaction...");

      const rpcUrl = walletNetworkUrl || "https://api.testnet.aptoslabs.com/v1";
      console.log("[shelbynet] Verifying on RPC:", rpcUrl, "network:", walletNetworkName);

      let verified = false;
      for (let attempt = 0; attempt < 15; attempt++) {
        await new Promise((r) => setTimeout(r, 2000));
        try {
          const verifyRes = await fetch(`/api/verify-tx/${submittedTxHash}?rpcUrl=${encodeURIComponent(rpcUrl)}`);
          const verifyData = await verifyRes.json();
          console.log(`[shelbynet] Verify attempt ${attempt + 1}:`, verifyData.status);
          if (verifyData.verified) {
            verified = true;
            break;
          }
          if (verifyData.status === "failed") {
            throw new Error(`Transaction failed on-chain: ${verifyData.vmStatus}`);
          }
        } catch (err: any) {
          if (err.message?.includes("failed on-chain")) throw err;
        }
      }

      if (!verified) {
        throw new Error("Transaction could not be confirmed. Please check your wallet network settings.");
      }

      setTxStage("Recording purchase...");

      const res = await apiRequest("POST", "/api/purchase", {
        contentId,
        buyerWallet: address,
        txHash: submittedTxHash,
        rpcUrl: walletNetworkUrl || undefined,
      });
      return res.json();
    },
    onSuccess: () => {
      setTxConfirming(false);
      setTxStage("");
      setAccessGranted(true);
      toast({
        title: "Access granted!",
        description: `Payment verified via Shelby Protocol. ${parseFloat(content?.priceShelbyUsd || "0").toString()} ShelbyUSD transferred. Starting stream...`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/access", contentId, address] });
      queryClient.invalidateQueries({ queryKey: ["/api/contents", contentId] });
      startStream();
    },
    onError: (error: Error) => {
      setTxConfirming(false);
      setTxStage("");
      queryClient.invalidateQueries({ queryKey: ["/api/shelbyusd-balance", address] });
      const msg = error.message;
      const isRejection = msg.includes("rejected") || msg.includes("cancelled") || msg.includes("denied");
      const isInsufficient = msg.includes("Insufficient") || msg.includes("insufficient") || msg.includes("INSUFFICIENT");
      const isShelbyUsd = msg.includes("ShelbyUSD") || msg.includes("fungible asset") || msg.includes("FA");
      const isFailedOnChain = msg.includes("failed on-chain");
      toast({
        title: isRejection
          ? "Transaction Rejected"
          : isInsufficient
          ? "Insufficient ShelbyUSD Balance"
          : isShelbyUsd
          ? "ShelbyUSD Payment Error"
          : isFailedOnChain
          ? "Transaction Failed On-Chain"
          : "Payment Failed",
        description: isInsufficient
          ? "You don't have enough ShelbyUSD. Make sure you have ShelbyUSD tokens in your Petra wallet."
          : msg,
        variant: "destructive",
      });
    },
  });

  async function startStream() {
    setIsStreaming(true);
    setStreamProgress(0);
    setFragmentsLoaded(0);
    setStreamLatency(null);

    try {
      const streamStart = performance.now();
      const res = await apiRequest("GET", `/api/stream/${contentId}?wallet=${address}`);
      const streamData: StreamData = await res.json();
      const initialLatency = Math.round(performance.now() - streamStart);
      setStreamLatency(streamData.latencyMs || initialLatency);
      setTotalFragments(streamData.totalFragments);

      const fragmentDelay = networkConfig?.shelby?.targetLatencyMs
        ? Math.max(50, networkConfig.shelby.targetLatencyMs / streamData.totalFragments)
        : 80;

      for (let i = 0; i < streamData.totalFragments; i++) {
        await new Promise((r) => setTimeout(r, fragmentDelay));
        setFragmentsLoaded(i + 1);
        setStreamProgress(Math.round(((i + 1) / streamData.totalFragments) * 100));
      }
    } catch {
      setStreamProgress(0);
      const interval = setInterval(() => {
        setStreamProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 4;
        });
      }, 150);
    }
  }

  if (contentLoading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="aspect-video w-full rounded-lg" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (!content) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-3">
          <FileText className="w-10 h-10 text-muted-foreground mx-auto" />
          <h2 className="text-lg font-semibold">Content not found</h2>
          <Link href="/">
            <Button variant="secondary">Back to Discover</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isVideo = content.contentType === "video";

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
        <Link href="/">
          <Button variant="ghost" size="sm" data-testid="button-back" className="rounded-full">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
        </Link>

        <div className="relative aspect-video bg-muted/30 rounded-xl overflow-hidden glass-card border-0">
          {content.thumbnailUrl && !isStreaming && (
            <img
              src={content.thumbnailUrl}
              alt={content.title}
              className="w-full h-full object-cover"
            />
          )}

          {isStreaming ? (
            streamProgress >= 100 && hasFile(content) ? (
              isVideo ? (
                <video
                  key={contentId}
                  controls
                  autoPlay
                  className="absolute inset-0 w-full h-full object-contain bg-black"
                  data-testid="video-player"
                  src={getFileUrl(content, address || "")}
                >
                  Your browser does not support the video tag.
                </video>
              ) : (
                <iframe
                  key={contentId}
                  src={getFileUrl(content, address || "")}
                  className="absolute inset-0 w-full h-full"
                  title={content.title}
                  data-testid="pdf-viewer"
                />
              )
            ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[hsl(225,25%,4%)] to-[hsl(250,30%,8%)] flex flex-col items-center justify-center space-y-4">
              <div className="text-center space-y-2">
                {isVideo ? (
                  <>
                    <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mx-auto animate-pulse shadow-lg shadow-primary/30">
                      <Play className="w-7 h-7 text-white" />
                    </div>
                    <p className="text-white text-sm font-medium mt-3">Streaming from Shelby Protocol</p>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mx-auto shadow-lg shadow-primary/30">
                      <FileText className="w-7 h-7 text-white" />
                    </div>
                    <p className="text-white text-sm font-medium mt-3">Loading document from Shelby Protocol</p>
                  </>
                )}
                <p className="text-white/40 text-xs font-mono">
                  Blob ID: {content.shelbyBlobId?.slice(0, 20)}...
                </p>
              </div>
              <div className="w-64 space-y-1.5">
                <Progress value={streamProgress} className="h-1.5" />
                <div className="flex items-center justify-between text-white/40 text-[10px] font-mono">
                  <span>
                    {streamProgress < 100
                      ? `Decoding fragments ${fragmentsLoaded}/${totalFragments || "..."}`
                      : "Stream ready"}
                  </span>
                  {streamLatency !== null && (
                    <span>{streamLatency}ms latency</span>
                  )}
                </div>
              </div>
              {streamProgress >= 100 && (
                <div className="flex flex-col items-center gap-3 mt-2">
                  <div className="flex items-center gap-2 flex-wrap justify-center">
                    <Badge className="gradient-primary text-white border-0 shadow-lg shadow-primary/20">
                      <Zap className="w-3 h-3 mr-1" />
                      Hot Storage Active
                    </Badge>
                    <Badge variant="secondary" className="text-[10px] font-mono">
                      {totalFragments} fragments
                    </Badge>
                    {streamLatency !== null && (
                      <Badge variant="secondary" className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border-emerald-500/20">
                        Streamed in {streamLatency}ms via Shelby
                      </Badge>
                    )}
                  </div>
                  {!hasFile(content) && (
                  <p className="text-white/50 text-xs text-center max-w-xs">
                    This is demo content. Real uploaded files stream directly from Shelby Protocol.
                  </p>
                  )}
                </div>
              )}
            </div>
            )
          ) : (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center">
              {accessGranted ? (
                <button
                  onClick={startStream}
                  data-testid="button-stream"
                  className="gradient-primary text-white px-6 py-3 rounded-full text-sm font-medium inline-flex items-center gap-2 transition-all duration-200 hover:shadow-lg hover:shadow-primary/30 hover:scale-105 cursor-pointer"
                >
                  <Play className="w-5 h-5" />
                  Stream Content
                </button>
              ) : (
                <div className="text-center space-y-3">
                  <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center mx-auto">
                    <Lock className="w-6 h-6 text-white/70" />
                  </div>
                  <p className="text-white text-sm font-medium">Pay to unlock this content</p>
                  {!connected ? (
                    <button
                      onClick={connect}
                      data-testid="button-connect-to-purchase"
                      className="gradient-primary text-white px-5 py-2.5 rounded-full text-sm font-medium inline-flex items-center gap-2 transition-all duration-200 hover:shadow-lg hover:shadow-primary/25 cursor-pointer"
                    >
                      <Wallet className="w-4 h-4" />
                      Connect Wallet
                    </button>
                  ) : (
                    <div className="space-y-2">
                      {shelbyBalance !== undefined && (
                        <div className={`text-[10px] px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 ${
                          shelbyBalance.hasBalance
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        }`}>
                          <Coins className="w-3 h-3" />
                          Your balance: {shelbyBalance.balanceFormatted} ShelbyUSD
                        </div>
                      )}
                      {shelbyBalance && !shelbyBalance.hasBalance && (
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 max-w-[240px] mx-auto">
                          <p className="text-amber-400 text-[10px] flex items-start gap-1.5">
                            <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                            <span>You need ShelbyUSD to unlock this content. Get ShelbyUSD from the Shelby Protocol faucet.</span>
                          </p>
                        </div>
                      )}
                      <button
                        onClick={() => purchaseMutation.mutate()}
                        disabled={purchaseMutation.isPending || txConfirming}
                        data-testid="button-purchase"
                        className="gradient-primary text-white px-5 py-2.5 rounded-full text-sm font-medium inline-flex items-center gap-2 transition-all duration-200 hover:shadow-lg hover:shadow-primary/25 disabled:opacity-50 cursor-pointer"
                      >
                        {txConfirming ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            {txStage || "Processing..."}
                          </>
                        ) : purchaseMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Initiating...
                          </>
                        ) : (
                          <>
                            <Unlock className="w-4 h-4" />
                            Pay {parseFloat(content.priceShelbyUsd).toString()} ShelbyUSD to Unlock
                          </>
                        )}
                      </button>
                      <p className="text-white/30 text-[10px] flex items-center justify-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        On-chain payment via Shelby Protocol
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div className="space-y-1">
              <h1 className="text-xl font-bold tracking-tight" data-testid="text-content-title">{content.title}</h1>
              {creator && (
                <p className="text-sm text-muted-foreground" data-testid="text-creator-name">
                  by {creator.displayName}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="text-xs">
                {isVideo ? "Video" : "PDF"}
              </Badge>
              <Badge className="gradient-primary text-white border-0 text-xs">
                {parseFloat(content.priceShelbyUsd).toString()} ShelbyUSD
              </Badge>
              {accessGranted && (
                <Badge variant="secondary" className="text-xs" data-testid="badge-access-granted">
                  <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-400" />
                  Access Granted
                </Badge>
              )}
            </div>
          </div>

          {content.description && (
            <p className="text-sm text-muted-foreground leading-relaxed" data-testid="text-content-description">
              {content.description}
            </p>
          )}

          {txHash && (
            <div className="glass-card rounded-lg p-3 space-y-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <p className="text-xs text-muted-foreground font-medium">Transaction Confirmed</p>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-mono text-foreground/70 break-all flex-1" data-testid="text-tx-hash">
                  {txHash}
                </p>
                <a
                  href={`https://explorer.aptoslabs.com/txn/${txHash}?network=testnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80 transition-colors flex-shrink-0"
                  data-testid="link-explorer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="glass-card rounded-lg p-3 text-center">
              <Eye className="w-4 h-4 text-primary/60 mx-auto mb-1" />
              <p className="text-lg font-bold">{content.totalViews || 0}</p>
              <p className="text-xs text-muted-foreground">Views</p>
            </div>
            <div className="glass-card rounded-lg p-3 text-center">
              <Coins className="w-4 h-4 text-primary/60 mx-auto mb-1" />
              <p className="text-lg font-bold">{parseFloat(content.totalEarned || "0").toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">ShelbyUSD Earned</p>
            </div>
            <div className="glass-card rounded-lg p-3 text-center">
              <Zap className="w-4 h-4 text-primary/60 mx-auto mb-1" />
              <p className="text-lg font-bold">Shelby</p>
              <p className="text-xs text-muted-foreground">Storage</p>
            </div>
            <div className="glass-card rounded-lg p-3 text-center">
              <Lock className="w-4 h-4 text-primary/60 mx-auto mb-1" />
              <p className="text-lg font-bold">On-chain</p>
              <p className="text-xs text-muted-foreground">Access</p>
            </div>
          </div>

          {content.shelbyBlobId && (
            <div className="glass-card rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-muted-foreground font-medium">Shelby Blob ID</p>
                {contentLoadMs !== null && (
                  <span className="text-[10px] font-mono text-emerald-400/80" data-testid="text-content-load-time">
                    Loaded in {contentLoadMs}ms via Shelby
                  </span>
                )}
              </div>
              <p className="text-xs font-mono break-all text-foreground/70" data-testid="text-blob-id">
                {content.shelbyBlobId}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
