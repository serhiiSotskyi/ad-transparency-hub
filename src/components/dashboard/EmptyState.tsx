import { Inbox, Clock } from "lucide-react";

interface EmptyStateProps {
  message?: string;
}

export function EmptyState({ message }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="rounded-full bg-primary/10 p-6 mb-6">
        <Inbox className="h-12 w-12 text-primary" />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">
        No Snapshot Available
      </h3>
      <p className="text-muted-foreground max-w-md mb-4">
        {message || "Waiting for data from your n8n workflow. Once a snapshot is received, it will appear here."}
      </p>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Clock className="h-4 w-4" />
        <span>Checking for updates automatically</span>
      </div>
    </div>
  );
}
