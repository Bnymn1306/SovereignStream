import { useQuery } from "@tanstack/react-query";
import { ContentCard } from "@/components/content-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Zap, TrendingUp, Shield, Timer } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useRef } from "react";
import type { Content, Creator } from "@shared/schema";

export default function Discover() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "video" | "pdf">("all");
  const [loadTimeMs, setLoadTimeMs] = useState<number | null>(null);
  const loadStart = useRef(performance.now());

  const { data: contents, isLoading: contentsLoading } = useQuery<Content[]>({
    queryKey: ["/api/contents"],
  });

  const { data: creators } = useQuery<Creator[]>({
    queryKey: ["/api/creators"],
  });

  useEffect(() => {
    if (contents && !loadTimeMs) {
      setLoadTimeMs(Math.round(performance.now() - loadStart.current));
    }
  }, [contents, loadTimeMs]);

  const creatorsMap = new Map(creators?.map((c) => [c.id, c]) || []);

  const filtered = contents?.filter((c) => {
    const matchesSearch =
      !searchQuery ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || c.contentType === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="h-full overflow-y-auto">
      <div className="relative hero-gradient border-b border-border/50">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(250_80%_62%_/_0.08),_transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_hsl(280_80%_55%_/_0.06),_transparent_60%)]" />
        <div className="relative max-w-5xl mx-auto px-6 py-14">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-md gradient-primary flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold glow-text tracking-wide uppercase">Decentralized Content</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3" data-testid="text-hero-title">
            Pay-per-View Content
            <span className="glow-text"> Marketplace</span>
          </h1>
          <p className="text-muted-foreground text-sm max-w-lg mb-8 leading-relaxed">
            Stream videos and documents with instant micropayments via Shelby Protocol. Creators earn directly, viewers pay only for what they watch.
          </p>
          <div className="flex items-center gap-5 flex-wrap">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-5 h-5 rounded-full gradient-primary flex items-center justify-center">
                <TrendingUp className="w-2.5 h-2.5 text-white" />
              </div>
              <span>Sub-second latency via Shelby Protocol</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-5 h-5 rounded-full gradient-primary flex items-center justify-center">
                <Shield className="w-2.5 h-2.5 text-white" />
              </div>
              <span>On-chain access rights</span>
            </div>
            {loadTimeMs !== null && (
              <div className="flex items-center gap-2 text-xs text-emerald-400/80 font-mono" data-testid="text-load-time">
                <div className="w-5 h-5 rounded-full bg-emerald-500/15 flex items-center justify-center">
                  <Timer className="w-2.5 h-2.5 text-emerald-400" />
                </div>
                <span>Loaded in {loadTimeMs}ms via Shelby</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-card/60 backdrop-blur-sm border-border/50"
              data-testid="input-search"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {(["all", "video", "pdf"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`filter-badge px-3 py-1.5 rounded-full text-xs font-medium capitalize cursor-pointer border ${
                  filterType === type
                    ? "filter-badge-active gradient-primary text-white border-transparent"
                    : "bg-card/60 backdrop-blur-sm text-muted-foreground border-border/50 hover:border-primary/30 hover:text-foreground"
                }`}
                data-testid={`badge-filter-${type}`}
              >
                {type === "all" ? "All" : type === "video" ? "Videos" : "Documents"}
              </button>
            ))}
          </div>
        </div>

        {contentsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="glass-card rounded-lg overflow-hidden">
                <Skeleton className="aspect-video w-full" />
                <div className="p-3.5 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered && filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((content) => (
              <ContentCard
                key={content.id}
                content={content}
                creatorName={creatorsMap.get(content.creatorId)?.displayName}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 space-y-3">
            <div className="w-14 h-14 rounded-full gradient-primary flex items-center justify-center mx-auto opacity-60">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold">No content found</h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery ? "Try a different search term" : "Be the first to upload content!"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
