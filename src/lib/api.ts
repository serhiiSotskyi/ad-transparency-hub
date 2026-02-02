import type { Snapshot } from "@/types/snapshot";

const SNAPSHOT_URL =
  "https://summon.app.n8n.cloud/webhook/945a431d-1217-41cb-adad-08cb35ecb083";

export async function getLatestSnapshot(): Promise<Snapshot | null> {
  try {
    const response = await fetch(SNAPSHOT_URL, { method: "GET", mode: "cors" });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as {
      ["stringified JSON"]?: string;
    };

    const rawSnapshot = data["stringified JSON"];
    if (!rawSnapshot) {
      return null;
    }

    const parsed = JSON.parse(rawSnapshot) as Snapshot;
    return parsed;
  } catch {
    return null;
  }
}
