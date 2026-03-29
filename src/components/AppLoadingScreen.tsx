import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const MESSAGES = [
  "Opening the vault…",
  "Cataloguing greatness…",
  "Verifying provenance…",
  "Preparing your roster of legends…",
  "Polishing your legacy…",
];

// ── Skeleton dashboard placeholders ──────────────────────────────────────────

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={`rounded-xl bg-white/[0.03] overflow-hidden relative ${className}`}
    >
      <motion.div
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/[0.04] to-transparent"
        animate={{ x: ["−100%", "200%"] }}
        transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 1.2, ease: "easeInOut" }}
        style={{ transform: "translateX(-100%)" }}
      />
    </div>
  );
}

function SkeletonDashboard() {
  return (
    <div className="absolute inset-0 flex items-end justify-center pb-0 pointer-events-none select-none">
      {/* Fade out toward center so it doesn't compete with the logo */}
      <div
        className="w-full max-w-5xl px-6 pb-0"
        style={{
          maskImage: "linear-gradient(to top, rgba(0,0,0,0.18) 0%, transparent 55%)",
          WebkitMaskImage: "linear-gradient(to top, rgba(0,0,0,0.18) 0%, transparent 55%)",
        }}
      >
        {/* Stat cards row */}
        <div className="grid grid-cols-4 gap-3 mb-3">
          {[80, 60, 70, 55].map((w, i) => (
            <div key={i} className="rounded-xl bg-white/[0.025] p-4 space-y-3">
              <SkeletonBlock className="h-3 rounded-md" style={{ width: `${w}%` } as React.CSSProperties} />
              <SkeletonBlock className="h-6 rounded-md w-3/4" />
              <SkeletonBlock className="h-2.5 rounded-md w-1/2" />
            </div>
          ))}
        </div>
        {/* Chart area */}
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div className="col-span-2 rounded-xl bg-white/[0.025] p-4 space-y-3">
            <SkeletonBlock className="h-3 rounded-md w-1/3" />
            <SkeletonBlock className="h-40 rounded-lg" />
          </div>
          <div className="rounded-xl bg-white/[0.025] p-4 space-y-3">
            <SkeletonBlock className="h-3 rounded-md w-2/5" />
            <SkeletonBlock className="h-28 rounded-full mx-auto aspect-square" />
            {[60, 45, 75].map((w, i) => (
              <SkeletonBlock key={i} className="h-2.5 rounded-md" style={{ width: `${w}%` } as React.CSSProperties} />
            ))}
          </div>
        </div>
        {/* Item card row */}
        <div className="grid grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl bg-white/[0.025] overflow-hidden">
              <SkeletonBlock className="aspect-[3/4]" />
              <div className="p-3 space-y-2">
                <SkeletonBlock className="h-2.5 rounded-md w-4/5" />
                <SkeletonBlock className="h-2 rounded-md w-3/5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Logo ──────────────────────────────────────────────────────────────────────

function Logo() {
  return (
    <img
      src="/icon-512.png"
      alt="Relic Roster"
      className="w-full h-full object-contain"
      draggable={false}
    />
  );
}

// ── Shimmer sweep over logo ───────────────────────────────────────────────────

function LogoShimmer() {
  return (
    <motion.div
      className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none"
      initial={false}
    >
      <motion.div
        className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
        initial={{ x: "-100%" }}
        animate={{ x: "250%" }}
        transition={{
          duration: 0.9,
          repeat: Infinity,
          repeatDelay: 2.1,
          ease: [0.4, 0, 0.6, 1],
        }}
      />
    </motion.div>
  );
}

// ── Breathing glow ────────────────────────────────────────────────────────────

function BreathingGlow() {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: 360,
        height: 360,
        background: "radial-gradient(circle, hsl(43 96% 56% / 0.07) 0%, transparent 70%)",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
      }}
      animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

// ── Loading dots ──────────────────────────────────────────────────────────────

function LoadingDots() {
  return (
    <div className="flex items-center justify-center gap-1.5" aria-label="Loading">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="block w-1 h-1 rounded-full bg-primary/50"
          animate={{ opacity: [0.25, 1, 0.25], y: [0, -3, 0] }}
          transition={{
            duration: 1.4,
            repeat: Infinity,
            delay: i * 0.22,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function AppLoadingScreen({ message }: { message?: string }) {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    // If a static message is provided (e.g. auth check), skip rotation
    if (message) return;
    const id = setInterval(() => {
      setMsgIndex((i) => (i + 1) % MESSAGES.length);
    }, 2000);
    return () => clearInterval(id);
  }, [message]);

  const displayMessage = message ?? MESSAGES[msgIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[hsl(220_20%_5%)] overflow-hidden">
      {/* Background skeleton dashboard */}
      <SkeletonDashboard />

      {/* Radial vignette — keeps centre clean and legible */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 55% 60% at 50% 50%, transparent 0%, hsl(220 20% 5% / 0.85) 65%, hsl(220 20% 5%) 100%)",
        }}
      />

      {/* Breathing glow */}
      <BreathingGlow />

      {/* Centred content */}
      <div className="relative z-10 flex flex-col items-center gap-8 px-6">

        {/* Logo */}
        <motion.div
          className="relative w-28 h-28 rounded-2xl overflow-hidden flex items-center justify-center"
          style={{
            boxShadow: "0 0 0 1px hsl(43 96% 56% / 0.12), 0 12px 40px hsl(220 20% 3% / 0.7)",
          }}
          initial={{ opacity: 0, scale: 0.88 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <Logo />
          <LogoShimmer />
        </motion.div>

        {/* Wordmark */}
        <motion.div
          className="text-center space-y-1"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="text-xs font-semibold tracking-[0.25em] uppercase text-primary/60">
            Relic Roster
          </p>
        </motion.div>

        {/* Rotating message */}
        <div className="h-6 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={displayMessage}
              className="text-sm text-muted-foreground/70 font-light tracking-wide"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
            >
              {displayMessage}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Loading dots */}
        <LoadingDots />
      </div>
    </div>
  );
}
