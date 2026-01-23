import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AdSummary {
  total_ads: number;
  last_week: number;
  added_count: number;
  removed_count: number;
  changed_count: number;
}

interface SnapshotPayload {
  timestamp: string;
  summary: AdSummary;
  ads: {
    current: unknown[];
    new: unknown[];
    removed: unknown[];
    changed: unknown[];
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    if (req.method === "GET") {
      // GET /api/snapshot - Return the most recent snapshot
      console.log("Fetching latest snapshot...");
      
      const { data, error } = await supabase
        .from("snapshots")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // No rows found
          console.log("No snapshot found");
          return new Response(
            JSON.stringify({ 
              message: "No snapshot available yet. Waiting for data from n8n workflow.",
              hasData: false 
            }),
            { 
              status: 200, 
              headers: { ...corsHeaders, "Content-Type": "application/json" } 
            }
          );
        }
        throw error;
      }

      console.log("Snapshot found:", data.id);
      return new Response(
        JSON.stringify({ ...data, hasData: true }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    if (req.method === "POST") {
      // POST /api/snapshot - Receive and store a new snapshot
      console.log("Receiving new snapshot...");
      
      const body: SnapshotPayload = await req.json();
      
      // Validate required fields
      if (!body.timestamp) {
        return new Response(
          JSON.stringify({ error: "Missing required field: timestamp" }),
          { 
            status: 400, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }

      if (!body.summary || typeof body.summary !== "object") {
        return new Response(
          JSON.stringify({ error: "Missing or invalid required field: summary" }),
          { 
            status: 400, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }

      if (!body.ads || typeof body.ads !== "object") {
        return new Response(
          JSON.stringify({ error: "Missing or invalid required field: ads" }),
          { 
            status: 400, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }

      // Validate summary structure
      const requiredSummaryFields = ["total_ads", "last_week", "added_count", "removed_count", "changed_count"];
      for (const field of requiredSummaryFields) {
        if (typeof body.summary[field as keyof AdSummary] !== "number") {
          return new Response(
            JSON.stringify({ error: `Missing or invalid summary field: ${field}` }),
            { 
              status: 400, 
              headers: { ...corsHeaders, "Content-Type": "application/json" } 
            }
          );
        }
      }

      // Delete all existing snapshots (keep only the latest)
      console.log("Clearing old snapshots...");
      const { error: deleteError } = await supabase
        .from("snapshots")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all rows

      if (deleteError) {
        console.error("Error deleting old snapshots:", deleteError);
        // Continue anyway - insertion is more important
      }

      // Insert new snapshot
      console.log("Inserting new snapshot...");
      const { data, error } = await supabase
        .from("snapshots")
        .insert({
          timestamp: body.timestamp,
          summary: body.summary,
          ads: body.ads,
        })
        .select()
        .single();

      if (error) {
        console.error("Error inserting snapshot:", error);
        throw error;
      }

      console.log("Snapshot stored successfully:", data.id);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Snapshot stored successfully",
          id: data.id,
          timestamp: data.timestamp
        }),
        { 
          status: 201, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { 
        status: 405, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
