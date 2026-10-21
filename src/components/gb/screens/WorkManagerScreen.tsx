"use client";

import * as React from "react";
import { AppWindow, CalendarClock, Gauge, Info, ScanLine, ScrollText, Trash2 } from "lucide-react";
import { useBooster } from "@/lib/gb/store";
import { fmtDateTime, fmtDuration, fmtInt } from "@/lib/gb/format";
import { Switch } from "@/components/ui/switch";
import { Callout, Chip, LogList, NeonButton, NeonCard, ScreenHeader, SectionTitle } from "../ui";

/* ------------------------------ local strings ------------------------------ */

const S = {
  fa: {
    title: "کارهای پس‌زمینه",
    scheduledJobs: "کارهای زمان‌بندی‌شده",
    scheduledSub: "WorkManager — اجرای دوره‌ای",
    lastRunLabel: "آخرین اجرا:",
    nextRunLabel: "اجرای بعدی:",
    dueSoon: "به‌زودی",
    intro:
      "کارهای زمان‌بندی‌شده با WorkManager در پس‌زمینه اجرا می‌شوند؛ در حالت Doze/صرفه‌جویی باتری ممکن است به تعویق بیفتند.",
    introSub: "در این نمونه‌ساز، اجرای خودکار واقعاً زمان‌بندی و ثبت می‌شود.",
    logsTitle: "گزارش اجرا (WorkManager Logs)",
    logsSub: "۳۰ اجرای آخر",
    noLogs: "هنوز اجرایی ثبت نشده",
    footerNote:
      "در نسخه اندروید: WorkManager + PeriodicWorkRequest با قید شارژ/شبکه در موارد مناسب.",
  },
  en: {
    title: "Background Tasks",
    scheduledJobs: "Scheduled Jobs",
    scheduledSub: "WorkManager — periodic runs",
    lastRunLabel: "Last run:",
    nextRunLabel: "Next run:",
    dueSoon: "Due soon",
    intro:
      "WorkManager jobs run in the background on a schedule; under Doze / battery saver they may be deferred.",
    introSub: "In this prototype, automatic runs are genuinely scheduled and logged.",
    logsTitle: "Execution Logs (WorkManager)",
    logsSub: "Last 30 runs",
    noLogs: "No runs logged yet",
    footerNote:
      "On Android: WorkManager + PeriodicWorkRequest with charging/network constraints where appropriate.",
  },
} as const;

/* -------------------------------- job meta --------------------------------- */

type JobMeta = {
  icon: React.ComponentType<{ className?: string }>;
  fa: string;
  en: string;
};

const JOB_META: Record<string, JobMeta> = {
  smart_manager: { icon: ScanLine, fa: "مدیریت هوشمند", en: "Smart Manager" },
  cache_clean: { icon: Trash2, fa: "پاک‌سازی حافظه نهان", en: "Cache Cleaner" },
  memory_opt: { icon: Gauge, fa: "بهینه‌سازی آمار عملکرد", en: "Performance Stats Optimizer" },
  apps_check: { icon: AppWindow, fa: "بررسی بازی‌های نصب‌شده", en: "Installed Games Check" },
};

const HOUR_MS = 3_600_000;

/* ================================= screen ================================== */

export default function WorkManagerScreen() {
  const lang = useBooster((s) => s.settings.lang);
  const goBack = useBooster((s) => s.goBack);
  const jobs = useBooster((s) => s.jobs);
  const workLogs = useBooster((s) => s.workLogs);
  const toggleJob = useBooster((s) => s.toggleJob);
  const runJobNow = useBooster((s) => s.runJobNow);
  const tc = useBooster((s) => s.t);

  const t = S[lang];

  /* local 1s ticker for live countdowns */
  const [now, setNow] = React.useState<number>(() => Date.now());
  React.useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div>
      <ScreenHeader
        title={t.title}
        onBack={goBack}
        action={
          <Chip color="purple" dot className="font-display">
            WorkManager
          </Chip>
        }
      />

      <div className="space-y-4 px-4 pb-6 pt-4">
        {/* ---------------------------- intro ----------------------------- */}
        <Callout color="purple" icon={<Info className="mt-0.5 size-4 shrink-0" />}>
          <div>{t.intro}</div>
          <div className="mt-1 text-[10px] text-gb-dim">{t.introSub}</div>
        </Callout>

        {/* ----------------------------- jobs ------------------------------ */}
        <div>
          <SectionTitle
            icon={<CalendarClock className="size-4" />}
            title={t.scheduledJobs}
            sub={t.scheduledSub}
          />

          <div className="mt-3 space-y-2.5">
            {jobs.map((job) => {
              const meta = JOB_META[job.id] ?? { icon: AppWindow, fa: job.id, en: job.id };
              const Icon = meta.icon;
              const title = lang === "fa" ? meta.fa : meta.en;
              const desc =
                lang === "fa"
                  ? `اجرای هر ${fmtInt(job.intervalH, lang)} ساعت`
                  : `Runs every ${fmtInt(job.intervalH, lang)}h`;
              const remaining = (job.lastRun ?? 0) + job.intervalH * HOUR_MS - now;
              const nextText =
                job.enabled && remaining > 0 ? fmtDuration(remaining, lang) : t.dueSoon;

              return (
                <NeonCard key={job.id} className="p-3.5" glow={job.enabled ? "cyan" : "none"}>
                  <div className="flex items-center gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-gb-border bg-gb-surface text-gb-cyan">
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[12px] font-bold text-gb-text">{title}</div>
                      <div className="mt-0.5 truncate text-[10px] text-gb-dim">{desc}</div>
                    </div>
                    <Switch
                      checked={job.enabled}
                      onCheckedChange={() => toggleJob(job.id)}
                      className="data-[state=checked]:bg-gb-green"
                      aria-label={title}
                    />
                  </div>

                  <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-gb-border/60 pt-2.5 text-[10px] text-gb-dim">
                    <span>
                      {t.lastRunLabel}{" "}
                      {job.lastRun ? (
                        <span className="font-mono" dir="ltr">
                          {fmtDateTime(job.lastRun, lang)}
                        </span>
                      ) : (
                        tc("common.never")
                      )}
                    </span>
                    <span className="text-gb-border">•</span>
                    <span>
                      {t.nextRunLabel}{" "}
                      <span className={job.enabled && remaining > 0 ? "font-mono text-gb-cyan" : ""} dir="ltr">
                        {nextText}
                      </span>
                    </span>
                  </div>

                  <div className="mt-2.5 flex justify-end">
                    <NeonButton size="sm" variant="outline" color="cyan" onClick={() => runJobNow(job.id)}>
                      {tc("common.run")}
                    </NeonButton>
                  </div>
                </NeonCard>
              );
            })}
          </div>
        </div>

        {/* ----------------------------- logs ------------------------------ */}
        <NeonCard className="p-3.5">
          <SectionTitle icon={<ScrollText className="size-4" />} title={t.logsTitle} sub={t.logsSub} />
          <div className="mt-3">
            <LogList
              items={workLogs.slice(0, 30).map((w) => ({ id: w.id, at: w.at, message: w.message }))}
              emptyText={t.noLogs}
              maxH="max-h-56"
            />
          </div>
        </NeonCard>

        {/* --------------------------- footer note -------------------------- */}
        <p className="pt-1 text-center text-[10px] leading-relaxed text-gb-dim">{t.footerNote}</p>
      </div>
    </div>
  );
}
