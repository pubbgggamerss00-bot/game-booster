"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import {
  History,
  Lightbulb,
  MemoryStick,
  Network,
  Palette,
  Play,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";
import { useBooster } from "@/lib/gb/store";
import { defaultProfile, gameRamNeedGB } from "@/lib/gb/model/games";
import { fmtBytesMB, fmtDateTime, fmtInt, fmtOne } from "@/lib/gb/format";
import type { Game, GameProfile } from "@/lib/gb/types";
import { cn } from "@/lib/utils";
import { SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Callout, Chip, GameIcon, NeonButton, NeonCard, SectionTitle, SegTabs, ToggleRow, type GbColor } from "./ui";

const S = {
  fa: {
    profileTitle: "پروفایل اختصاصی بازی",
    profileSub: "تنظیمات فقط برای همین بازی اعمال می‌شود",
    graphics: "گرافیک",
    gHigh: "بالا",
    gBalanced: "متعادل",
    gSmooth: "روان",
    priority: "اولویت عملکرد",
    pPerf: "حداکثر کارایی",
    pBalanced: "متعادل",
    pBattery: "صرفه‌جویی",
    netPriority: "اولویت شبکه",
    netPrioritySub: "برای بازی‌های آنلاین",
    suggestTitle: "پیشنهادهای بهینه‌سازی",
    ramHigh: (x: string) => `حافظه بالای ${x} گیگ آزاد کنید تا اجرای بازی بدون افت انجام شود`,
    ramMedium: (x: string) => `حدود ${x} گیگ حافظه برای اجرای این بازی نیاز است`,
    ramLow: (x: string) => `مصرف حافظه این بازی پایین است؛ آزادسازی ${x} گیگ کافی است`,
    gfxHigh: "گرافیک بالا فعال است؛ در صورت افزایش دما به «متعادل» برگردید.",
    gfxBalanced: "متعادل: بهترین ترکیب کیفیت تصویر و پایداری فریم.",
    gfxSmooth: "روان: اولویت با نرخ فریم است؛ کیفیت تصویر کاهش می‌یابد.",
    netOn: "اولویت شبکه فعال است — بسته‌های بازی در اولویت پردازش قرار می‌گیرند.",
    netOff: "اولویت شبکه فعال نیست؛ برای بازی‌های آنلاین فعالش کنید تا پینگ پایدار بماند.",
    shaderTip: "کش Shader بازی محافظت می‌شود تا مکث اولیه ایجاد نشود.",
    histTitle: "نتایج تست‌های قبلی",
    noTests: "تست ثبت نشده",
    histBoost: "بهینه‌سازی",
    histSession: "جلسه",
    freed: (mb: string) => `${mb} MB آزاد`,
    sessionStat: (fps: string, drops: string) => `میانگین ${fps} فریم · ${drops} افت`,
    ram: "رم",
    demand: { high: "بالا", medium: "متوسط", low: "کم" },
    runGame: "اجرای بازی",
    close: "بستن",
  },
  en: {
    profileTitle: "Game profile",
    profileSub: "Applies to this game only",
    graphics: "Graphics",
    gHigh: "High",
    gBalanced: "Balanced",
    gSmooth: "Smooth",
    priority: "Performance priority",
    pPerf: "Max performance",
    pBalanced: "Balanced",
    pBattery: "Battery saver",
    netPriority: "Network priority",
    netPrioritySub: "For online games",
    suggestTitle: "Optimization suggestions",
    ramHigh: (x: string) => `Free more than ${x} GB of memory for a stutter-free launch`,
    ramMedium: (x: string) => `About ${x} GB of memory is required to run this game`,
    ramLow: (x: string) => `Low memory footprint — freeing ${x} GB is enough`,
    gfxHigh: "High graphics is on — fall back to “Balanced” if the device gets hot.",
    gfxBalanced: "Balanced: the best mix of visual quality and frame stability.",
    gfxSmooth: "Smooth: frame rate first; visual quality is reduced.",
    netOn: "Network priority is on — game packets are processed first.",
    netOff: "Network priority is off — enable it for online games to keep ping stable.",
    shaderTip: "The game's shader cache is protected to avoid first-launch stutter.",
    histTitle: "Previous test results",
    noTests: "No tests recorded yet",
    histBoost: "Boost",
    histSession: "Session",
    freed: (mb: string) => `${mb} MB freed`,
    sessionStat: (fps: string, drops: string) => `avg ${fps} fps · ${drops} drops`,
    ram: "RAM",
    demand: { high: "High", medium: "Med", low: "Low" },
    runGame: "Launch game",
    close: "Close",
  },
} as const;

const FALLBACK_PROFILE: GameProfile = { graphics: "balanced", priority: "balanced", netPriority: false, updatedAt: 0 };

export default function GameProfileSheet({ game, onClose }: { game: Game | null; onClose: () => void }) {
  const lang = useBooster((s) => s.settings.lang);
  const t = S[lang];
  const ramTotalGB = useBooster((s) => s.perf.ramTotalGB);
  const history = useBooster((s) => s.history);
  const setProfile = useBooster((s) => s.setProfile);
  const startBoost = useBooster((s) => s.startBoost);

  /* keep last non-null game so content persists during the close animation */
  const [shown, setShown] = React.useState<Game | null>(null);
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);
  React.useEffect(() => {
    if (game) setShown(game);
  }, [game]);
  const g = game ?? shown;

  const stored = useBooster((s) => (g ? s.profiles[g.id] : undefined));
  const profile = stored ?? (g ? defaultProfile(g) : FALLBACK_PROFILE);

  const rows = React.useMemo(() => {
    if (!g) return [];
    return history.filter(
      (h) => (h.kind === "boost" || h.kind === "session") && "gameId" in h.data && h.data.gameId === g.id
    );
  }, [history, g]);

  const needGB = g ? gameRamNeedGB(g, ramTotalGB) : 0;
  const ramColor: GbColor = g ? (g.ramDemand === "high" ? "red" : g.ramDemand === "low" ? "green" : "cyan") : "cyan";
  const ramText = g
    ? g.ramDemand === "high"
      ? t.ramHigh(fmtOne(needGB, lang))
      : g.ramDemand === "medium"
        ? t.ramMedium(fmtOne(needGB, lang))
        : t.ramLow(fmtOne(needGB, lang))
    : "";
  const gfxText = profile.graphics === "high" ? t.gfxHigh : profile.graphics === "smooth" ? t.gfxSmooth : t.gfxBalanced;
  const netText = profile.netPriority ? t.netOn : t.netOff;

  if (!mounted) return null;
  const portalTarget = document.getElementById("gb-phone-overlay-root");
  if (!portalTarget) return null;

  return createPortal(
    <div
      dir={lang === "fa" ? "rtl" : "ltr"}
      className="absolute inset-0 z-30 flex flex-col justify-end overflow-hidden rounded-[inherit]"
      role="dialog"
      aria-modal="true"
    >
      {/* backdrop */}
      <button aria-label="close" onClick={onClose} className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" />
      {/* bottom panel */}
      <div className="anim-fade-up relative flex max-h-[88%] min-h-0 flex-col rounded-t-3xl border-t border-gb-border bg-gb-bg shadow-[0_-12px_40px_rgba(0,0,0,0.5)]">
        <SheetTitle className="sr-only">{g?.name ?? "Game"}</SheetTitle>
        <SheetDescription className="sr-only">{g?.packageId ?? ""}</SheetDescription>

        <div className="gb-scroll min-h-0 flex-1 overflow-y-auto px-5 pb-6 pt-3">
          {/* drag handle */}
          <div className="mx-auto mb-4 h-1 w-10 shrink-0 rounded-full bg-gb-border" />

          {g ? (
            <div className="space-y-4">
              {/* a) header */}
              <div className={cn("flex items-center gap-3", lang === "fa" ? "ps-9" : "pe-9")}>
                <GameIcon game={g} size={52} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-black text-gb-text">{g.name}</div>
                  <div className="truncate font-mono text-[10px] text-gb-dim" dir="ltr">
                    {g.packageId}
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <Chip color="cyan" className="text-[9px]">{fmtBytesMB(g.sizeMB, lang)}</Chip>
                    <Chip
                      color={g.ramDemand === "high" ? "red" : g.ramDemand === "medium" ? "amber" : "green"}
                      className="text-[9px]"
                    >
                      {t.ram}: {t.demand[g.ramDemand]}
                    </Chip>
                  </div>
                </div>
              </div>

              {/* b) per-game profile */}
              <div className="space-y-2.5">
                <SectionTitle icon={<SlidersHorizontal className="size-4" />} title={t.profileTitle} sub={t.profileSub} />
                <NeonCard className="space-y-3.5 p-3.5">
                  <div>
                    <div className="mb-1.5 text-[11px] font-bold text-gb-dim">{t.graphics}</div>
                    <SegTabs
                      items={[
                        { id: "high", label: t.gHigh },
                        { id: "balanced", label: t.gBalanced },
                        { id: "smooth", label: t.gSmooth },
                      ]}
                      value={profile.graphics}
                      onChange={(id) => setProfile(g.id, { graphics: id as GameProfile["graphics"] })}
                    />
                  </div>
                  <div>
                    <div className="mb-1.5 text-[11px] font-bold text-gb-dim">{t.priority}</div>
                    <SegTabs
                      items={[
                        { id: "performance", label: t.pPerf },
                        { id: "balanced", label: t.pBalanced },
                        { id: "battery", label: t.pBattery },
                      ]}
                      value={profile.priority}
                      onChange={(id) => setProfile(g.id, { priority: id as GameProfile["priority"] })}
                    />
                  </div>
                  <ToggleRow
                    icon={<Network className="size-4" />}
                    title={t.netPriority}
                    sub={t.netPrioritySub}
                    checked={profile.netPriority}
                    onChange={(v) => setProfile(g.id, { netPriority: v })}
                  />
                </NeonCard>
              </div>

              {/* c) optimization suggestions */}
              <div className="space-y-2.5">
                <SectionTitle icon={<Lightbulb className="size-4" />} title={t.suggestTitle} />
                <div className="space-y-2">
                  <Callout color={ramColor} icon={<MemoryStick className="mt-0.5 size-4 shrink-0" />}>
                    {ramText}
                  </Callout>
                  <Callout color="purple" icon={<Palette className="mt-0.5 size-4 shrink-0" />}>
                    {gfxText}
                  </Callout>
                  <Callout color={profile.netPriority ? "green" : "cyan"} icon={<Network className="mt-0.5 size-4 shrink-0" />}>
                    {netText}
                  </Callout>
                  <Callout color="amber" icon={<ShieldCheck className="mt-0.5 size-4 shrink-0" />}>
                    {t.shaderTip}
                  </Callout>
                </div>
              </div>

              {/* d) previous test results */}
              <div className="space-y-2.5">
                <SectionTitle icon={<History className="size-4" />} title={t.histTitle} />
                {rows.length === 0 ? (
                  <p className="rounded-xl border border-gb-border/70 bg-gb-surface2/40 py-4 text-center text-[11px] text-gb-dim">
                    {t.noTests}
                  </p>
                ) : (
                  <ul className="gb-scroll max-h-40 space-y-1.5 overflow-y-auto pe-1">
                    {rows.map((h) => {
                      const d = h.data;
                      return (
                        <li
                          key={h.id}
                          className="anim-fade-up flex items-center gap-2 rounded-lg border border-gb-border/60 bg-gb-surface2/50 px-2.5 py-2"
                        >
                          {"freedMB" in d ? (
                            <Chip color="green" className="shrink-0 text-[9px]">{t.histBoost}</Chip>
                          ) : "avgFps" in d ? (
                            <Chip color="purple" className="shrink-0 text-[9px]">{t.histSession}</Chip>
                          ) : null}
                          <span className="min-w-0 flex-1 truncate text-[10px] font-bold text-gb-text/90">
                            {"freedMB" in d
                              ? t.freed(fmtInt(d.freedMB, lang))
                              : "avgFps" in d
                                ? t.sessionStat(fmtInt(d.avgFps, lang), fmtInt(d.drops, lang))
                                : ""}
                          </span>
                          <span className="shrink-0 text-[9px] text-gb-dim">{fmtDateTime(h.at, lang)}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {/* e) footer actions */}
              <div className="grid grid-cols-2 gap-2.5 border-t border-gb-border/60 pt-4">
                <NeonButton
                  color="green"
                  onClick={() => {
                    void startBoost(g.id);
                    onClose();
                  }}
                >
                  <Play className="size-4" />
                  {t.runGame}
                </NeonButton>
                <NeonButton color="purple" variant="outline" onClick={onClose}>
                  {t.close}
                </NeonButton>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>,
    portalTarget
  );
}
