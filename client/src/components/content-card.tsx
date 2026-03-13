import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, FileText, Eye, Coins, Zap } from "lucide-react";
import { Link } from "wouter";
import type { Content } from "@shared/schema";

interface ContentCardProps {
  content: Content;
  creatorName?: string;
}

export function ContentCard({ content, creatorName }: ContentCardProps) {
  const isVideo = content.contentType === "video";

  return (
    <Link href={`/content/${content.id}`}>
      <div
        className="glass-card group cursor-pointer rounded-lg overflow-hidden"
        data-testid={`card-content-${content.id}`}
      >
        <div className="relative aspect-video bg-muted/50">
          {content.thumbnailUrl ? (
            <img
              src={content.thumbnailUrl}
              alt={content.title}
              className="w-full h-full object-cover"
              data-testid={`img-thumbnail-${content.id}`}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/10">
              {isVideo ? (
                <Play className="w-10 h-10 text-muted-foreground/60" />
              ) : (
                <FileText className="w-10 h-10 text-muted-foreground/60" />
              )}
            </div>
          )}
          <div className="absolute top-2 left-2 flex gap-1">
            <Badge variant="secondary" className="bg-black/40 text-white border-white/10 backdrop-blur-sm text-[10px]">
              {isVideo ? "Video" : "PDF"}
            </Badge>
          </div>
          <div className="absolute bottom-2 right-2">
            <Badge className="gradient-primary text-white border-0 text-[10px] font-semibold">
              {parseFloat(content.priceShelbyUsd).toString()} ShelbyUSD
            </Badge>
          </div>
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
            <Button
              size="icon"
              className="opacity-0 group-hover:opacity-100 transition-all duration-300 scale-90 group-hover:scale-100 gradient-primary text-white border-0"
              data-testid={`button-play-${content.id}`}
            >
              <Play className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="p-3.5 space-y-1.5">
          <h3
            className="font-semibold text-sm line-clamp-1 tracking-tight"
            data-testid={`text-title-${content.id}`}
          >
            {content.title}
          </h3>
          {content.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {content.description}
            </p>
          )}
          <div className="flex items-center justify-between gap-1 pt-1.5">
            {creatorName && (
              <span className="text-xs text-muted-foreground truncate font-medium">{creatorName}</span>
            )}
            <div className="flex items-center gap-2.5 text-xs text-muted-foreground ml-auto flex-wrap">
              <span className="flex items-center gap-1 text-emerald-400/70">
                <Zap className="w-3 h-3" />
                Shelby
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {content.totalViews || 0}
              </span>
              <span className="flex items-center gap-1">
                <Coins className="w-3 h-3" />
                {parseFloat(content.totalEarned || "0").toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
