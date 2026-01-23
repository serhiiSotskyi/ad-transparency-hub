import { useSnapshot } from "@/hooks/useSnapshot";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SummaryCards } from "./SummaryCards";
import { AdsList } from "./AdsList";
import { DashboardSkeleton } from "./LoadingSkeleton";
import { ErrorState } from "./ErrorState";
import { EmptyState } from "./EmptyState";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

export function Dashboard() {
  const { data, isLoading, error, refetch, isFetching } = useSnapshot();

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <ErrorState
        message={error.message || "Failed to load snapshot data"}
        onRetry={() => refetch()}
      />
    );
  }

  if (!data?.hasData) {
    return <EmptyState message={data?.message} />;
  }

  const formattedDate = data.timestamp
    ? format(new Date(data.timestamp), "MMM d, yyyy 'at' h:mm a")
    : "Unknown";

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Calendar className="h-4 w-4" />
            <span>Last updated: {formattedDate}</span>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <SummaryCards summary={data.summary} />

      {/* Ads Tabs */}
      <Tabs defaultValue="new" className="space-y-6">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="new" className="gap-2">
            New Ads
            <Badge variant="secondary" className="ml-1 bg-success/10 text-success">
              {data.ads.new?.length || 0}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="removed" className="gap-2">
            Removed
            <Badge variant="secondary" className="ml-1 bg-destructive/10 text-destructive">
              {data.ads.removed?.length || 0}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="changed" className="gap-2">
            Changed
            <Badge variant="secondary" className="ml-1 bg-warning/10 text-warning">
              {data.ads.changed?.length || 0}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="new" className="mt-6">
          <AdsList
            ads={data.ads.new || []}
            type="new"
            emptyMessage="No new ads detected this week"
          />
        </TabsContent>

        <TabsContent value="removed" className="mt-6">
          <AdsList
            ads={data.ads.removed || []}
            type="removed"
            emptyMessage="No ads were removed this week"
          />
        </TabsContent>

        <TabsContent value="changed" className="mt-6">
          <AdsList
            ads={data.ads.changed || []}
            type="changed"
            emptyMessage="No ads were modified this week"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
