"use client";

import * as React from "react";
import {
  ArrowDown,
  ChevronDown,
  Info,
  Layers,
  Lightbulb,
  MonitorSmartphone,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { useBooster } from "@/lib/gb/store";
import { fmtInt, fmtOne, fmtPct } from "@/lib/gb/format";
import { Callout, Chip, NeonCard, ScreenHeader, SectionTitle, StatusDot } from "../ui";

const S = {
  fa: {
    title: "دستگاه و برنامه",
    specs: "مشخصات دستگاه",
    specsSub: "تست شبیه‌ساز و گوشی واقعی",
    model: "مدل دستگاه",
    os: "نسخه",
    osWeb: "وب (نمونه‌ساز)",
    cores: "هسته‌ها",
    ram: "رم کل",
    screen: "صفحه",
    battery: "باتری",
    batteryNA: "API در دسترس نیست",
    network: "شبکه",
    emulatorRow: "شبیه‌ساز",
    emuDetected: "شناسایی شد",
    realPhone: "گوشی واقعی / مرورگر",
    rootTitle: "وضعیت روت",
    rootValue: "غیرفعال (بدون روت)",
    rootSub: "برنامه بدون نیاز به روت اجرا می‌شود.",
    envTitle: "تست محیط",
    envEmu: "شبیه‌ساز",
    envPhone: "گوشی واقعی",
    envSub: "سازگار با Android Emulator",
    noRootNote:
      "این برنامه در نسخه اول بدون روت طراحی شده است تا روی گوشی‌های معمولی قابل‌استفاده باشد و به قابلیت‌های مجاز اندروید اکتفا کند.",
    compatGuide: "راهنمای سازگاری",
    mvvm: "معماری MVVM",
    flowLabel: "جریان داده یک‌طرفه:",
    errorNote:
      "مدیریت خطا: قطع اتصال، تایم‌اوت تست‌ها و خطای APIها با اعلان مدیریت می‌شود؛ بازگردانی تنظیمات از صفحه تنظیمات امکان‌پذیر است.",
  },
  en: {
    title: "Device & App",
    specs: "Device specs",
    specsSub: "Emulator & real device test",
    model: "Device model",
    os: "OS version",
    osWeb: "Web (prototype)",
    cores: "Cores",
    ram: "Total RAM",
    screen: "Screen",
    battery: "Battery",
    batteryNA: "API unavailable",
    network: "Network",
    emulatorRow: "Emulator",
    emuDetected: "Detected",
    realPhone: "Real phone / browser",
    rootTitle: "Root status",
    rootValue: "Disabled (no root)",
    rootSub: "The app runs without root access.",
    envTitle: "Test environment",
    envEmu: "Emulator",
    envPhone: "Real phone",
    envSub: "Compatible with Android Emulator",
    noRootNote:
      "The first version of this app is designed without root so it works on ordinary phones and sticks to allowed Android capabilities.",
    compatGuide: "Compatibility guide",
    mvvm: "MVVM architecture",
    flowLabel: "Unidirectional data flow:",
    errorNote:
      "Error handling: disconnects, test timeouts and API errors are handled with notifications; settings can be restored from the Settings screen.",
  },
};

const COMPAT: { range: string; title: { fa: string; en: string }; desc: { fa: string; en: string } }[] = [
  {
    range: "Android 7-8",
    title: { fa: "پشتوانه پایه", en: "Baseline support" },
    desc: {
      fa: "پایش پایه حافظه، پاک‌سازی کش خود برنامه؛ بدون DoH سیستم",
      en: "Basic memory monitoring, own-app cache cleaning; no system-wide DoH",
    },
  },
  {
    range: "Android 9",
    title: { fa: "پایداری VPN", en: "VPN stability" },
    desc: {
      fa: "+ VpnService پایدارتر، هشدار حرارتی پایه",
      en: "+ More stable VpnService, basic thermal warning",
    },
  },
  {
    range: "Android 10-11",
    title: { fa: "فریم و دسترسی‌ها", en: "Frames & access" },
    desc: {
      fa: "+ API نرخ فریم، دسترسی Usage محدودتر",
      en: "+ Frame-rate API, more restricted Usage access",
    },
  },
  {
    range: "Android 12-13",
    title: { fa: "Game Mode سازنده", en: "Vendor Game Mode" },
    desc: {
      fa: "+ Game Mode رسمی سازنده، محدودیت پس‌زمینه سخت‌گیرانه‌تر",
      en: "+ Official vendor Game Mode, stricter background limits",
    },
  },
  {
    range: "Android 14-15",
    title: { fa: "پایش پیشرفته", en: "Advanced monitoring" },
    desc: {
      fa: "+ پایش حرارتی دقیق‌تر، مجوزهای اختیاری",
      en: "+ Finer thermal monitoring, optional permissions",
    },
  },
];

const MVVM: { en: string; desc: string }[] = [
  { en: "View", desc: "Jetpack Compose → screens/*.tsx" },
  { en: "ViewModel", desc: "StateFlow → store.ts + viewmodel hooks" },
  { en: "Model", desc: "Repository/DataStore → lib/gb/model/*" },
];

/** Parse Android version from the UA locally (null when not Android) */
function androidVersion(): string | null {
  if (typeof navigator === "undefined") return null;
  const m = navigator.userAgent.match(/Android\s+([\d.]+)/);
  return (m && m[1]) || null;
}

function SpecRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 py-2">
      <span className="shrink-0 text-[11px] text-gb-dim">{label}</span>
      <span className="min-w-0 truncate text-[11px] font-bold text-gb-text">{children}</span>
    </div>
  );
}

export default function DeviceScreen() {
  const lang = useBooster((s) => s.settings.lang);
  const t = S[lang];
  const device = useBooster((s) => s.device);
  const goBack = useBooster((s) => s.goBack);
  const [openIndex, setOpenIndex] = React.useState<number | null>(null);

  const uaVer = androidVersion();

  return (
    <>
      <ScreenHeader title={t.title} onBack={goBack} />
      <div className="space-y-4 px-4 pb-6 pt-4">
        {/* 2) device specs */}
        <NeonCard className="p-3.5">
          <SectionTitle icon={<Smartphone className="size-4" />} title={t.specs} sub={t.specsSub} />
          <div className="mt-2 divide-y divide-gb-border/50">
            <SpecRow label={t.model}>{device.model}</SpecRow>
            <SpecRow label={t.os}>
              {uaVer !== null ? (
                <span dir="ltr" className="font-display">
                  Android {uaVer}
                </span>
              ) : (
                t.osWeb
              )}
            </SpecRow>
            <SpecRow label={t.cores}>{fmtInt(device.cores, lang)}</SpecRow>
            <SpecRow label={t.ram}>
              <span dir="ltr">{`${fmtOne(device.ramGB, lang)} GB`}</span>
            </SpecRow>
            <SpecRow label={t.screen}>
              <span dir="ltr">{device.screen}</span>
            </SpecRow>
            <SpecRow label={t.battery}>
              {device.batterySupported
                ? `${fmtPct(device.batteryLevel ?? 0, lang)}${device.batteryCharging ? " ⚡" : ""}`
                : t.batteryNA}
            </SpecRow>
            <SpecRow label={t.network}>
              <span className="flex items-center gap-1.5">
                {device.networkType}
                <StatusDot color={device.online ? "green" : "red"} />
              </span>
            </SpecRow>
            <SpecRow label={t.emulatorRow}>{device.isEmulator ? t.emuDetected : t.realPhone}</SpecRow>
          </div>
        </NeonCard>

        {/* 3) root + environment cards */}
        <div className="grid grid-cols-2 gap-3">
          <NeonCard glow="green" className="p-3.5">
            <ShieldCheck className="size-7 text-gb-green" />
            <div className="mt-2 text-[11px] font-bold text-gb-dim">{t.rootTitle}</div>
            <div className="mt-0.5 text-[13px] font-black text-gb-green text-glow-green">{t.rootValue}</div>
            <div className="mt-1 text-[10px] leading-relaxed text-gb-dim">{t.rootSub}</div>
          </NeonCard>
          <NeonCard className="p-3.5">
            <MonitorSmartphone className="size-7 text-gb-cyan" />
            <div className="mt-2 text-[11px] font-bold text-gb-dim">{t.envTitle}</div>
            <div className="mt-0.5 text-[13px] font-black text-gb-text">
              {device.isEmulator ? t.envEmu : t.envPhone}
            </div>
            <div className="mt-1 text-[10px] leading-relaxed text-gb-dim">{t.envSub}</div>
          </NeonCard>
        </div>

        {/* 4) no-root note */}
        <Callout icon={<Lightbulb className="mt-0.5 size-4 shrink-0" />} color="purple">
          {t.noRootNote}
        </Callout>

        {/* 5) compatibility accordion */}
        <NeonCard className="p-3.5">
          <SectionTitle icon={<Smartphone className="size-4" />} title={t.compatGuide} />
          <div className="mt-3 space-y-2">
            {COMPAT.map((c, i) => {
              const open = openIndex === i;
              return (
                <div key={c.range} className="rounded-xl border border-gb-border bg-gb-surface2/60">
                  <button
                    onClick={() => setOpenIndex(open ? null : i)}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-start"
                    aria-expanded={open}
                  >
                    <Chip color="cyan">
                      <span dir="ltr">{c.range}</span>
                    </Chip>
                    <span className="min-w-0 flex-1 truncate text-[11px] font-bold text-gb-text">{c.title[lang]}</span>
                    <ChevronDown
                      className={`size-3.5 shrink-0 text-gb-dim transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                    />
                  </button>
                  {open ? (
                    <p className="anim-fade-up border-t border-gb-border/60 px-3 py-2 text-[10px] leading-relaxed text-gb-dim">
                      {c.desc[lang]}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </NeonCard>

        {/* 6) MVVM architecture */}
        <NeonCard className="p-3.5">
          <SectionTitle icon={<Layers className="size-4" />} title={t.mvvm} />
          <div className="mt-3 space-y-1.5">
            {MVVM.map((m, i) => (
              <React.Fragment key={m.en}>
                {i > 0 ? (
                  <div className="flex items-center justify-center text-gb-dim">
                    <ArrowDown className="size-3.5" />
                  </div>
                ) : null}
                <div className="rounded-xl border border-gb-border bg-gb-surface2/60 px-3 py-2 text-center">
                  <div className="font-display text-[10px] font-bold text-gb-cyan" dir="ltr">
                    {m.en}
                  </div>
                  <div className="mt-0.5 text-[10px] leading-relaxed text-gb-dim" dir="ltr">
                    {m.desc}
                  </div>
                </div>
              </React.Fragment>
            ))}
          </div>
          <p className="mt-2.5 text-center text-[10px] text-gb-dim">
            {t.flowLabel}{" "}
            <span dir="ltr" className="font-display text-gb-cyan/80">
              Model → ViewModel → View
            </span>
          </p>
        </NeonCard>

        {/* 7) error-handling callout */}
        <Callout icon={<Info className="mt-0.5 size-4 shrink-0" />} color="cyan">{t.errorNote}</Callout>
      </div>
    </>
  );
}
