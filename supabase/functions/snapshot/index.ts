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
    title: typeof row.title === "string" ? row.title : null,
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
  };
}

async function runQuery(query: string): Promise<SqlRow[]> {
  const { data, error } = await supabase.rpc("sql", { query });
  if (error) throw error;
  return (data as SqlRow[]) || [];
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

    const [newRows, removedRows, changedRows, activeRows] = await Promise.all([
      runQuery(
        "SELECT cs.*, s.status, s.became_new_date FROM creative_status s JOIN creative_snapshots cs ON cs.creative_id = s.creative_id WHERE s.status = 'new';"
      ),
      runQuery("SELECT * FROM creative_status WHERE status = 'removed';"),
      runQuery(
        "SELECT cs.*, s.status FROM creative_status s JOIN creative_snapshots cs ON cs.creative_id = s.creative_id WHERE s.status = 'changed';"
      ),
      runQuery(
        "SELECT cs.*, s.status, s.became_new_date FROM creative_status s JOIN creative_snapshots cs ON cs.creative_id = s.creative_id WHERE s.status = 'active';"
      ),
    ]);

    const newAds = newRows.map(mapRow);
    const removedAds = removedRows.map(mapRow);
    const changedAds = changedRows.map(mapRow);
    const activeAds = activeRows.map(mapRow);

    return new Response(
      JSON.stringify({
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
