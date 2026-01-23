import { ExternalLink, Image, Video, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Ad, ChangedAd } from "@/types/snapshot";

interface AdCardProps {
  ad: Ad | ChangedAd;
  type: "new" | "removed" | "changed";
}

function getTransparencyUrl(advertiserId?: string, creativeId?: string): string | null {
  if (!advertiserId || !creativeId) return null;
  return `https://adstransparency.google.com/advertiser/${advertiserId}/creative/${creativeId}`;
}

function getRegions(ad: Ad): string[] {
  return ad.regions || ad.region || [];
}

function getMediaCounts(ad: Ad): { images: number; videos: number } {
  if (ad.media) {
    return {
      images: ad.media.images || 0,
      videos: ad.media.videos || 0,
    };
  }
  return {
    images: ad.image_count || 0,
    videos: ad.video_count || 0,
  };
}

function isChangedAd(ad: Ad | ChangedAd): ad is ChangedAd {
  return "changes" in ad || "diff" in ad;
}

export function AdCard({ ad, type }: AdCardProps) {
  const transparencyUrl = getTransparencyUrl(ad.advertiser_id, ad.creative_id);
  const regions = getRegions(ad);
  const media = getMediaCounts(ad);
  const title = ad.title || "Untitled Ad";

  const typeStyles = {
    new: "border-l-4 border-l-success",
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
            {ad.creative_id && (
              <p className="text-xs text-muted-foreground mt-0.5">
                ID: {ad.creative_id}
              </p>
            )}
          </div>
        </div>

        {/* Regions */}
        {regions.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
            {regions.slice(0, 5).map((region, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {region}
              </Badge>
            ))}
            {regions.length > 5 && (
              <Badge variant="secondary" className="text-xs">
                +{regions.length - 5} more
              </Badge>
            )}
          </div>
        )}

        {/* Media counts */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {media.images > 0 && (
            <span className="flex items-center gap-1">
              <Image className="h-4 w-4" />
              {media.images} image{media.images !== 1 ? "s" : ""}
            </span>
          )}
          {media.videos > 0 && (
            <span className="flex items-center gap-1">
              <Video className="h-4 w-4" />
              {media.videos} video{media.videos !== 1 ? "s" : ""}
            </span>
          )}
          {media.images === 0 && media.videos === 0 && (
            <span className="text-muted-foreground/60">No media assets</span>
          )}
        </div>

        {/* Changed fields */}
        {type === "changed" && isChangedAd(ad) && (
          <div className="rounded-md bg-secondary/50 p-3 space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Changes Detected
            </p>
            {ad.changes?.map((change, i) => (
              <div key={i} className="text-sm">
                <span className="font-medium text-card-foreground">
                  {change.field}:
                </span>{" "}
                <span className="text-destructive line-through">
                  {JSON.stringify(change.before)}
                </span>{" "}
                →{" "}
                <span className="text-success">
                  {JSON.stringify(change.after)}
                </span>
              </div>
            ))}
            {ad.diff &&
              Object.entries(ad.diff).map(([field, { before, after }]) => (
                <div key={field} className="text-sm">
                  <span className="font-medium text-card-foreground">
                    {field}:
                  </span>{" "}
                  <span className="text-destructive line-through">
                    {JSON.stringify(before)}
                  </span>{" "}
                  →{" "}
                  <span className="text-success">{JSON.stringify(after)}</span>
                </div>
              ))}
          </div>
        )}

        {/* Final URL */}
        {ad.final_url && (
          <a
            href={ad.final_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline truncate"
          >
            {ad.final_url}
          </a>
        )}

        {/* Action button */}
        {transparencyUrl && (
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-1"
            onClick={() => window.open(transparencyUrl, "_blank")}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            View on Google Ads Transparency
          </Button>
        )}
      </div>
    </div>
  );
}
