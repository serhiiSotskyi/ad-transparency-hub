export interface AdSummary {
  total_ads: number;
  last_week: number;
  added_count: number;
  removed_count: number;
  changed_count: number;
}

export interface Ad {
  advertiser_id?: string;
  creative_id?: string;
  title?: string;
  region?: string[];
  regions?: string[];
  final_url?: string;
  media?: {
    images?: number;
    videos?: number;
  };
  image_count?: number;
  video_count?: number;
}

export interface ChangedAd extends Ad {
  changes?: {
    field: string;
    before: unknown;
    after: unknown;
  }[];
  diff?: Record<string, { before: unknown; after: unknown }>;
}

export interface Snapshot {
  id: string;
  timestamp: string;
  summary: AdSummary;
  ads: {
    current: Ad[];
    new: Ad[];
    removed: Ad[];
    changed: ChangedAd[];
  };
  created_at: string;
  hasData: boolean;
}

export interface SnapshotResponse extends Snapshot {
  message?: string;
}
