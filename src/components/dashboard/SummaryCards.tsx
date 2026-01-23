import { BarChart3, Plus, Minus, RefreshCw, Layers } from "lucide-react";
import { SummaryCard } from "./SummaryCard";
import type { AdSummary } from "@/types/snapshot";

interface SummaryCardsProps {
  summary: AdSummary;
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  const weekDiff = summary.total_ads - summary.last_week;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <SummaryCard
        title="Total Ads"
        value={summary.total_ads}
        icon={BarChart3}
        variant="default"
        trend={{
          value: weekDiff,
          label: "vs last week",
        }}
      />
      <SummaryCard
        title="Last Week"
        value={summary.last_week}
        icon={Layers}
        variant="default"
      />
      <SummaryCard
        title="New Ads"
        value={summary.added_count}
        icon={Plus}
        variant="success"
        subtitle="Added this week"
      />
      <SummaryCard
        title="Removed"
        value={summary.removed_count}
        icon={Minus}
        variant="danger"
        subtitle="Removed this week"
      />
      <SummaryCard
        title="Changed"
        value={summary.changed_count}
        icon={RefreshCw}
        variant="warning"
        subtitle="Modified this week"
      />
    </div>
  );
}
