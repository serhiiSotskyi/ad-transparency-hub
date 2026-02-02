import { ExternalLink, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { CreativeRecord } from "@/types/snapshot";

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
    const first = images[0];
    if (typeof first === "string") {
      return first;
    }
    if (first && typeof first === "object") {
      const candidate = first as { url?: unknown; src?: unknown };
      if (typeof candidate.url === "string") {
        return candidate.url;
      }
      if (typeof candidate.src === "string") {
        return candidate.src;
      }
    }
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
            <h3 className="font-medium text-card-foreground truncate">{title}</h3>
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

        {/* Dates */}
        <div className="text-sm text-muted-foreground">
          First seen:{" "}
          <span className="text-card-foreground">{ad.first_seen}</span>
          {" • "}Last seen:{" "}
          <span className="text-card-foreground">{ad.last_seen}</span>
        </div>

        {ad.status === "new" && ad.became_new_date && (
          <div className="text-sm text-muted-foreground">
            New since:{" "}
            <span className="text-card-foreground">{ad.became_new_date}</span>
          </div>
        )}

        {ad.status === "changed" && ad.changed_date && (
          <div className="text-sm text-muted-foreground">
            Changed on:{" "}
            <span className="text-card-foreground">{ad.changed_date}</span>
          </div>
        )}

        {ad.status === "removed" && ad.removed_date && (
          <div className="text-sm text-muted-foreground">
            Removed on:{" "}
            <span className="text-card-foreground">{ad.removed_date}</span>
          </div>
        )}

        {ad.status === "active" && ad.first_seen && (
          <div className="text-sm text-muted-foreground">
            Active since:{" "}
            <span className="text-card-foreground">{ad.first_seen}</span>
          </div>
        )}

        {/* Thumbnail */}
        {imageUrl && (
          <div className="overflow-hidden rounded-md border border-border">
            <img
              src={imageUrl}
              alt={title}
              className="h-32 w-full object-cover"
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
