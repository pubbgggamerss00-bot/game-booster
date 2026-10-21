"use client";

import * as React from "react";
import Image from "next/image";
import {
  Activity,
  ChevronLeft,
  Cpu,
  Gauge,
  Gamepad2,
  Globe,
  Lightbulb,
  MemoryStick,
  Rocket,
  Server,
  Smartphone,
  Thermometer,
  Timer,
  Wifi,
  Zap,
} from "lucide-react";
import { useBooster } from "@/lib/gb/store";
import { GAMES } from "@/lib/gb/model/games";
import { fmtInt, fmtOne, fmtTime } from "@/lib/gb/format";
import { thermalState } from "@/lib/gb/model/simulator";
import { Chip, COLOR_TEXT, GameIcon, LiveBadge, NeonCard, NeonButton, SectionTitle, StatusDot, StatTile, TileButton, Callout } from "../ui";

const S = {
  fa: {
    tagline: "قدرت بیشتر برای بازی‌های شما",
    boost: "بهینه‌سازی",
    boostSub: "BOOST & PLAY",
    selectedGame: "بازی انتخاب‌شده",
    noGame: "بازی انتخاب نشده است",
    choose: "انتخاب بازی",
    change: "تغییر",
    ram: "رم",
    cpu: "پردازنده",
    temp: "دما",
    ping: "پینگ",
    ramSub: (used: string, total: string, free: string) => `${used} از ${total} گیگ · آزاد ${free} گیگ`,
    tempNote: "در صورت پشتیبانی",
    dns: "وضعیت DNS",
    dnsOn: (s: string) => `متصل: ${s}`,
    dnsOff: "قطع",
    boosterStatus: "Game Booster",
    netQ: "کیفیت شبکه",
    lastResult: "نتیجه آخرین بهینه‌سازی",
    noResult: "هنوز بهینه‌سازی انجام نشده است",
    noResultSub: "دکمه BOOST را بزنید تا شروع شود",
    freed: "حافظه آزادشده",
    atTime: "ساعت",
    monitor: "پایش عملکرد",
    monitorSub: "CPU، RAM، دما و باتری",
    dnsTool: "DNS Changer",
    dnsToolSub: "DoH / DoT + تست سرعت",
    ramTool: "مدیریت هوشمند RAM",
    ramToolSub: "فشار حافظه و کش",
    work: "کارهای پس‌زمینه",
    workSub: "WorkManager",
    device: "دستگاه و برنامه",
    deviceSub: "مشخصات و مجوزها",
    settingsTile: "تنظیمات",
    settingsTileSub: "DataStore و زبان",
    tipGood: "عملکرد دستگاه شما در وضعیت خوبی قرار دارد.",
    tipWarm: "دما رو به افزایش است؛ برای جلوگیری از افت فریم، از شارژ پرقدرت هنگام بازی خودداری کنید.",
    tipRam: "حافظه در دسترس کم است؛ پیش از اجرای بازی بهینه‌سازی انجام دهید.",
    inGame: "جلسه بازی فعال است",
    live: "زنده",
    sim: "شبیه‌سازی",
    needGame: "ابتدا یک بازی انتخاب کنید",
    boostNow: "شروع بهینه‌سازی",
    sessionRunning: "جلسه پایش در حال اجراست — برای مشاهده HUD به صفحه اصلی برگردید",
  },
  en: {
    tagline: "More power for your games",
    boost: "Optimize",
    boostSub: "BOOST & PLAY",
    selectedGame: "Selected game",
    noGame: "No game selected",
    choose: "Choose game",
    change: "Change",
    ram: "RAM",
    cpu: "CPU",
    temp: "Temp",
    ping: "Ping",
    ramSub: (used: string, total: string, free: string) => `${used} / ${total} GB · free ${free} GB`,
    tempNote: "if supported",
    dns: "DNS status",
    dnsOn: (s: string) => `Connected: ${s}`,
    dnsOff: "Disconnected",
    boosterStatus: "Game Booster",
    netQ: "Network quality",
    lastResult: "Last optimization result",
    noResult: "No optimization yet",
    noResultSub: "Press BOOST to start",
    freed: "Memory freed",
    atTime: "at",
    monitor: "Performance",
    monitorSub: "CPU, RAM, temp & battery",
    dnsTool: "DNS Changer",
    dnsToolSub: "DoH / DoT + speed test",
    ramTool: "Smart RAM Manager",
    ramToolSub: "Memory pressure & cache",
    work: "Background tasks",
    workSub: "WorkManager",
    device: "Device & app",
    deviceSub: "Specs & permissions",
    settingsTile: "Settings",
    settingsTileSub: "DataStore & language",
    tipGood: "Your device is performing well.",
    tipWarm: "Temperature rising — avoid heavy charging while gaming to prevent frame drops.",
    tipRam: "Low available memory — optimize before launching the game.",
    inGame: "Gaming session active",
    live: "Live",
    sim: "Simulated",
    needGame: "Select a game first",
    boostNow: "Start boost",
    sessionRunning: "Monitoring session active — return home to see the HUD",
  },
};

export default function HomeScreen() {
  const lang = useBooster((s) => s.settings.lang);
  const t = S[lang];
  const perf = useBooster((s) => s.perf);
  const dns = useBooster((s) => s.dns);
  const lastFreed = useBooster((s) => s.lastFreedMB);
  const lastAt = useBooster((s) => s.lastBoostAt);
  const netDiag = useBooster((s) => s.netDiag);
  const sessionActive = useBooster((s) => s.session.active);
  const selectedGameId = useBooster((s) => s.selectedGameId);
  const startBoost = useBooster((s) => s.startBoost);
  const navigate = useBooster((s) => s.navigate);

  const game = GAMES.find((g) => g.id === selectedGameId) ?? null;
  const ramPct = perf.ramUsedGB / perf.ramTotalGB;
  const freeGB = Math.max(0, perf.ramTotalGB - perf.ramUsedGB);
  const thermal = thermalState(perf.temp);
  const ping = netDiag.ping ?? null;

  const onBoost = () => {
    if (!game) {
      navigate("library");
      return;
    }
    void startBoost(game.id);
  };

  return (
    <div className="space-y-4 px-4 pb-6 pt-4">
      {/* header */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl border border-gb-purple/40 bg-gb-purple/15 glow-purple">
            <Gamepad2 className="size-4.5 text-gb-purple" />
          </span>
          <div>
            <div className="font-display text-sm font-black text-gb-text" dir="ltr">
              Game Booster
            </div>
            <div className="text-[10px] text-gb-dim">{t.tagline}</div>
          </div>
        </div>
        <button
          onClick={() => navigate("settings")}
          aria-label={t.settingsTile}
          className="grid size-9 place-items-center rounded-xl border border-gb-border bg-gb-surface text-gb-dim transition hover:text-gb-cyan"
        >
          <Gauge className="size-4" />
        </button>
      </header>

      {/* hero */}
      <NeonCard glow="purple" className="relative overflow-hidden p-0">
        <div className="relative h-36 w-full">
          <Image src="/gb-hero.png" alt="Game Booster neon logo" fill className="object-cover opacity-80" priority sizes="400px" />
          <div className="absolute inset-0 bg-gradient-to-t from-gb-bg via-gb-bg/30 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-4 text-center">
            <div className="font-display text-xl font-black tracking-wider text-glow-purple" dir="ltr">
              GAME <span className="text-gb-purple">BOOSTER</span>
            </div>
            <div className="text-[11px] text-gb-dim">{t.tagline}</div>
          </div>
        </div>
      </NeonCard>

      {/* selected game */}
      <NeonCard className="p-3.5" onClick={() => navigate("library")}>
        <div className="flex items-center gap-3">
          {game ? (
            <>
              <GameIcon game={game} size={46} />
              <div className="min-w-0 flex-1">
                <div className="text-[10px] text-gb-dim">{t.selectedGame}</div>
                <div className="truncate text-sm font-black text-gb-text">{game.name}</div>
                <div className="mt-1 flex gap-1.5">
                  <Chip color="green">{t.selectedGame}</Chip>
                  {sessionActive ? <Chip color="purple" dot>{t.inGame}</Chip> : null}
                </div>
              </div>
              <span className="flex items-center gap-1 text-[10px] font-bold text-gb-cyan">
                {t.change}
                <ChevronLeft className="size-3.5 rtl:rotate-0 ltr:rotate-180" />
              </span>
            </>
          ) : (
            <>
              <span className="grid size-11 place-items-center rounded-xl border border-dashed border-gb-border text-gb-dim">
                <Gamepad2 className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold text-gb-text">{t.noGame}</div>
                <div className="text-[10px] text-gb-dim">{t.choose}</div>
              </div>
              <NeonButton size="sm" color="cyan" variant="outline">
                {t.choose}
              </NeonButton>
            </>
          )}
        </div>
      </NeonCard>

      {/* boost ring */}
      <div className="relative grid place-items-center py-2">
        <span className="absolute size-44 rounded-full border border-gb-green/30 anim-pulse-ring" />
        <span className="absolute size-44 rounded-full border border-gb-green/20 anim-pulse-ring" style={{ animationDelay: "0.7s" }} />
        <span className="absolute size-44 rounded-full border border-gb-green/10 anim-pulse-ring" style={{ animationDelay: "1.4s" }} />
        <button
          onClick={onBoost}
          aria-label={t.boost}
          className="group relative grid size-40 place-items-center rounded-full border-2 border-gb-green/60 bg-gradient-to-b from-gb-surface2 to-gb-surface transition-transform duration-200 active:scale-95 glow-green"
        >
          <span className="absolute inset-2 rounded-full border border-gb-green/20" />
          <span className="flex flex-col items-center gap-1.5">
            <Rocket className="size-9 text-gb-green transition-transform duration-300 group-hover:-translate-y-1" />
            <span className="text-base font-black text-glow-green">{t.boost}</span>
            <span className="font-display text-[9px] tracking-[0.2em] text-gb-dim" dir="ltr">
              {t.boostSub}
            </span>
          </span>
        </button>
      </div>

      {/* status tiles */}
      <div className="grid grid-cols-2 gap-3">
        <StatTile
          icon={<MemoryStick className="size-4" />}
          title={t.ram}
          value={`${fmtOne(perf.ramUsedGB, lang)} / ${fmtOne(perf.ramTotalGB, lang)} GB`}
          sub={t.ramSub(fmtInt(ramPct * 100, lang), "", fmtOne(freeGB, lang))}
          color={ramPct > 0.85 ? "red" : ramPct > 0.7 ? "amber" : "green"}
        />
        <StatTile
          icon={<Cpu className="size-4" />}
          title={t.cpu}
          value={`${fmtInt(perf.cpu, lang)}٪`}
          sub={<LiveBadge label={t.sim} />}
          color={perf.cpu > 75 ? "red" : "cyan"}
        />
        <StatTile
          icon={<Thermometer className="size-4" />}
          title={t.temp}
          value={`${fmtOne(perf.temp, lang)}°C`}
          sub={t.tempNote}
          color={thermal === "hot" ? "red" : thermal === "warm" ? "amber" : "green"}
        />
        <StatTile
          icon={<Wifi className="size-4" />}
          title={t.ping}
          value={ping !== null ? `${fmtInt(ping, lang)} ms` : "—"}
          sub={t.netQ}
          color={ping === null ? "amber" : ping < 45 ? "green" : ping < 90 ? "amber" : "red"}
          onClick={() => navigate("monitor")}
        />
      </div>

      {/* dns + booster status */}
      <NeonCard className="space-y-2.5 p-3.5">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-[11px] font-bold text-gb-dim">
            <Server className="size-3.5 text-gb-cyan" />
            {t.dns}
          </span>
          {dns.connected ? (
            <Chip color="green" dot>
              {t.dnsOn(dns.serverLabel ?? "DoH")}
            </Chip>
          ) : (
            <Chip color="amber">{t.dnsOff}</Chip>
          )}
        </div>
        <div className="flex items-center justify-between border-t border-gb-border/60 pt-2.5">
          <span className="flex items-center gap-2 text-[11px] font-bold text-gb-dim">
            <Zap className="size-3.5 text-gb-purple" />
            {t.boosterStatus}
          </span>
          <Chip color="green" dot>
            {lang === "fa" ? "فعال" : "Active"}
          </Chip>
        </div>
        {sessionActive ? (
          <div className="flex items-center justify-between border-t border-gb-border/60 pt-2.5">
            <span className="flex items-center gap-2 text-[11px] font-bold text-gb-dim">
              <Activity className="size-3.5 text-gb-green" />
              {t.inGame}
            </span>
            <LiveBadge label={t.live} />
          </div>
        ) : null}
      </NeonCard>

      {/* last optimization result */}
      <NeonCard className="p-3.5">
        <SectionTitle icon={<Timer className="size-4" />} title={t.lastResult} />
        {lastFreed !== null && lastAt !== null ? (
          <div className="mt-3 flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-xl border border-gb-green/40 bg-gb-green/10 glow-green">
              <MemoryStick className="size-5 text-gb-green" />
            </span>
            <div className="flex-1">
              <div className="text-sm font-black text-gb-green text-glow-green">
                +{fmtInt(lastFreed, lang)} MB {t.freed}
              </div>
              <div className="text-[10px] text-gb-dim">
                {t.atTime} {fmtTime(lastAt, lang)}
              </div>
            </div>
            <Chip color="green">✓</Chip>
          </div>
        ) : (
          <p className="mt-2 text-center text-[11px] text-gb-dim">
            {t.noResult}
            <br />
            <span className="text-[10px]">{t.noResultSub}</span>
          </p>
        )}
      </NeonCard>

      {/* quick tiles */}
      <div className="grid grid-cols-2 gap-3">
        <TileButton icon={<Activity className="size-5" />} title={t.monitor} sub={t.monitorSub} color="green" onClick={() => navigate("monitor")} />
        <TileButton icon={<Globe className="size-5" />} title={t.dnsTool} sub={t.dnsToolSub} color="cyan" onClick={() => navigate("dns")} />
        <TileButton icon={<MemoryStick className="size-5" />} title={t.ramTool} sub={t.ramToolSub} color="purple" onClick={() => navigate("ram")} />
        <TileButton icon={<Timer className="size-5" />} title={t.work} sub={t.workSub} color="amber" onClick={() => navigate("work")} />
        <TileButton icon={<Smartphone className="size-5" />} title={t.device} sub={t.deviceSub} color="pink" onClick={() => navigate("device")} />
        <TileButton icon={<Gauge className="size-5" />} title={t.settingsTile} sub={t.settingsTileSub} color="cyan" onClick={() => navigate("settings")} />
      </div>

      {/* tip */}
      <Callout icon={<Lightbulb className="mt-0.5 size-4 shrink-0" />} color={thermal === "hot" ? "red" : ramPct > 0.85 ? "amber" : "green"}>
        {thermal === "hot" || thermal === "warm" ? t.tipWarm : ramPct > 0.85 ? t.tipRam : t.tipGood}
      </Callout>
    </div>
  );
}
