import { ExternalLink, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { CreativeRecord } from "@/types/snapshot";

const fmt = (d?: string | null) => (d ? d.split("T")[0] : "");

interface AdCardProps {
  ad: CreativeRecord;
  type: "active" | "added" | "removed" | "changed";
}

function getTransparencyUrl(
  advertiserId?: string,
  creativeId?: string
): string | null {
  if (!advertiserId || !creativeId) return null;
  return `https://adstransparency.google.com/advertiser/${advertiserId}/creative/${creativeId}`;
}

export function AdCard({ ad, type }: AdCardProps) {
  const transparencyUrl = getTransparencyUrl(ad.advertiser_id, ad.creative_id);
  const title = ad.title || "Untitled";
  const images = Array.isArray(ad.media?.images) ? ad.media.images : [];
  const videos = Array.isArray(ad.media?.videos) ? ad.media.videos : [];

  const imageUrl = (() => {
    const rawImages =
      (ad as { images?: unknown }).images ?? (ad.media as { images?: unknown } | undefined)?.images;
    if (rawImages && typeof rawImages === "object" && !Array.isArray(rawImages)) {
      const candidate = rawImages as { image?: unknown; url?: unknown; src?: unknown };
      if (typeof candidate.image === "string") return candidate.image;
      if (typeof candidate.url === "string") return candidate.url;
      if (typeof candidate.src === "string") return candidate.src;
    }
    if (Array.isArray(rawImages)) {
      const first = rawImages[0];
      if (typeof first === "string") return first;
      if (first && typeof first === "object") {
        const candidate = first as { url?: unknown; src?: unknown };
        if (typeof candidate.url === "string") return candidate.url;
        if (typeof candidate.src === "string") return candidate.src;
      }
    }
    const first = images[0];
    if (typeof first === "string") return first;
    return null;
  })();

  const typeStyles = {
    active: "border-l-4 border-l-primary",
    added: "border-l-4 border-l-success",
    removed: "border-l-4 border-l-destructive",
    changed: "border-l-4 border-l-warning",
  };

  return (
    <div
      className={`rounded-lg bg-card p-4 shadow-card transition-all hover:shadow-md animate-fade-in ${typeStyles[type]}`}
    >
      <div className="flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            
            <p className="text-xs text-muted-foreground mt-0.5">
              ID: {ad.creative_id || "Unknown"}
            </p>
          </div>
        </div>

        {/* Region */}
        <div className="flex flex-wrap gap-1.5">
          <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
          <Badge variant="secondary" className="text-xs">
            {ad.region}
          </Badge>
        </div>

        {/* Format */}
        <div className="text-sm text-muted-foreground">
          Format: <span className="text-card-foreground">{ad.format}</span>
        </div>

        {ad.became_new_date && (
          <div className="text-sm text-muted-foreground">
            New since:{" "}
            <span className="text-card-foreground">
              {fmt(ad.became_new_date)}
            </span>
          </div>
        )}

        {ad.changed_date && (
          <div className="text-sm text-muted-foreground">
            Last modified:{" "}
            <span className="text-card-foreground">
              {fmt(ad.changed_date)}
            </span>
          </div>
        )}

        {ad.became_removed_date && (
          <div className="text-sm text-muted-foreground">
            Removed on:{" "}
            <span className="text-card-foreground">
              {fmt(ad.became_removed_date)}
            </span>
          </div>
        )}

        {ad.last_seen_global && (
          <div className="text-sm text-muted-foreground">
            Last seen:{" "}
            <span className="text-card-foreground">
              {fmt(ad.last_seen_global)}
            </span>
          </div>
        )}

        {/* Thumbnail */}
        {imageUrl && (
          <div className="w-full h-48 flex items-center justify-center overflow-hidden bg-gray-100 rounded-md">
            <img
              src={imageUrl}
              alt={title}
              className="max-h-full max-w-full object-contain"
              loading="lazy"
            />
          </div>
        )}

        {/* Media counts */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>
            {images.length} images • {videos.length} videos
          </span>
        </div>

        {/* Action button */}
        {transparencyUrl && (
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-1"
            asChild
          >
            <a
              href={transparencyUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              View on Google Ads Transparency
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}
