export interface AdSummary {
  total_ads: number;
  last_week: number | null;
  added_count: number;
  removed_count: number;
  changed_count: number;
  active_count: number;
}

export interface CreativeRecord {
  creative_id: string;
  advertiser_id: string | null;
  title: string | null;
  snippet: string | null;
  url: string | null;
  region: string | null;
  format: string | null;
  media: {
    images: unknown[];
    videos: unknown[];
  };
  first_seen: string | null;
  last_seen: string | null;
  status?: "new" | "active" | "removed" | "changed" | string | null;
  became_new_date?: string | null;
  changed_date?: string | null;
  removed_date?: string | null;
}

export interface Snapshot {
  summary?: AdSummary;
  current_ads?: CreativeRecord[];
  active?: CreativeRecord[];
  new?: CreativeRecord[];
  added?: CreativeRecord[];
  removed?: CreativeRecord[];
  changed?: CreativeRecord[];
}
