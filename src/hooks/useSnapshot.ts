import { useCallback, useEffect, useState } from "react";
import type { AdSummary, CreativeRecord } from "@/types/snapshot";

const WEBHOOK_URL =
  "https://summon.app.n8n.cloud/webhook/945a431d-1217-41cb-adad-08cb35ecb083";

export function useSnapshot() {
  const [summary, setSummary] = useState<AdSummary | null>(null);
  const [added, setAdded] = useState<CreativeRecord[]>([]);
  const [removed, setRemoved] = useState<CreativeRecord[]>([]);
  const [changed, setChanged] = useState<CreativeRecord[]>([]);
  const [currentAds, setCurrentAds] = useState<CreativeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const normalizeAd = useCallback((ad: Record<string, unknown>): CreativeRecord => {
    const asString = (value: unknown, fallback: string) =>
      typeof value === "string" ? value : fallback;
    const asArray = (value: unknown): unknown[] =>
      Array.isArray(value) ? value : [];

    const media = typeof ad.media === "object" && ad.media !== null ? ad.media : {};
    const mediaImages =
      "images" in media ? asArray((media as { images?: unknown }).images) : [];
    const mediaVideos =
      "videos" in media ? asArray((media as { videos?: unknown }).videos) : [];

    return {
      creative_id: asString(ad.creative_id, ""),
      advertiser_id: asString(ad.advertiser_id, ""),
      title: asString(ad.title, "Untitled"),
      snippet: asString(ad.snippet, ""),
      url: asString(ad.url, ""),
      region: asString(ad.region, "Unknown"),
      format: asString(ad.format, "text"),
      media: {
        images: mediaImages,
        videos: mediaVideos,
      },
      first_seen: asString(ad.first_seen, "N/A"),
      last_seen: asString(ad.last_seen, "N/A"),
    };
  }, []);

  const loadSnapshot = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(WEBHOOK_URL, {
        method: "GET",
        mode: "cors",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch snapshot");
      }

      let data: unknown;
      try {
        data = await response.json();
      } catch {
        setSummary(null);
        setAdded([]);
        setRemoved([]);
        setChanged([]);
        setCurrentAds([]);
        return;
      }

      if (Array.isArray(data)) {
        if (data.length === 0) {
          setSummary(null);
          setAdded([]);
          setRemoved([]);
          setChanged([]);
          setCurrentAds([]);
          return;
        }
        throw new Error("Unexpected snapshot response");
      }

      if (!data || typeof data !== "object") {
        throw new Error("Unexpected snapshot response");
      }

      const raw = data as {
        summary?: AdSummary;
        added?: Record<string, unknown>[];
        removed?: Record<string, unknown>[];
        changed?: Record<string, unknown>[];
        current_ads?: Record<string, unknown>[];
      };

      if (!raw.summary) {
        throw new Error("Snapshot summary missing");
      }

      const normalizedSummary = raw.summary;
      const normalizedAdded = (raw.added || []).map((ad) => normalizeAd(ad));
      const normalizedRemoved = (raw.removed || []).map((ad) => normalizeAd(ad));
      const normalizedChanged = (raw.changed || []).map((ad) => normalizeAd(ad));
      const normalizedCurrent = (raw.current_ads || []).map((ad) => normalizeAd(ad));

      const normalizedSnapshot = {
        summary: normalizedSummary,
        added: normalizedAdded,
        removed: normalizedRemoved,
        changed: normalizedChanged,
        currentAds: normalizedCurrent,
      };

      console.log("Normalized snapshot:", normalizedSnapshot);
      setSummary(normalizedSummary);
      setAdded(normalizedAdded);
      setRemoved(normalizedRemoved);
      setChanged(normalizedChanged);
      setCurrentAds(normalizedCurrent);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch snapshot";
      setError(message);
      setSummary(null);
      setAdded([]);
      setRemoved([]);
      setChanged([]);
      setCurrentAds([]);
    } finally {
      setLoading(false);
    }
  }, [normalizeAd]);

  useEffect(() => {
    void loadSnapshot();
  }, [loadSnapshot]);

  return {
    summary,
    added,
    removed,
    changed,
    currentAds,
    loading,
    error,
  };
}
