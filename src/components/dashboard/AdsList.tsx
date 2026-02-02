import { AdCard } from "./AdCard";
import type { CreativeRecord } from "@/types/snapshot";
import { FileX2 } from "lucide-react";

interface AdsListProps {
  ads: CreativeRecord[];
  type: "active" | "added" | "removed" | "changed";
  emptyMessage: string;
}

export function AdsList({ ads, type, emptyMessage }: AdsListProps) {
  if (ads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileX2 className="h-12 w-12 text-muted-foreground/40 mb-4" />
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {ads.map((ad, index) => (
        <AdCard key={ad.creative_id || index} ad={ad} type={type} />
      ))}
    </div>
  );
}
