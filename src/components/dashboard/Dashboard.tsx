import { useEffect, useState } from "react";
import { SummaryCards } from "./SummaryCards";
import { AdsList } from "./AdsList";
import { DashboardSkeleton as LoadingSkeleton } from "./LoadingSkeleton";
import { ErrorState } from "./ErrorState";
import { EmptyState } from "./EmptyState";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import type { AdSummary, CreativeRecord, Snapshot } from "@/types/snapshot";

export function Dashboard() {
  const [activeTab, setActiveTab] = useState<
    "new" | "removed" | "changed" | "active"
  >("new");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState<CreativeRecord[]>([]);
  const [removed, setRemoved] = useState<CreativeRecord[]>([]);
  const [changed, setChanged] = useState<CreativeRecord[]>([]);
  const [active, setActive] = useState<CreativeRecord[]>([]);
  const [summary, setSummary] = useState<AdSummary | null>(null);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const API_URL = import.meta.env.VITE_RADAR_API_URL;
        const response = await fetch(API_URL);
        if (!response.ok) {
          throw new Error(`Failed to fetch ads: ${response.status}`);
        }
        const data = (await response.json()) as Snapshot;

        const normalizeMedia = (imagesValue: unknown, videosValue: unknown) => {
          const toArray = (value: unknown): string[] => {
            if (Array.isArray(value)) {
              return value.filter((item): item is string => typeof item === "string");
            }
            if (value && typeof value === "object") {
              const obj = value as Record<string, unknown>;
              const candidate = obj.image ?? obj.images ?? obj.url ?? obj.src;
              if (typeof candidate === "string") return [candidate];
              if (Array.isArray(candidate)) {
                return candidate.filter((item): item is string => typeof item === "string");
              }
            }
            if (typeof value === "string") return [value];
            return [];
          };

          return {
            images: toArray(imagesValue),
            videos: toArray(videosValue),
          };
        };

        const mapRaw = (
          ad: CreativeRecord & Record<string, unknown>
        ): CreativeRecord => {
          const region =
            typeof ad.region === "string"
              ? ad.region
              : typeof (ad.regions as { region?: unknown } | undefined)?.region === "string"
                ? (ad.regions as { region?: string }).region ?? null
                : null;

          const media = normalizeMedia(
            ad.media?.images ?? ad.images,
            ad.media?.videos ?? ad.videos
          );

          const advertiserId =
            typeof ad.advertiser_id === "string" ? ad.advertiser_id : null;
          const creativeId = typeof ad.creative_id === "string" ? ad.creative_id : "";

          return {
            creative_id: creativeId,
            advertiser_id: advertiserId,
            title: typeof ad.title === "string" ? ad.title : null,
            snippet: typeof ad.snippet === "string" ? ad.snippet : null,
            url:
              typeof ad.url === "string"
                ? ad.url
                : advertiserId
                  ? `https://adstransparency.google.com/advertiser/${advertiserId}/creative/${creativeId}`
                  : `https://adstransparency.google.com/advertiser//creative/${creativeId}`,
            region,
            format:
              typeof ad.format === "string"
                ? ad.format
                : typeof ad.media_format === "string"
                  ? ad.media_format
                  : null,
            media,
            first_seen:
              typeof ad.first_seen === "string"
                ? ad.first_seen
                : typeof ad.first_seen_api === "string"
                  ? ad.first_seen_api
                  : typeof ad.became_new_date === "string"
                    ? ad.became_new_date
                    : null,
            last_seen:
              typeof ad.last_seen === "string"
                ? ad.last_seen
                : typeof ad.last_seen_api === "string"
                  ? ad.last_seen_api
                  : typeof ad.snapshot_date === "string"
                    ? ad.snapshot_date
                    : null,
            status: typeof ad.status === "string" ? ad.status : null,
            became_new_date:
              typeof ad.became_new_date === "string" ? ad.became_new_date : null,
            changed_date:
              typeof ad.changed_date === "string" ? ad.changed_date : null,
            removed_date:
              typeof ad.removed_date === "string"
                ? ad.removed_date
                : typeof ad.became_removed_date === "string"
                  ? ad.became_removed_date
                  : null,
            became_removed_date:
              typeof ad.became_removed_date === "string"
                ? ad.became_removed_date
                : null,
            last_seen_global:
              typeof ad.last_seen_global === "string"
                ? ad.last_seen_global
                : null,
          };
        };

        const nextActive = (data.current_ads ?? data.active ?? []).map(mapRaw);
        const nextAdded = (data.added ?? data.new ?? []).map(mapRaw);
        const nextRemoved = (data.removed ?? []).map(mapRaw);
        const nextChanged = (data.changed ?? []).map(mapRaw);
        const fallbackSummary: AdSummary = {
          total_ads: nextActive.length,
          last_week: 0,
          added_count: nextAdded.length,
          removed_count: nextRemoved.length,
          changed_count: nextChanged.length,
          active_count: nextActive.length,
        };
        const nextSummary: AdSummary = data.summary
          ? {
              ...data.summary,
              last_week: data.summary.last_week ?? 0,
            }
          : fallbackSummary;

        if (!isMounted) return;
        setActive(nextActive);
        setAdded(nextAdded);
        setRemoved(nextRemoved);
        setChanged(nextChanged);
        setSummary(nextSummary);
      } catch (err) {
        if (!isMounted) return;
        const message =
          err instanceof Error ? err.message : "Failed to fetch ads";
        setError(message);
        setActive([]);
        setAdded([]);
        setRemoved([]);
        setChanged([]);
        setSummary(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void load();
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  if (!summary) {
    return <EmptyState />;
  }

  const adsByTab = {
    new: {
      list: added,
      type: "added" as const,
      emptyMessage: "No new ads detected today",
    },
    active: {
      list: active,
      type: "active" as const,
      emptyMessage: "No active ads available",
    },
    removed: {
      list: removed,
      type: "removed" as const,
      emptyMessage: "No ads were removed today",
    },
    changed: {
      list: changed,
      type: "changed" as const,
      emptyMessage: "No ads were modified today",
    },
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Summary Cards */}
      <SummaryCards summary={summary} />

      <Tabs
        value={activeTab}
        onValueChange={(value) =>
          setActiveTab(value as "new" | "removed" | "changed" | "active")
        }
        defaultValue="new"
        className="space-y-6"
      >
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="new" className="gap-2">
            New Ads
            <Badge variant="secondary" className="ml-1 bg-success/10 text-success">
              {summary.added_count}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="active" className="gap-2">
            Active Ads
            <Badge variant="secondary" className="ml-1 bg-primary/10 text-primary">
              {active.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="removed" className="gap-2">
            Removed
            <Badge
              variant="secondary"
              className="ml-1 bg-destructive/10 text-destructive"
            >
              {summary.removed_count}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="changed" className="gap-2">
            Changed
            <Badge variant="secondary" className="ml-1 bg-warning/10 text-warning">
              {summary.changed_count}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="new" className="mt-6">
          <AdsList
            ads={adsByTab.new.list}
            type={adsByTab.new.type}
            emptyMessage={adsByTab.new.emptyMessage}
          />
        </TabsContent>
        <TabsContent value="active" className="mt-6">
          <AdsList
            ads={adsByTab.active.list}
            type={adsByTab.active.type}
            emptyMessage={adsByTab.active.emptyMessage}
          />
        </TabsContent>
        <TabsContent value="removed" className="mt-6">
          <AdsList
            ads={adsByTab.removed.list}
            type={adsByTab.removed.type}
            emptyMessage={adsByTab.removed.emptyMessage}
          />
        </TabsContent>
        <TabsContent value="changed" className="mt-6">
          <AdsList
            ads={adsByTab.changed.list}
            type={adsByTab.changed.type}
            emptyMessage={adsByTab.changed.emptyMessage}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
