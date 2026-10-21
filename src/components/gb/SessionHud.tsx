"use client";

import * as React from "react";
import { Activity, CheckCircle2, MemoryStick, Thermometer, TriangleAlert, Wifi, X } from "lucide-react";
import { useBooster } from "@/lib/gb/store";
import { GAMES } from "@/lib/gb/model/games";
import { useFrameMonitor } from "@/lib/gb/viewmodel/useFrameMonitor";
import { fmtDuration, fmtInt, fmtOne } from "@/lib/gb/format";
import { thermalState } from "@/lib/gb/model/simulator";
import { Chip, LiveBadge, NeonButton } from "./ui";

const S = {
  fa: {
    running: "بازی در حال اجرا",
    subtitle: "پایش عملکرد زنده (مرحله ۵)",
    fps: "فریم بر ثانیه",
    ram: "رم مصرفی",
    temp: "دما",
    ping: "پینگ",
    elapsed: "زمان جلسه",
    avgFps: "میانگین FPS",
    drops: "افت فریم‌ها",
    maxTemp: "بیشینه دما",
    duration: "مدت جلسه",
    end: "پایان جلسه",
    summaryTitle: "خلاصه جلسه",
    savedNote: "نتیجه در تاریخچه تست‌ها ذخیره شد (DataStore)",
    close: "بستن",
    events: "رویدادهای زنده",
    live: "زنده",
    good: "پایدار",
    warn: "هشدار",
    info: "اطلاع",
  },
  en: {
    running: "Game running",
    subtitle: "Live performance monitoring (stage 5)",
    fps: "FPS",
    ram: "RAM used",
    temp: "Temp",
    ping: "Ping",
    elapsed: "Session time",
    avgFps: "Avg FPS",
    drops: "Frame drops",
    maxTemp: "Max temp",
    duration: "Duration",
    end: "End session",
    summaryTitle: "Session summary",
    savedNote: "Saved to test history (DataStore)",
    close: "Close",
    events: "Live events",
    live: "LIVE",
    good: "Stable",
    warn: "Warning",
    info: "Info",
  },
};

export default function SessionHud() {
  const lang = useBooster((s) => s.settings.lang);
  const t = S[lang];
  const session = useBooster((s) => s.session);
  const perf = useBooster((s) => s.perf);
  const netDiag = useBooster((s) => s.netDiag);
  const endSession = useBooster((s) => s.endSession);

  useFrameMonitor(true);

  const [now, setNow] = React.useState(Date.now());
  const [drops, setDrops] = React.useState(0);
  const [summary, setSummary] = React.useState<null | { avg: number; drops: number; dur: number; maxTemp: number }>(null);

  React.useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(iv);
  }, []);

  // frame-drop detection (real FPS)
  const prevFps = React.useRef<number | null>(null);
  React.useEffect(() => {
    if (session.fps === null) return;
    if (prevFps.current !== null && session.fps < 48 && (prevFps.current ?? 60) >= 48) {
      setDrops((d) => d + 1);
    }
    prevFps.current = session.fps;
  }, [session.fps]);

  const game = GAMES.find((g) => g.id === session.gameId) ?? GAMES[0];
  const elapsed = session.startedAt ? now - session.startedAt : 0;
  const thermal = thermalState(perf.temp);
  const ping = netDiag.ping;

  const onEnd = () => {
    /* show summary first; session stays active until the user closes it */
    setSummary({ avg: session.avgFps || session.fps || 60, drops, dur: elapsed, maxTemp: perf.temp });
  };

  const onCloseSummary = () => {
    endSession();
    setSummary(null);
  };

  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-gb-bg/97 backdrop-blur-md" role="dialog" aria-modal="true">
      {!summary ? (
        <>
          {/* header */}
          <div className="flex items-center justify-between border-b border-gb-border px-4 py-3">
            <div className="flex items-center gap-2.5">
              <span
                className="font-display grid size-10 place-items-center rounded-xl text-xs font-black text-white anim-float"
                style={{ background: `linear-gradient(135deg, ${game.gradient[0]}, ${game.gradient[1]})`, boxShadow: `0 0 16px ${game.gradient[0]}77` }}
              >
                {game.initials}
              </span>
              <div>
                <div className="flex items-center gap-1.5 text-xs font-black text-gb-text">
                  {t.running}
                  <LiveBadge label={t.live} />
                </div>
                <div className="truncate text-[10px] text-gb-dim">{t.subtitle}</div>
              </div>
            </div>
          </div>

          {/* fps hero */}
          <div className="relative grid place-items-center py-5">
            <span className="absolute size-40 rounded-full border border-gb-green/25 anim-pulse-ring" />
            <div className="text-center">
              <div className="font-display text-6xl font-black text-glow-green" dir="ltr">
                {session.fps !== null ? fmtInt(session.fps, lang) : "--"}
              </div>
              <div className="mt-1 text-[10px] font-bold tracking-widest text-gb-dim">{t.fps}</div>
              <div className="mt-1 text-[9px] text-gb-dim">(اندازه‌گیری واقعی rAF)</div>
            </div>
          </div>

          {/* live tiles */}
          <div className="grid grid-cols-2 gap-2.5 px-4">
            {[
              { icon: <MemoryStick className="size-4" />, label: t.ram, value: `${fmtOne((perf.ramUsedGB / perf.ramTotalGB) * 100, lang)}٪` },
              { icon: <Thermometer className="size-4" />, label: t.temp, value: `${fmtOne(perf.temp, lang)}°C`, hot: thermal === "hot" },
              { icon: <Wifi className="size-4" />, label: t.ping, value: ping !== null ? `${fmtInt(ping, lang)} ms` : "—" },
              { icon: <Activity className="size-4" />, label: t.elapsed, value: fmtDuration(elapsed, lang) },
            ].map((it) => (
              <div key={it.label} className="flex items-center gap-2.5 rounded-xl border border-gb-border bg-gb-surface2/60 px-3 py-2.5">
                <span className={it.hot ? "text-gb-red" : "text-gb-cyan"}>{it.icon}</span>
                <div className="min-w-0">
                  <div className="text-[9px] text-gb-dim">{it.label}</div>
                  <div className={`text-xs font-black ${it.hot ? "text-gb-red" : "text-gb-text"}`} dir="ltr">
                    {it.value}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* events */}
          <div className="mt-3 min-h-0 flex-1 px-4">
            <div className="mb-1.5 flex items-center gap-2 text-[11px] font-bold text-gb-dim">
              {t.events}
              <span className="h-px flex-1 bg-gb-border" />
            </div>
            <ul className="gb-scroll max-h-40 space-y-1.5 overflow-y-auto pe-1">
              {[...session.events].reverse().map((ev) => (
                <li key={ev.id} className="anim-fade-up flex items-start gap-2 rounded-lg border border-gb-border/60 bg-gb-surface2/40 px-2.5 py-1.5 text-[10.5px] leading-relaxed">
                  {ev.level === "warn" ? (
                    <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-gb-amber" />
                  ) : (
                    <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-gb-green" />
                  )}
                  <span className="flex-1 text-gb-text/85">{ev.message}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* end */}
          <div className="border-t border-gb-border p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <NeonButton color="red" size="lg" className="w-full" onClick={onEnd}>
              <X className="size-4" />
              {t.end}
            </NeonButton>
          </div>
        </>
      ) : (
        /* summary */
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
          <span className="grid size-16 place-items-center rounded-full border border-gb-green/40 bg-gb-green/10 glow-green">
            <CheckCircle2 className="size-8 text-gb-green" />
          </span>
          <h3 className="text-base font-black text-gb-text">{t.summaryTitle}</h3>
          <div className="grid w-full grid-cols-2 gap-2.5">
            {[
              { label: t.avgFps, value: fmtInt(summary.avg, lang) },
              { label: t.drops, value: fmtInt(summary.drops, lang) },
              { label: t.maxTemp, value: `${fmtOne(summary.maxTemp, lang)}°C` },
              { label: t.duration, value: fmtDuration(summary.dur, lang) },
            ].map((it) => (
              <div key={it.label} className="rounded-xl border border-gb-border bg-gb-surface2/60 p-3">
                <div className="text-[9px] text-gb-dim">{it.label}</div>
                <div className="mt-0.5 text-sm font-black text-gb-text" dir="ltr">
                  {it.value}
                </div>
              </div>
            ))}
          </div>
          <Chip color="green" dot>
            {t.savedNote}
          </Chip>
          <NeonButton color="purple" className="mt-2 w-full" onClick={onCloseSummary}>
            {t.close}
          </NeonButton>
        </div>
      )}
    </div>
  );
}
