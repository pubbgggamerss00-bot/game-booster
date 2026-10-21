"use client";

import { useEffect, useRef } from "react";
import { useBooster } from "@/lib/gb/store";

/**
 * Real FPS measurement via requestAnimationFrame.
 * Feeds the store (used by Session HUD and Monitor screen).
 * Only runs while `active` is true.
 */
export function useFrameMonitor(active: boolean) {
  const frames = useRef(0);
  const last = useRef(0);
  const raf = useRef<number>(0);
  const setFps = useBooster((s) => s.setFps);

  useEffect(() => {
    if (!active) return;
    frames.current = 0;
    last.current = performance.now();

    const loop = (now: number) => {
      frames.current++;
      const el = now - last.current;
      if (el >= 1000) {
        const fps = Math.round((frames.current * 1000) / el);
        setFps(fps);
        frames.current = 0;
        last.current = now;
      }
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf.current);
  }, [active, setFps]);
}
