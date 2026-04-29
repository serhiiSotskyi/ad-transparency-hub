import { BarChart3, Plus, Minus, RefreshCw } from "lucide-react";
import { SummaryCard } from "./SummaryCard";
import type { AdSummary } from "@/types/snapshot";

interface SummaryCardsProps {
  summary: AdSummary;
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <SummaryCard
        title="Total Ads"
        value={summary.total_ads}
        icon={BarChart3}
        variant="default"
      />
      <SummaryCard
        title="New Ads"
        value={summary.added_count}
        icon={Plus}
        variant="success"
        subtitle="Within last 7 days"
      />
      <SummaryCard
        title="Removed"
        value={summary.removed_count}
        icon={Minus}
        variant="danger"
        subtitle="Currently removed"
      />
      <SummaryCard
        title="Changed"
        value={summary.changed_count}
        icon={RefreshCw}
        variant="warning"
        subtitle="Changed since last update"
      />
    </div>
  );
}
