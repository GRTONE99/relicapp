// Lightweight loading screen — no framer-motion dependency.
// Phrases rotate via a CSS keyframe animation so the vendor-motion
// chunk stays off the critical render path.

import { useEffect, useState } from "react";

const PHRASES = [
  "Building your starting lineup…",
  "Assembling the legends…",
  "Calling up your collection…",
  "Preparing your hall of fame…",
  "Loading your roster…",
];

export function InitialLoadingScreen() {
  const [index, setIndex]     = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const cycle = () => {
      // Fade out
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % PHRASES.length);
        // Fade back in
        setVisible(true);
      }, 400); // 400 ms cross-fade gap
    };

    const id = setInterval(cycle, 2400); // 2 s visible + 0.4 s fade
    return () => clearInterval(id);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[hsl(220_20%_5%)]">
      <div className="flex flex-col items-center gap-8">
        <img
          src="/icon-512.png"
          alt="Relic Roster"
          width={80}
          height={80}
          className="rounded-xl opacity-90"
          draggable={false}
        />
        <p
          className="text-sm text-muted-foreground/70 font-light tracking-wide transition-opacity duration-400"
          style={{ opacity: visible ? 1 : 0 }}
        >
          {PHRASES[index]}
        </p>
      </div>
    </div>
  );
}
