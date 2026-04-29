import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type CreativeRecord = {
  creative_id: string;
  advertiser_id: string | null;
  title: string | null;
  snippet: string | null;
  url: string | null;
  region: string | null;
  format: string | null;
  media: {
    images: string[];
    videos: string[];
  };
  first_seen: string | null;
  last_seen: string | null;
  status?: string | null;
  became_new_date?: string | null;
  changed_date?: string | null;
  became_removed_date?: string | null;
  last_seen_global?: string | null;
};

type SqlRow = Record<string, unknown>;

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

function toArray(value: unknown): string[] {
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
}

function parseRegion(row: SqlRow): string | null {
  if (typeof row.region === "string") return row.region;
  const regions = row.regions as { region?: unknown } | undefined;
  if (regions && typeof regions.region === "string") return regions.region;
  return null;
}

function mapRow(row: SqlRow): CreativeRecord {
  const creativeId = typeof row.creative_id === "string" ? row.creative_id : "";
  const advertiserId =
    typeof row.advertiser_id === "string" ? row.advertiser_id : "";
  const images = toArray(
    row.images ?? (row.media as { images?: unknown } | undefined)?.images
  );
  const videos = toArray(
    row.videos ?? (row.media as { videos?: unknown } | undefined)?.videos
  );

  return {
    creative_id: creativeId,
    advertiser_id: advertiserId,
    url: `https://adstransparency.google.com/advertiser/${advertiserId}/creative/${creativeId}`,
    title:
      typeof row.title === "string"
        ? row.title
        : typeof row.advertiser_name === "string"
          ? row.advertiser_name
          : null,
    snippet: typeof row.snippet === "string" ? row.snippet : null,
    region: parseRegion(row) ?? "N/A",
    format: typeof row.media_format === "string" ? row.media_format : null,
    media: {
      images,
      videos,
    },
    first_seen:
      typeof row.became_new_date === "string"
        ? row.became_new_date
        : typeof row.first_seen === "string"
          ? row.first_seen
          : null,
    last_seen:
      typeof row.snapshot_date === "string"
        ? row.snapshot_date
        : typeof row.last_seen === "string"
          ? row.last_seen
          : null,
    status: typeof row.status === "string" ? row.status : null,
    became_new_date:
      typeof row.became_new_date === "string" ? row.became_new_date : null,
    changed_date:
      typeof row.changed_date === "string" ? row.changed_date : null,
    became_removed_date:
      typeof row.became_removed_date === "string"
        ? row.became_removed_date
        : null,
    last_seen_global:
      typeof row.last_seen_global === "string" ? row.last_seen_global : null,
  };
}

async function runQuery(query: string): Promise<SqlRow[]> {
  const { data, error } = await supabase.rpc("sql", { query });
  if (error) throw error;
  return (data as SqlRow[]) || [];
}

function statusQuery(status: "new" | "removed" | "changed" | "active") {
  return `
    WITH latest_snapshots AS (
      SELECT DISTINCT ON (creative_id) *
      FROM creative_snapshots
      ORDER BY creative_id, snapshot_date DESC, id DESC
    )
    SELECT
      s.creative_id,
      s.status,
      s.became_new_date,
      s.changed_date,
      s.became_removed_date,
      c.advertiser_id,
      c.advertiser_name,
      c.first_seen,
      c.last_seen_global,
      ls.snapshot_date,
      ls.media_format,
      ls.regions,
      ls.images,
      ls.videos
    FROM creative_status s
    LEFT JOIN latest_snapshots ls ON ls.creative_id = s.creative_id
    LEFT JOIN creatives c ON c.creative_id = s.creative_id
    WHERE s.status = '${status}'
    ORDER BY COALESCE(s.changed_date, s.became_new_date, s.became_removed_date, ls.snapshot_date) DESC NULLS LAST;
  `;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== "GET") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const [newRows, removedRows, changedRows, activeRows, previousRows] = await Promise.all([
      runQuery(statusQuery("new")),
      runQuery(statusQuery("removed")),
      runQuery(statusQuery("changed")),
      runQuery(statusQuery("active")),
      runQuery(`
        SELECT COUNT(DISTINCT creative_id)::int AS previous_total
        FROM creative_snapshots
        WHERE snapshot_date::date = (
          SELECT MAX(snapshot_date::date)
          FROM creative_snapshots
          WHERE snapshot_date::date < CURRENT_DATE
        );
      `),
    ]);

    const newAds = newRows.map(mapRow);
    const removedAds = removedRows.map(mapRow);
    const changedAds = changedRows.map(mapRow);
    const activeAds = activeRows.map(mapRow);
    const previousTotal =
      typeof previousRows[0]?.previous_total === "number"
        ? previousRows[0].previous_total
        : 0;

    return new Response(
      JSON.stringify({
        summary: {
          total_ads: activeAds.length + newAds.length + changedAds.length,
          last_week: previousTotal,
          added_count: newAds.length,
          removed_count: removedAds.length,
          changed_count: changedAds.length,
          active_count: activeAds.length,
        },
        new: newAds,
        removed: removedAds,
        changed: changedAds,
        active: activeAds,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
