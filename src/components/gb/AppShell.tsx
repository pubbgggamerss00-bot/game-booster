"use client";

import * as React from "react";
import Image from "next/image";
import { Toaster as SonnerToaster } from "sonner";
import {
  Activity,
  BatteryCharging,
  BatteryFull,
  Gamepad2,
  Home,
  BarChart3,
  Rocket,
  Settings,
  SignalHigh,
  Wifi,
  WifiOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useBooster } from "@/lib/gb/store";
import { nowClock, fmtInt } from "@/lib/gb/format";
import type { ScreenId } from "@/lib/gb/types";
import HomeScreen from "./screens/HomeScreen";
import LibraryScreen from "./screens/LibraryScreen";
import MonitorScreen from "./screens/MonitorScreen";
import SettingsScreen from "./screens/SettingsScreen";
import DnsScreen from "./screens/DnsScreen";
import RamManagerScreen from "./screens/RamManagerScreen";
import WorkManagerScreen from "./screens/WorkManagerScreen";
import DeviceScreen from "./screens/DeviceScreen";
import BoostOverlay from "./BoostOverlay";
import SessionHud from "./SessionHud";

/* ------------------------------ screen router ------------------------------ */

function ScreenRouter() {
  const screen = useBooster((s) => s.screen);
  switch (screen) {
    case "home":
      return <HomeScreen />;
    case "library":
      return <LibraryScreen />;
    case "monitor":
      return <MonitorScreen />;
    case "settings":
      return <SettingsScreen />;
    case "dns":
      return <DnsScreen />;
    case "ram":
      return <RamManagerScreen />;
    case "work":
      return <WorkManagerScreen />;
    case "device":
      return <DeviceScreen />;
    default:
      return <HomeScreen />;
  }
}

/* -------------------------------- status bar ------------------------------- */

function StatusBar() {
  const lang = useBooster((s) => s.settings.lang);
  const batteryLevel = useBooster((s) => s.device.batteryLevel);
  const batteryCharging = useBooster((s) => s.device.batteryCharging);
  const online = useBooster((s) => s.device.online);
  const [clock, setClock] = React.useState("--:--");
  React.useEffect(() => {
    const upd = () => setClock(nowClock(lang));
    upd();
    const iv = setInterval(upd, 15_000);
    return () => clearInterval(iv);
  }, [lang]);
  const level = batteryLevel ?? 82;
  return (
    <div className="relative z-20 flex items-center justify-between border-b border-gb-border/50 bg-gb-bg/80 px-4 py-1.5 text-[10px] font-bold text-gb-text/90">
      <div className="flex items-center gap-1.5">
        {online ? <Wifi className="size-3 text-gb-cyan" /> : <WifiOff className="size-3 text-gb-red" />}
        <SignalHigh className="size-3 text-gb-cyan" />
        {batteryCharging ? (
          <BatteryCharging className="size-3.5 text-gb-green" />
        ) : (
          <span className="flex items-center gap-1">
            <BatteryFull className={cn("size-3.5", level <= 20 ? "text-gb-red" : "text-gb-green")} />
            <span className="text-[9px]">{fmtInt(level, lang)}٪</span>
          </span>
        )}
      </div>
      <span className="font-mono" dir="ltr">
        {clock}
      </span>
    </div>
  );
}

/* -------------------------------- bottom nav ------------------------------- */

const NAV: { id: ScreenId; icon: React.ElementType }[] = [
  { id: "home", icon: Home },
  { id: "library", icon: Gamepad2 },
  { id: "monitor", icon: BarChart3 },
  { id: "settings", icon: Settings },
];

function BottomNav() {
  const screen = useBooster((s) => s.screen);
  const navigate = useBooster((s) => s.navigate);
  const t = useBooster((s) => s.t);
  const label = (id: ScreenId) => t(("nav." + id) as "nav.home");
  return (
    <nav
      aria-label="main navigation"
      className="relative z-20 grid grid-cols-4 border-t border-gb-border bg-gb-surface/95 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1.5 backdrop-blur-md"
    >
      {NAV.map(({ id, icon: Icon }) => {
        const active = screen === id;
        return (
          <button
            key={id}
            onClick={() => navigate(id)}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex flex-col items-center gap-0.5 py-1 transition-colors",
              active ? "text-gb-purple" : "text-gb-dim hover:text-gb-text"
            )}
          >
            <span
              className={cn(
                "grid size-9 place-items-center rounded-xl transition-all",
                active && "bg-gb-purple/15 shadow-[0_0_14px_color-mix(in_srgb,var(--gb-purple)_35%,transparent)]"
              )}
            >
              <Icon className="size-4.5" />
            </span>
            <span className="text-[9px] font-bold">{label(id)}</span>
          </button>
        );
      })}
    </nav>
  );
}

/* ------------------------------ offline banner ----------------------------- */

function OfflineBanner() {
  const online = useBooster((s) => s.device.online);
  const lang = useBooster((s) => s.settings.lang);
  if (online) return null;
  return (
    <div className="anim-fade-up absolute inset-x-0 top-7 z-40 mx-auto w-fit rounded-full border border-gb-red/50 bg-gb-red/15 px-4 py-1.5 text-[11px] font-bold text-gb-red shadow-lg backdrop-blur">
      {lang === "fa" ? "اتصال اینترنت قطع است — نتایج تست شبکه محدود می‌شود" : "You are offline — network tests are limited"}
    </div>
  );
}

/* ------------------------------ desktop panels ----------------------------- */

function SidePanelLeft() {
  const lang = useBooster((s) => s.settings.lang);
  const fa = lang === "fa";
  const stages = fa
    ? ["بررسی فشار حافظه", "آزادسازی و پاک‌سازی", "بررسی شبکه و DNS", "اجرای بازی", "پایش عملکرد"]
    : ["Memory pre-check", "Free & clean", "Network & DNS", "Launch game", "Live monitoring"];
  const chips = fa
    ? ["MVVM", "DataStore", "WorkManager", "DoH / DoT", "بدون روت", "فارسی / English"]
    : ["MVVM", "DataStore", "WorkManager", "DoH / DoT", "No-Root", "فارسی / English"];
  return (
    <aside className="hidden w-72 shrink-0 flex-col gap-5 xl:flex">
      <div>
        <h1 className="font-display text-3xl font-black text-gb-text text-glow-purple">GAME BOOSTER</h1>
        <p className="mt-1 text-sm text-gb-dim">{fa ? "قدرت بیشتر برای بازی‌های شما" : "More power for your games"}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {chips.map((c) => (
          <span key={c} className="rounded-full border border-gb-purple/30 bg-gb-purple/10 px-3 py-1 text-[10px] font-bold text-gb-purple">
            {c}
          </span>
        ))}
      </div>
      <div className="rounded-2xl border border-gb-border bg-gb-surface/60 p-4">
        <h3 className="mb-2 flex items-center gap-2 text-xs font-bold text-gb-text">
          <Activity className="size-3.5 text-gb-green" />
          {fa ? "جریان بهینه‌سازی (۵ مرحله)" : "Boost flow (5 stages)"}
        </h3>
        <ol className="space-y-1.5">
          {stages.map((s, i) => (
            <li key={s} className="flex items-center gap-2 text-[11px] text-gb-dim">
              <span className="grid size-4.5 place-items-center rounded-full border border-gb-green/40 text-[8px] font-black text-gb-green">{fmtInt(i + 1, lang)}</span>
              {s}
            </li>
          ))}
        </ol>
      </div>
    </aside>
  );
}

function SidePanelRight() {
  const lang = useBooster((s) => s.settings.lang);
  const fa = lang === "fa";
  const rows = fa
    ? [
        ["Jetpack Compose", "رابط کاربری (View)"],
        ["ViewModel + StateFlow", "منطق ارائه (store)"],
        ["PackageManager", "شناسایی بازی‌ها"],
        ["VpnService + DoH/DoT", "سیستم DNS"],
        ["System/Performance APIs", "حافظه، CPU، دما"],
        ["DataStore", "ذخیره تنظیمات"],
        ["WorkManager", "کارهای پس‌زمینه"],
      ]
    : [
        ["Jetpack Compose", "UI (View layer)"],
        ["ViewModel + StateFlow", "Presentation logic"],
        ["PackageManager", "Game detection"],
        ["VpnService + DoH/DoT", "DNS system"],
        ["System/Performance APIs", "RAM, CPU, thermal"],
        ["DataStore", "Settings persistence"],
        ["WorkManager", "Background jobs"],
      ];
  return (
    <aside className="hidden w-72 shrink-0 flex-col gap-5 xl:flex">
      <div className="rounded-2xl border border-gb-border bg-gb-surface/60 p-4">
        <h3 className="mb-3 text-xs font-bold text-gb-text">{fa ? "پشته اصلی اندروید ← نگاشت نمونه‌ساز" : "Android stack → prototype mapping"}</h3>
        <ul className="space-y-2.5">
          {rows.map(([a, b]) => (
            <li key={a} className="rounded-lg border border-gb-border/70 bg-gb-surface2/50 px-2.5 py-1.5">
              <div className="font-display text-[10px] font-bold text-gb-cyan" dir="ltr">
                {a}
              </div>
              <div className="text-[10px] text-gb-dim">{b}</div>
            </li>
          ))}
        </ul>
      </div>
      <p className="text-[10px] leading-relaxed text-gb-dim">
        {fa
          ? "این نسخه، نمونه‌ساز تعاملی وب از برنامه اندرویدی Game Booster است؛ سناریوها (BOOST، DNS، WorkManager) کاملاً قابل‌اجراست."
          : "This is an interactive web prototype of the Android Game Booster app; all scenarios (BOOST, DNS, WorkManager) are fully runnable."}
      </p>
    </aside>
  );
}

/* --------------------------------- app shell -------------------------------- */

export default function AppShell() {
  const lang = useBooster((s) => s.settings.lang);
  const theme = useBooster((s) => s.settings.theme);
  const tick = useBooster((s) => s.tick);
  const setBattery = useBooster((s) => s.setBattery);
  const setOnline = useBooster((s) => s.setOnline);
  const sessionActive = useBooster((s) => s.session.active);
  const boostActive = useBooster((s) => s.boost.active);

  /* hydration gate — persisted store, device detection and clock are client-only */
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  /* engine tick */
  React.useEffect(() => {
    const iv = setInterval(() => tick(), 1000);
    return () => clearInterval(iv);
  }, [tick]);

  /* html dir/lang */
  React.useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "fa" ? "rtl" : "ltr";
  }, [lang]);

  /* battery (real Battery API when available) */
  React.useEffect(() => {
    let batt: (BatteryManager & { addEventListener: (t: string, f: () => void) => void }) | null = null;
    const on = () => setBattery(batt ? Math.round(batt.level * 100) : null, batt ? batt.charging : null);
    type BatteryManager = { level: number; charging: boolean };
    const nav = navigator as Navigator & { getBattery?: () => Promise<BatteryManager & { addEventListener: (t: string, f: () => void) => void }> };
    if (nav.getBattery) {
      nav.getBattery().then((b) => {
        batt = b;
        on();
        b.addEventListener("levelchange", on);
        b.addEventListener("chargingchange", on);
      }).catch(() => setBattery(null, null));
    } else {
      setBattery(null, null);
    }
  }, [setBattery]);

  /* online/offline + network type */
  React.useEffect(() => {
    const upd = () => {
      const c = (navigator as Navigator & { connection?: { effectiveType?: string; type?: string } }).connection;
      useBooster.setState((st) => ({
        device: { ...st.device, online: navigator.onLine, networkType: c?.type === "wifi" ? "Wi-Fi" : (c?.effectiveType || "").toUpperCase() || (navigator.onLine ? "ONLINE" : "OFFLINE") },
      }));
    };
    upd();
    window.addEventListener("online", upd);
    window.addEventListener("offline", upd);
    const c = (navigator as Navigator & { connection?: EventTarget }).connection;
    c?.addEventListener?.("change", upd);
    return () => {
      window.removeEventListener("online", upd);
      window.removeEventListener("offline", upd);
      c?.removeEventListener?.("change", upd);
    };
  }, []);

  /* session end warning on unload (simulating service cleanup) */
  React.useEffect(() => {
    const onLeave = (e: BeforeUnloadEvent) => {
      if (sessionActive) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [sessionActive]);

  if (!mounted) {
    /* neon splash while the client store hydrates */
    return (
      <div className={cn("grid min-h-dvh w-full place-items-center bg-gb-bg", theme === "dark" ? "gb-dark" : "gb-light")}>
        <div className="flex flex-col items-center gap-4">
          <span className="relative grid size-20 place-items-center rounded-3xl border border-gb-green/40 bg-gb-green/10">
            <span className="absolute inset-0 rounded-3xl border border-gb-green/30 anim-pulse-ring" />
            <Rocket className="size-9 text-gb-green anim-float" />
          </span>
          <div className="font-display text-lg font-black tracking-widest text-glow-green" dir="ltr">
            GAME BOOSTER
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("min-h-dvh w-full bg-gb-bg gb-grid-bg", theme === "dark" ? "gb-dark" : "gb-light")}>
      <SonnerToaster
        position={lang === "fa" ? "top-center" : "top-center"}
        theme={theme}
        toastOptions={{
          style: {
            background: theme === "dark" ? "#11142a" : "#ffffff",
            border: "1px solid color-mix(in srgb, var(--gb-purple) 35%, transparent)",
            color: theme === "dark" ? "#eef0ff" : "#0d1030",
          },
        }}
      />
      <div className="mx-auto flex min-h-dvh max-w-[1400px] items-center justify-center gap-10 px-4 max-lg:px-0 xl:gap-14">
        <SidePanelLeft />
        {/* phone frame */}
        <div
          dir={lang === "fa" ? "rtl" : "ltr"}
          className={cn(
            "relative flex flex-col overflow-hidden bg-gb-bg text-gb-text",
            "max-lg:h-dvh max-lg:w-full",
            "lg:h-[844px] lg:w-[396px] lg:rounded-[2.6rem] lg:border-2 lg:border-gb-cyan/30 lg:shadow-[0_0_60px_color-mix(in_srgb,var(--gb-cyan)_22%,transparent),0_0_120px_color-mix(in_srgb,var(--gb-purple)_18%,transparent)]"
          )}
        >
          <StatusBar />
          <OfflineBanner />
          <main className="gb-scroll relative flex-1 overflow-y-auto overflow-x-hidden" aria-live="polite">
            <ScreenRouter />
          </main>
          <BottomNav />
          {/* in-phone overlay portal root (used by sheets inside the frame) */}
          <div id="gb-phone-overlay-root" className="pointer-events-none absolute inset-0 z-30 [&>*]:pointer-events-auto" />
          {boostActive ? <BoostOverlay /> : null}
          {sessionActive ? <SessionHud /> : null}
        </div>
        <SidePanelRight />
      </div>
    </div>
  );
}
