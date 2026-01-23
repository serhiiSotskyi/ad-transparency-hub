import { BarChart3 } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/80 backdrop-blur-sm">
      <div className="container flex h-16 items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary">
            <BarChart3 className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">
              Ads Transparency
            </h1>
            <p className="text-xs text-muted-foreground">
              Weekly Snapshot Dashboard
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
