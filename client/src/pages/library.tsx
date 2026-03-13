import { useQuery } from "@tanstack/react-query";
import { useWallet } from "@/components/wallet-context";
import { ContentCard } from "@/components/content-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Wallet } from "lucide-react";
import { Link } from "wouter";
import type { Content, Purchase } from "@shared/schema";

export default function Library() {
  const { connected, address, connect } = useWallet();

  const { data: purchases, isLoading } = useQuery<(Purchase & { content: Content })[]>({
    queryKey: ["/api/purchases", address],
    enabled: connected && !!address,
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
            Connect your wallet to view your purchased content on Shelby Protocol.
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

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-library-title">My Library</h1>
          <p className="text-sm text-muted-foreground">Content you've purchased and unlocked</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="glass-card rounded-lg overflow-hidden">
                <Skeleton className="aspect-video w-full" />
                <div className="p-3.5 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : purchases && purchases.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {purchases.map((purchase) => (
              <ContentCard key={purchase.id} content={purchase.content} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 space-y-3">
            <div className="w-14 h-14 rounded-full gradient-primary flex items-center justify-center mx-auto opacity-60">
              <ShoppingBag className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold">Your library is empty</h3>
            <p className="text-sm text-muted-foreground">
              Browse and purchase content to build your library
            </p>
            <Link href="/">
              <Button variant="secondary" data-testid="button-browse">Browse Content</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
