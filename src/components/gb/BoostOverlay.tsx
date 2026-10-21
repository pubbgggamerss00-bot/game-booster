"use client";

import * as React from "react";
import {
  Activity,
  CheckCircle2,
  CircleDashed,
  Loader2,
  MemoryStick,
  Play,
  ShieldCheck,
  Trash2,
  Wifi,
  X,
  Zap,
} from "lucide-react";
import { useBooster } from "@/lib/gb/store";
import { GAMES } from "@/lib/gb/model/games";
import { fmtInt, fmtOne } from "@/lib/gb/format";
import { Confirm, Chip, NeonButton, ProgressBar, COLOR_VAR } from "./ui";
import type { GbColor } from "./ui";

const S = {
  fa: {
    title: "بهینه‌سازی هوشمند",
    cancel: "لغو",
    stages: [
      "بررسی فشار حافظه",
      "آزادسازی و پاک‌سازی",
      "بررسی شبکه و DNS",
      "آماده‌سازی اجرا",
      "شروع پایش عملکرد",
    ],
    stageIcons: [MemoryStick, Trash2, Wifi, Zap, Activity],
    stageColors: ["purple", "amber", "cyan", "green", "green"] as GbColor[],
    sensitiveTitle: "تأیید پاک‌سازی حساس",
    sensitiveBody:
      "با خاموش بودن «محافظت از کش Shader»، پاک‌سازی این کش مجاز است اما ممکن است مکث و لگ اولیه بازی را بیشتر کند. اجازه حذف می‌دهید؟",
    sensitiveYes: "بله، پاک کن",
    sensitiveNo: "خیر، حفظ کن",
    resultTitle: "بهینه‌سازی انجام شد",
    freed: "حافظه آزادشده",
    ram: "رم",
    before: "قبل",
    after: "بعد",
    ping: "پینگ",
    jitter: "جیتر",
    quality: "کیفیت شبکه",
    launch: "اجرا کن",
    close: "ذخیره و بستن",
    protected: "محافظت از فایل‌های بازی فعال است",
  },
  en: {
    title: "Smart Boost",
    cancel: "Cancel",
    stages: ["Memory pre-check", "Free & clean", "Network & DNS", "Prepare launch", "Start monitoring"],
    stageIcons: [MemoryStick, Trash2, Wifi, Zap, Activity],
    stageColors: ["purple", "amber", "cyan", "green", "green"] as GbColor[],
    sensitiveTitle: "Sensitive cleanup confirmation",
    sensitiveBody:
      "Shader-cache protection is off, so clearing it is allowed — but it may increase initial game stutter. Allow deletion?",
    sensitiveYes: "Yes, clear it",
    sensitiveNo: "No, keep it",
    resultTitle: "Boost complete",
    freed: "Memory freed",
    ram: "RAM",
    before: "Before",
    after: "After",
    ping: "Ping",
    jitter: "Jitter",
    quality: "Network",
    launch: "Launch game",
    close: "Save & close",
    protected: "Game files protection is on",
  },
};

const QUALITY_KEY = { excellent: "quality.excellent", good: "quality.good", fair: "quality.fair", poor: "quality.poor", unknown: "quality.unknown" } as const;
const QUALITY_FA = { excellent: "عالی", good: "خوب", fair: "متوسط", poor: "ضعیف", unknown: "نامشخص" };

export default function BoostOverlay() {
  const lang = useBooster((s) => s.settings.lang);
  const t = S[lang];
  const boost = useBooster((s) => s.boost);
  const perf = useBooster((s) => s.perf);
  const cancelBoost = useBooster((s) => s.cancelBoost);
  const resolveSensitive = useBooster((s) => s.resolveSensitive);
  const launchFromBoost = useBooster((s) => s.launchFromBoost);
  const closeBoost = useBooster((s) => s.closeBoost);

  const game = GAMES.find((g) => g.id === boost.result?.gameId) ?? GAMES[0];
  const done = boost.stage === 5 && boost.result !== null && boost.progress >= 1;

  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-gb-bg/95 backdrop-blur-md" role="dialog" aria-modal="true">
      {/* header */}
      <div className="flex items-center justify-between border-b border-gb-border px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span
            className="font-display grid size-10 place-items-center rounded-xl text-xs font-black text-white"
            style={{ background: `linear-gradient(135deg, ${game.gradient[0]}, ${game.gradient[1]})`, boxShadow: `0 0 14px ${game.gradient[0]}66` }}
          >
            {game.initials}
          </span>
          <div>
            <div className="text-xs font-black text-gb-text">{t.title}</div>
            <div className="truncate text-[10px] text-gb-dim">{game.name}</div>
          </div>
        </div>
        {!done ? (
          <button onClick={cancelBoost} aria-label={t.cancel} className="grid size-8 place-items-center rounded-lg border border-gb-border text-gb-dim hover:text-gb-red">
            <X className="size-4" />
          </button>
        ) : null}
      </div>

      {/* stages */}
      <div className="gb-scroll flex-1 space-y-4 overflow-y-auto p-4">
        <div className="space-y-2">
          {t.stages.map((label, i) => {
            const idx = (i + 1) as 1 | 2 | 3 | 4 | 5;
            const Icon = t.stageIcons[i];
            const color = t.stageColors[i];
            const active = boost.stage === idx && !done;
            const complete = boost.stage > idx || done;
            return (
              <div
                key={label}
                className={`rounded-xl border px-3 py-2.5 transition-all duration-300 ${
                  active ? "border-gb-green/50 bg-gb-green/5" : complete ? "border-gb-border bg-gb-surface2/50 opacity-70" : "border-gb-border/50 bg-transparent opacity-45"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {complete ? (
                    <CheckCircle2 className="size-4.5 shrink-0 text-gb-green" />
                  ) : active ? (
                    <Loader2 className="size-4.5 shrink-0 animate-spin" style={{ color: COLOR_VAR[color] }} />
                  ) : (
                    <CircleDashed className="size-4.5 shrink-0 text-gb-dim" />
                  )}
                  <span className={`flex-1 text-[11.5px] font-bold ${active ? "text-gb-text" : "text-gb-dim"}`}>
                    {fmtInt(i + 1, lang)}. {label}
                  </span>
                </div>
                {active ? <ProgressBar value={boost.progress} color={color} className="mt-2" /> : null}
              </div>
            );
          })}
        </div>

        {/* terminal */}
        <div className="relative overflow-hidden rounded-xl border border-gb-green/25 bg-black/50 p-3">
          <div className="pointer-events-none absolute inset-x-0 h-10 shimmer" />
          <div dir="ltr" className="gb-scroll max-h-44 space-y-1 overflow-y-auto font-mono text-[10px] leading-relaxed">
            {boost.lines.map((l, i) => (
              <div key={i} className={`anim-fade-up ${i === boost.lines.length - 1 ? "text-gb-green" : "text-gb-green/55"}`}>
                <span className="text-gb-cyan">›</span> {l}
              </div>
            ))}
            {!done && boost.lines.length === 0 ? <div className="text-gb-dim">› …</div> : null}
          </div>
        </div>

        {/* result */}
        {done && boost.result ? (
          <div className="anim-fade-up space-y-3">
            <div className="rounded-2xl border border-gb-green/40 bg-gb-green/5 p-4 text-center glow-green">
              <CheckCircle2 className="mx-auto mb-1.5 size-8 text-gb-green" />
              <div className="text-sm font-black text-gb-text">{t.resultTitle}</div>
              <div className="mt-2 text-2xl font-black text-glow-green">
                +{fmtInt(boost.result.freedMB, lang)} <span className="text-sm">MB</span>
              </div>
              <div className="text-[10px] text-gb-dim">{t.freed}</div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl border border-gb-border bg-gb-surface2/60 p-2.5">
                <div className="text-[9px] text-gb-dim">{t.ram}</div>
                <div className="mt-0.5 text-[11px] font-bold text-gb-text" dir="ltr">
                  {fmtOne(boost.result.ramBefore, lang)} → {fmtOne(boost.result.ramAfter, lang)}
                </div>
              </div>
              <div className="rounded-xl border border-gb-border bg-gb-surface2/60 p-2.5">
                <div className="text-[9px] text-gb-dim">{t.ping}</div>
                <div className="mt-0.5 text-[11px] font-bold text-gb-text" dir="ltr">
                  {boost.result.ping !== null ? `${fmtInt(boost.result.ping, lang)} ms` : "—"}
                </div>
              </div>
              <div className="rounded-xl border border-gb-border bg-gb-surface2/60 p-2.5">
                <div className="text-[9px] text-gb-dim">{t.jitter}</div>
                <div className="mt-0.5 text-[11px] font-bold text-gb-text" dir="ltr">
                  {boost.result.jitter !== null ? `${fmtInt(boost.result.jitter, lang)} ms` : "—"}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Chip color={boost.result.quality === "excellent" || boost.result.quality === "good" ? "green" : "amber"} dot>
                {t.quality}: {lang === "fa" ? QUALITY_FA[boost.result.quality] : boost.result.quality}
              </Chip>
              <Chip color="purple">
                <ShieldCheck className="size-3" />
                {t.protected}
              </Chip>
            </div>
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <NeonButton color="green" size="md" onClick={launchFromBoost}>
                <Play className="size-4" />
                {t.launch}
              </NeonButton>
              <NeonButton color="purple" variant="outline" size="md" onClick={closeBoost}>
                {t.close}
              </NeonButton>
            </div>
          </div>
        ) : null}
      </div>

      {/* sensitive confirm */}
      <Confirm
        open={boost.sensitiveAsk}
        title={t.sensitiveTitle}
        body={t.sensitiveBody}
        confirmText={t.sensitiveYes}
        cancelText={t.sensitiveNo}
        danger
        onConfirm={() => resolveSensitive(true)}
        onCancel={() => resolveSensitive(false)}
      />
    </div>
  );
}
