"use client";

import * as React from "react";
import {
  Activity,
  BellOff,
  CheckCircle2,
  Cloud,
  Database,
  Gamepad2,
  Globe,
  HardDrive,
  Image as ImageIcon,
  Info,
  Lock,
  MemoryStick,
  Music,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";
import { useBooster } from "@/lib/gb/store";
import { GAMES, gameRamNeedGB } from "@/lib/gb/model/games";
import { fmtBytesMB, fmtInt, fmtOne } from "@/lib/gb/format";
import {
  Callout,
  Chip,
  Confirm,
  GaugeRing,
  NeonButton,
  NeonCard,
  ScreenHeader,
  SectionTitle,
  StatTile,
  TimeBadge,
  type GbColor,
} from "../ui";

/* ------------------------------ local strings ------------------------------ */

const S = {
  fa: {
    title: "مدیریت هوشمند RAM",
    used: "مصرف",
    pressureLabel: "فشار حافظه",
    pLow: "فشار: کم",
    pMed: "فشار: متوسط",
    pHigh: "فشار: بالا",
    usedTile: "مصرفی",
    freeTile: "آزاد",
    totalTile: "کل",
    preCheck: "بررسی پیش از اجرای بازی",
    okMem: (name: string, need: string) => `حافظه کافی است برای ${name} (~${need} گیگ نیاز)`,
    lowMem: (need: string) => `فشار حافظه! بازی ~${need} گیگ نیاز دارد — بهینه‌سازی/پاک‌سازی کنید`,
    hogs: "فعالیت‌های پرمصرف",
    hogsSub: "فرآیندهای شناسایی‌شده در حافظه",
    refresh: "بررسی دوباره",
    own: "خود برنامه",
    sys: "سیستمی/سایر",
    stopOwn: "توقف فعالیت‌های غیرضروری خود برنامه",
    freedMB: (mb: string) => `${mb} MB حافظه آزاد شد`,
    nothingOwn: "فعالیتی از خود برنامه در حال اجرا نیست",
    noRoot:
      "فقط فعالیت‌های خود Game Booster متوقف می‌شوند؛ سرویس‌های ضروری اندروید و سایر اپ‌ها دست‌نخورده می‌مانند (سیاست بدون روت).",
    clean: "پاک‌سازی فایل‌های قابل‌دسترسی",
    cleanSub: "در محدوده دسترسی استاندارد اندروید",
    cleanable: "قابل‌پاک‌سازی",
    protChip: "محافظت‌شده",
    protSub: "حذف کش Shader باعث مکث و لگ می‌شود",
    sensChip: "حساس",
    limitChip: "محدود",
    limitSub: "کش خصوصی سایر اپلیکیشن‌ها در اندروید معمولی محدود است",
    safeClean: "پاک‌سازی امن",
    shaderClean: "حذف کش Shader (خطر لگ)",
    sensTitle: "تأیید پاک‌سازی حساس",
    sensBody:
      "با حذف کش Shader، بازی‌ها باید شیدرها را در اجرای بعدی دوباره بسازند و ممکن است مکث و لگ ببینید. این پاک‌سازی حساس فقط با تأیید شما انجام می‌شود.",
    shaderTitle: "حذف کش Shader",
    shaderBody:
      "کش Shader بازی‌ها حذف شود؟ در اجرای بعدی، بازی‌ها شیدرها را از نو می‌سازند و ممکن است مکث یا لگ تجربه کنید.",
    confirm: "تأیید و پاک‌سازی",
    cancel: "انصراف",
    cleaned: (v: string) => `${v} فضا آزاد شد`,
    nothingClean: "مورد قابل پاک‌سازی باقی نمانده است",
    shaderCleaned: (v: string) => `${v} کش Shader حذف شد`,
    lastFreed: (mb: string) => `آخرین آزادسازی: ${mb} MB`,
    bottomNote:
      "محافظت از فایل‌ها و داده‌های بازی همیشه اولویت است؛ پاک‌سازی‌های حساس فقط با تأیید شما انجام می‌شود.",
  },
  en: {
    title: "Smart RAM Manager",
    used: "Usage",
    pressureLabel: "Memory pressure",
    pLow: "Pressure: Low",
    pMed: "Pressure: Medium",
    pHigh: "Pressure: High",
    usedTile: "Used",
    freeTile: "Free",
    totalTile: "Total",
    preCheck: "Pre-launch check",
    okMem: (name: string, need: string) => `Enough memory for ${name} (~${need} GB needed)`,
    lowMem: (need: string) => `Memory pressure! The game needs ~${need} GB — optimize/clean first`,
    hogs: "Memory Hogs",
    hogsSub: "Processes detected in memory",
    refresh: "Rescan",
    own: "Own app",
    sys: "System/Other",
    stopOwn: "Stop non-essential own activities",
    freedMB: (mb: string) => `${mb} MB of memory freed`,
    nothingOwn: "No own-app activity is running",
    noRoot:
      "Only Game Booster's own activities are stopped; essential Android services and other apps remain untouched (no-root policy).",
    clean: "Accessible Files Cleanup",
    cleanSub: "Within standard Android access scope",
    cleanable: "cleanable",
    protChip: "Protected",
    protSub: "Deleting shader cache causes stutter and lag",
    sensChip: "Sensitive",
    limitChip: "Restricted",
    limitSub: "Other apps' private cache is restricted by Android",
    safeClean: "Safe Clean",
    shaderClean: "Delete Shader Cache (lag risk)",
    sensTitle: "Confirm sensitive cleanup",
    sensBody:
      "Deleting the shader cache forces games to rebuild shaders on next launch, which can cause stutter and lag. This sensitive cleanup only runs with your confirmation.",
    shaderTitle: "Delete shader cache",
    shaderBody:
      "Delete the games' shader cache? Games will rebuild shaders on next launch and may stutter or lag.",
    confirm: "Confirm & clean",
    cancel: "Cancel",
    cleaned: (v: string) => `${v} freed`,
    nothingClean: "Nothing left to clean",
    shaderCleaned: (v: string) => `${v} of shader cache deleted`,
    lastFreed: (mb: string) => `Last cleanup: ${mb} MB`,
    bottomNote:
      "Protecting game files and data always comes first; sensitive cleanups only run with your confirmation.",
  },
} as const;

/* ------------------------------ hog icon map ------------------------------- */

const HOG_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Globe,
  Image: ImageIcon,
  RefreshCw,
  Activity,
  Database,
  BellOff,
  Music,
  Cloud,
};

function DimChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex shrink-0 items-center rounded-full border border-gb-border px-2.5 py-0.5 text-[10px] font-bold text-gb-dim">
      {children}
    </span>
  );
}

/* ================================= screen ================================== */

export default function RamManagerScreen() {
  const lang = useBooster((s) => s.settings.lang);
  const goBack = useBooster((s) => s.goBack);
  const ramUsedGB = useBooster((s) => s.perf.ramUsedGB);
  const ramTotalGB = useBooster((s) => s.perf.ramTotalGB);
  const hogs = useBooster((s) => s.hogs);
  const cleanables = useBooster((s) => s.cleanables);
  const shaderProtect = useBooster((s) => s.settings.shaderProtect);
  const sensitiveConfirm = useBooster((s) => s.settings.sensitiveConfirm);
  const selectedGameId = useBooster((s) => s.selectedGameId);
  const lastFreedMB = useBooster((s) => s.lastFreedMB);
  const lastBoostAt = useBooster((s) => s.lastBoostAt);
  const refreshHogs = useBooster((s) => s.refreshHogs);
  const killOwnHogs = useBooster((s) => s.killOwnHogs);
  const refreshCleanables = useBooster((s) => s.refreshCleanables);
  const cleanSafeItems = useBooster((s) => s.cleanSafeItems);
  const cleanShaderCache = useBooster((s) => s.cleanShaderCache);

  const t = S[lang];
  const [confirmKind, setConfirmKind] = React.useState<"safe" | "shader" | null>(null);

  React.useEffect(() => {
    refreshHogs();
    refreshCleanables();
  }, [refreshHogs, refreshCleanables]);

  /* ---- derived values ---- */
  const pct = ramTotalGB > 0 ? ramUsedGB / ramTotalGB : 0;
  const freeGB = Math.max(0, ramTotalGB - ramUsedGB);
  const ringColor: GbColor = pct < 0.7 ? "green" : pct < 0.85 ? "amber" : "red";
  const pressureColor: GbColor = pct < 0.6 ? "green" : pct < 0.8 ? "amber" : "red";
  const pressureText = pct < 0.6 ? t.pLow : pct < 0.8 ? t.pMed : t.pHigh;

  const game = selectedGameId ? GAMES.find((g) => g.id === selectedGameId) : undefined;
  const needGB = game ? gameRamNeedGB(game, ramTotalGB) : 0;
  const totalCleanMB = cleanables.reduce((a, c) => a + c.mb, 0);
  const shaderSensitive = !shaderProtect;

  /* ---- actions ---- */
  const stopOwn = () => {
    const freed = killOwnHogs();
    if (freed > 0) {
      toast.success(t.freedMB(fmtInt(freed, lang)));
      refreshHogs();
    } else {
      toast.info(t.nothingOwn);
    }
  };

  const doSafeClean = (includeShader: boolean) => {
    let freed = cleanSafeItems();
    if (includeShader) freed += cleanShaderCache();
    setConfirmKind(null);
    if (freed > 0) toast.success(t.cleaned(fmtBytesMB(freed, lang)));
    else toast.info(t.nothingClean);
    refreshCleanables();
  };

  const doShaderClean = () => {
    const freed = cleanShaderCache();
    setConfirmKind(null);
    if (freed > 0) toast.warning(t.shaderCleaned(fmtBytesMB(freed, lang)));
  };

  const onSafeCleanClick = () => {
    if (sensitiveConfirm && shaderSensitive) setConfirmKind("safe");
    else doSafeClean(false);
  };

  const onShaderCleanClick = () => setConfirmKind("shader");

  return (
    <div>
      <ScreenHeader title={t.title} onBack={goBack} />

      <div className="space-y-4 px-4 pb-6 pt-4">
        {/* ------------------------- memory status ------------------------- */}
        <NeonCard className="p-4">
          <div className="flex items-center gap-4">
            <GaugeRing
              value={pct}
              size={120}
              label={`${fmtOne(pct * 100, lang)}٪`}
              sub={t.used}
              color={ringColor}
            />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <StatTile
                className="p-2.5"
                icon={<MemoryStick className="size-3.5" />}
                title={t.usedTile}
                value={`${fmtOne(ramUsedGB, lang)} GB`}
                color={ringColor}
              />
              <StatTile
                className="p-2.5"
                icon={<Sparkles className="size-3.5" />}
                title={t.freeTile}
                value={`${fmtOne(freeGB, lang)} GB`}
                color="green"
              />
              <StatTile
                className="p-2.5"
                icon={<HardDrive className="size-3.5" />}
                title={t.totalTile}
                value={`${fmtOne(ramTotalGB, lang)} GB`}
                color="cyan"
              />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-gb-border/60 pt-3">
            <span className="text-[11px] text-gb-dim">{t.pressureLabel}</span>
            <Chip color={pressureColor} dot>
              {pressureText}
            </Chip>
          </div>
        </NeonCard>

        {/* ---------------------- pre-launch check ------------------------ */}
        {game ? (
          <NeonCard className="p-4">
            <SectionTitle
              icon={<Gamepad2 className="size-4" />}
              title={t.preCheck}
              sub={game.name}
            />
            <div className="mt-3">
              {freeGB >= needGB ? (
                <Callout color="green" icon={<CheckCircle2 className="mt-0.5 size-4 shrink-0" />}>
                  {t.okMem(game.name, fmtOne(needGB, lang))}
                </Callout>
              ) : (
                <Callout color="amber" icon={<TriangleAlert className="mt-0.5 size-4 shrink-0" />}>
                  {t.lowMem(fmtOne(needGB, lang))}
                </Callout>
              )}
            </div>
          </NeonCard>
        ) : null}

        {/* --------------------------- hogs list --------------------------- */}
        <NeonCard className="p-3.5">
          <SectionTitle
            icon={<MemoryStick className="size-4" />}
            title={t.hogs}
            sub={t.hogsSub}
            action={
              <button
                onClick={refreshHogs}
                aria-label={t.refresh}
                className="grid size-8 shrink-0 place-items-center rounded-lg border border-gb-border bg-gb-surface2 text-gb-cyan transition hover:border-gb-green/50 hover:text-gb-green"
              >
                <RefreshCw className="size-3.5" />
              </button>
            }
          />

          <div className="gb-scroll mt-3 max-h-48 space-y-1.5 overflow-y-auto pe-1">
            {hogs.map((h) => {
              const Icon = HOG_ICONS[h.icon] ?? Activity;
              return (
                <div
                  key={h.id}
                  className="flex items-center gap-2.5 rounded-xl border border-gb-border bg-gb-surface2/40 px-3 py-2"
                >
                  <span className="grid size-7 shrink-0 place-items-center rounded-lg border border-gb-border bg-gb-surface text-gb-cyan">
                    <Icon className="size-3.5" />
                  </span>
                  <div className="min-w-0 flex-1 truncate text-[11px] text-gb-text">{h.name}</div>
                  <span className="shrink-0 font-mono text-[10px] text-gb-dim" dir="ltr">
                    {fmtInt(h.mb, lang)} MB
                  </span>
                  {h.own ? (
                    <Chip color="green">{t.own}</Chip>
                  ) : (
                    <DimChip>{t.sys}</DimChip>
                  )}
                </div>
              );
            })}
          </div>

          <NeonButton color="purple" className="mt-3 w-full" onClick={stopOwn}>
            {t.stopOwn}
          </NeonButton>

          <div className="mt-3">
            <Callout color="cyan" icon={<Info className="mt-0.5 size-4 shrink-0" />}>
              {t.noRoot}
            </Callout>
          </div>
        </NeonCard>

        {/* --------------------------- cleanables -------------------------- */}
        <NeonCard className="p-3.5">
          <SectionTitle icon={<Trash2 className="size-4" />} title={t.clean} sub={t.cleanSub} />

          <div className="mt-3 flex items-center justify-between rounded-xl border border-gb-border bg-gb-surface2/40 px-3.5 py-3">
            <div>
              <div className="text-glow-green text-xl font-black text-gb-green">
                {fmtBytesMB(totalCleanMB, lang)}
              </div>
              <div className="mt-0.5 text-[10px] text-gb-dim">{t.cleanable}</div>
            </div>
            <Trash2 className="size-5 text-gb-green/70" />
          </div>

          <div className="mt-3 space-y-1.5">
            {cleanables.map((c) => {
              /* safe rows — directly cleanable */
              if (c.safe) {
                return (
                  <div
                    key={c.id}
                    className="flex items-center gap-2.5 rounded-xl border border-gb-border bg-gb-surface2/40 px-3 py-2.5"
                  >
                    <CheckCircle2 className="size-4 shrink-0 text-gb-green" />
                    <div className="min-w-0 flex-1 truncate text-[11px] text-gb-text">{c.name}</div>
                    <span className="shrink-0 font-mono text-[10px] text-gb-dim" dir="ltr">
                      {fmtBytesMB(c.mb, lang)}
                    </span>
                  </div>
                );
              }

              /* shader cache row — protected or sensitive */
              if (c.protectedShader !== undefined) {
                if (shaderProtect) {
                  return (
                    <div
                      key={c.id}
                      className="flex items-center gap-2.5 rounded-xl border border-gb-border bg-gb-surface2/40 px-3 py-2.5"
                    >
                      <Lock className="size-4 shrink-0 text-gb-amber" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[11px] font-semibold text-gb-text">{c.name}</div>
                        <div className="mt-0.5 text-[9.5px] leading-relaxed text-gb-dim">{t.protSub}</div>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <Chip color="amber">{t.protChip}</Chip>
                        <span className="font-mono text-[10px] text-gb-dim" dir="ltr">
                          {fmtBytesMB(c.mb, lang)}
                        </span>
                      </div>
                    </div>
                  );
                }
                return (
                  <div
                    key={c.id}
                    onClick={onShaderCleanClick}
                    className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-gb-red/30 bg-gb-surface2/40 px-3 py-2.5 transition hover:border-gb-red/60"
                  >
                    <TriangleAlert className="size-4 shrink-0 text-gb-red" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[11px] font-semibold text-gb-text">{c.name}</div>
                      <div className="mt-0.5 text-[9.5px] leading-relaxed text-gb-dim">{t.protSub}</div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <Chip color="red">{t.sensChip}</Chip>
                      <span className="font-mono text-[10px] text-gb-dim" dir="ltr">
                        {fmtBytesMB(c.mb, lang)}
                      </span>
                    </div>
                  </div>
                );
              }

              /* other apps' private cache — restricted */
              return (
                <div
                  key={c.id}
                  className="flex items-center gap-2.5 rounded-xl border border-gb-border bg-gb-surface2/40 px-3 py-2.5"
                >
                  <Lock className="size-4 shrink-0 text-gb-dim" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[11px] text-gb-text/80">{c.name}</div>
                    <div className="mt-0.5 text-[9.5px] leading-relaxed text-gb-dim">{t.limitSub}</div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <DimChip>{t.limitChip}</DimChip>
                    <span className="font-mono text-[10px] text-gb-dim" dir="ltr">
                      {fmtBytesMB(c.mb, lang)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <NeonButton color="green" className="mt-3 w-full" onClick={onSafeCleanClick}>
            {t.safeClean}
          </NeonButton>

          {shaderSensitive ? (
            <NeonButton color="red" variant="outline" size="sm" className="mt-2 w-full" onClick={onShaderCleanClick}>
              {t.shaderClean}
            </NeonButton>
          ) : null}
        </NeonCard>

        {/* ------------------------ result footer -------------------------- */}
        {lastFreedMB !== null ? (
          <div className="flex items-center justify-center gap-2">
            <Chip color="green" dot>
              {t.lastFreed(fmtInt(lastFreedMB, lang))}
            </Chip>
            {lastBoostAt !== null ? <TimeBadge at={lastBoostAt} /> : null}
          </div>
        ) : null}

        {/* -------------------------- bottom note -------------------------- */}
        <Callout color="amber" icon={<ShieldCheck className="mt-0.5 size-4 shrink-0" />}>
          {t.bottomNote}
        </Callout>
      </div>

      {/* ----------------------------- confirms ----------------------------- */}
      <Confirm
        open={confirmKind !== null}
        danger
        title={confirmKind === "shader" ? t.shaderTitle : t.sensTitle}
        body={confirmKind === "shader" ? t.shaderBody : t.sensBody}
        confirmText={t.confirm}
        cancelText={t.cancel}
        onConfirm={() => (confirmKind === "shader" ? doShaderClean() : doSafeClean(true))}
        onCancel={() => setConfirmKind(null)}
      />
    </div>
  );
}
