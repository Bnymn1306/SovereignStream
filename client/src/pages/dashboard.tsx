import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ContentCard } from "@/components/content-card";
import { useWallet } from "@/components/wallet-context";
import { Link } from "wouter";
import { Coins, Eye, FileText, Upload, Wallet, TrendingUp } from "lucide-react";
import type { Content, Creator } from "@shared/schema";

export default function Dashboard() {
  const { connected, address, connect } = useWallet();

  const { data: creator, isLoading: creatorLoading } = useQuery<Creator>({
    queryKey: ["/api/creators/wallet", address],
    enabled: connected && !!address,
  });

  const { data: myContents, isLoading: contentsLoading } = useQuery<Content[]>({
    queryKey: ["/api/contents/creator", creator?.id],
    enabled: !!creator?.id,
  });

  if (!connected) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mx-auto shadow-lg shadow-primary/25">
            <Wallet className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold" data-testid="text-connect-prompt">Connect Your Wallet</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Connect your wallet to access your creator dashboard and manage your content on Shelby Protocol.
          </p>
          <button
            onClick={connect}
            data-testid="button-connect-wallet"
            className="gradient-primary text-white px-6 py-2.5 rounded-full text-sm font-medium inline-flex items-center gap-2 transition-all duration-200 hover:shadow-lg hover:shadow-primary/25 cursor-pointer"
          >
            <Wallet className="w-4 h-4" />
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  if (creatorLoading) {
    return (
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" data-testid="text-dashboard-title">
              Creator Dashboard
            </h1>
            <p className="text-sm text-muted-foreground">
              {creator ? `Welcome back, ${creator.displayName}` : "Set up your creator profile to get started"}
            </p>
          </div>
          <Link href="/upload">
            <button className="gradient-primary text-white px-4 py-2 rounded-full text-sm font-medium inline-flex items-center gap-2 transition-all duration-200 hover:shadow-lg hover:shadow-primary/25 cursor-pointer" data-testid="button-upload-new">
              <Upload className="w-4 h-4" />
              Upload Content
            </button>
          </Link>
        </div>

        {creator ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="glass-card rounded-lg p-4">
                <div className="flex items-center justify-between gap-1 mb-2">
                  <span className="text-xs text-muted-foreground font-medium">Total Earned</span>
                  <Coins className="w-4 h-4 text-primary/60" />
                </div>
                <p className="text-2xl font-bold glow-text" data-testid="text-total-earned">
                  {parseFloat(creator.totalEarned || "0").toFixed(4)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">ShelbyUSD</p>
              </div>
              <div className="glass-card rounded-lg p-4">
                <div className="flex items-center justify-between gap-1 mb-2">
                  <span className="text-xs text-muted-foreground font-medium">Total Views</span>
                  <Eye className="w-4 h-4 text-primary/60" />
                </div>
                <p className="text-2xl font-bold" data-testid="text-total-views">
                  {creator.totalViews || 0}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">across all content</p>
              </div>
              <div className="glass-card rounded-lg p-4">
                <div className="flex items-center justify-between gap-1 mb-2">
                  <span className="text-xs text-muted-foreground font-medium">Published</span>
                  <FileText className="w-4 h-4 text-primary/60" />
                </div>
                <p className="text-2xl font-bold" data-testid="text-total-content">
                  {myContents?.length || 0}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">items</p>
              </div>
            </div>

            {contentsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-video w-full rounded-lg" />
                ))}
              </div>
            ) : myContents && myContents.length > 0 ? (
              <div>
                <h2 className="text-lg font-semibold mb-3">Your Content</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {myContents.map((content) => (
                    <ContentCard key={content.id} content={content} creatorName={creator.displayName} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 space-y-3">
                <div className="w-14 h-14 rounded-full gradient-primary flex items-center justify-center mx-auto opacity-60">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold">No content yet</h3>
                <p className="text-sm text-muted-foreground">Upload your first video or document to start earning</p>
                <Link href="/upload">
                  <Button variant="secondary" data-testid="button-upload-first">Upload Content</Button>
                </Link>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 space-y-3">
            <div className="w-14 h-14 rounded-full gradient-primary flex items-center justify-center mx-auto opacity-60">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold">No creator profile found</h3>
            <p className="text-sm text-muted-foreground">Upload content to automatically create your profile</p>
            <Link href="/upload">
              <button className="gradient-primary text-white px-5 py-2 rounded-full text-sm font-medium inline-flex items-center gap-2 transition-all duration-200 hover:shadow-lg hover:shadow-primary/25 cursor-pointer" data-testid="button-create-profile">Get Started</button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
