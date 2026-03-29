// Lightweight loading screen used as the Suspense fallback in App.tsx and
// the ProtectedRoute auth-check phase. No framer-motion dependency — keeps
// the vendor-motion chunk (130 KB) off the critical render path.
// The full premium AppLoadingScreen (with animations) is shown once the
// user is confirmed authenticated and we are waiting for collection data.

export function InitialLoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[hsl(220_20%_5%)]">
      <div className="flex flex-col items-center gap-6">
        <img
          src="/icon-512.png"
          alt="Relic Roster"
          width={80}
          height={80}
          className="rounded-xl opacity-90"
          draggable={false}
        />
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="block w-1 h-1 rounded-full bg-primary/50 animate-pulse"
              style={{ animationDelay: `${i * 200}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
