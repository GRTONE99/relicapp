export function AppLoadingScreen({ message = "Loading your roster..." }: { message?: string }) {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-6">
      <div className="w-full max-w-sm text-center space-y-6">
        <div className="mx-auto flex items-center justify-center gap-3">
          <div className="h-3 w-3 rounded-full bg-primary animate-pulse" />
          <div className="h-3 w-3 rounded-full bg-primary/70 animate-pulse [animation-delay:120ms]" />
          <div className="h-3 w-3 rounded-full bg-primary/40 animate-pulse [animation-delay:240ms]" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Relic Roster</h1>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
      </div>
    </div>
  );
}
