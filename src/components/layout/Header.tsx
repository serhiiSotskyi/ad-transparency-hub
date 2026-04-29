export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/80 backdrop-blur-sm">
      <div className="container flex h-16 items-center gap-4">
        <div className="flex items-center">
          <img
            src="/logo.png"
            alt="Summon Digital Logo"
            className="h-8 w-auto mr-3"
          />
          <div className="flex flex-col">
            <h1 className="text-xl font-semibold text-foreground">
              Wightlink Ad Monitor
            </h1>
            <span className="text-xs text-muted-foreground leading-none">
              by Summon
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
