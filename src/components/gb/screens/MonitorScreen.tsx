"use client";

import * as React from "react";
import {
  Activity,
  AlertTriangle,
  Battery,
  BatteryCharging,
  Check,
  Gauge,
  Globe,
  History,
  Lightbulb,
  MemoryStick,
  Signal,
  Thermometer,
  Timer,
  Wifi,
} from "lucide-react";
import { useBooster } from "@/lib/gb/store";
import { GAMES } from "@/lib/gb/model/games";
import { DNS_SERVERS } from "@/lib/gb/model/dns-servers";
import { thermalState } from "@/lib/gb/model/simulator";
import { useFrameMonitor } from "@/lib/gb/viewmodel/useFrameMonitor";
import { fmtBytesMB, fmtInt, fmtOne } from "@/lib/gb/format";
import {
  Callout,
  Chip,
  GaugeRing,
  LiveBadge,
  MultiChart,
  NeonButton,
  NeonCard,
  ProgressBar,
  ScreenHeader,
  SectionTitle,
  SegTabs,
  Sparkline,
  StatTile,
  StatusDot,
  TimeBadge,
  type GbColor,
} from "../ui";
import type {
  BoostResult,
  DnsSummaryData,
  HistoryEntry,
  Lang,
  NetQuality,
  NetSummaryData,
  SessionSummaryData,
} from "@/lib/gb/types";

/* ------------------------------- i18n strings ------------------------------ */

const S = {
  fa: {
    title: "پایش عملکرد",
    tabCpu: "CPU",
    tabRam: "RAM",
    tabTemp: "دما",
    tabBattery: "باتری",
    tabNetwork: "شبکه",
    waitData: "در حال جمع‌آوری داده…",
    ramOf: (total: string) => `از ${total} گیگ`,
    avg30: "میانگین ۳۰ ثانیه",
    status: "وضعیت",
    statusGood: "خوب",
    statusHigh: "بالا",
    free: "آزاد",
    used: "مصرف",
    thermal: "وضعیت حرارتی",
    thNormal: "عادی",
    thWarm: "گرم",
    thHot: "داغ",
    usual: "معمول",
    usualVal: "۲۸–۴۳°C",
    chartTitle: "نمودار عملکرد",
    chartSub: "CPU · RAM · دما",
    updateNote: "به‌روزرسانی هر ثانیه",
    charging: "شارژ",
    plugged: "وصل است",
    unplugged: "جدا",
    batteryOk: "وضعیت باتری مناسب است",
    chargingHot: "شارژ هم‌زمان با بازی دما را بالا می‌برد",
    noBatteryApi: "باتری API در این مرورگر در دسترس نیست (در اندروید از BatteryManager استفاده می‌شود)",
    sim: "شبیه‌سازی",
    netTest: "تست کامل شبکه",
    ping: "پینگ",
    jitter: "جیتر",
    loss: "افت بسته",
    score: "امتیاز",
    connType: "نوع اتصال",
    online: "آنلاین",
    offline: "آفلاین",
    suggTitle: "پیشنهادهای بهبود شبکه",
    suggPing: "برای پینگ بهتر به مودم نزدیک‌تر شوید یا به Wi-Fi تغییر دهید",
    suggJitter: "از کابل شبکه یا باند 5GHz استفاده کنید",
    suggLoss: "بسته‌ها گم می‌شوند؛ مودم و کابل‌ها را بررسی کنید",
    suggDns: "اتصال به DNS سریع‌تر با DNS Changer",
    goDns: "DNS Changer",
    suggGood: "اتصال شما برای بازی مناسب است",
    netNote: "اندازه‌گیری واقعی RTT به سرور اپلیکیشن؛ در اندروید: ICMP + NetworkCapabilities",
    histTitle: "تاریخچه تست‌ها",
    histEmpty: "هنوز موردی ثبت نشده است",
    kBoost: "بهینه‌سازی",
    kNet: "شبکه",
    kDns: "DNS",
    kSession: "جلسه بازی",
    real: "واقعی",
    est: "تخمینی",
    histBoost: (game: string, freed: string) => `${game} · ${freed} آزاد شد`,
    histNet: (ping: string, jitter: string, loss: string) => `پینگ ${ping} · جیتر ${jitter} · افت ${loss}٪`,
    histDns: (name: string, ms: string) => `${name} · ${ms}`,
    histSession: (game: string, fps: string, drops: string) => `${game} · میانگین FPS ${fps} · افت فریم ${drops}`,
    qExcellent: "عالی",
    qGood: "خوب",
    qFair: "متوسط",
    qPoor: "ضعیف",
    qUnknown: "نامشخص",
  },
  en: {
    title: "Performance Monitor",
    tabCpu: "CPU",
    tabRam: "RAM",
    tabTemp: "Temp",
    tabBattery: "Battery",
    tabNetwork: "Network",
    waitData: "Collecting data…",
    ramOf: (total: string) => `of ${total} GB`,
    avg30: "30s average",
    status: "Status",
    statusGood: "Good",
    statusHigh: "High",
    free: "Free",
    used: "Used",
    thermal: "Thermal state",
    thNormal: "Normal",
    thWarm: "Warm",
    thHot: "Hot",
    usual: "Typical",
    usualVal: "28–43°C",
    chartTitle: "Performance chart",
    chartSub: "CPU · RAM · Temp",
    updateNote: "Updates every second",
    charging: "Charging",
    plugged: "Plugged in",
    unplugged: "On battery",
    batteryOk: "Battery status is good",
    chargingHot: "Charging while gaming raises the temperature",
    noBatteryApi: "Battery API is not available in this browser (Android uses BatteryManager)",
    sim: "Simulated",
    netTest: "Full network test",
    ping: "Ping",
    jitter: "Jitter",
    loss: "Packet loss",
    score: "Score",
    connType: "Connection",
    online: "Online",
    offline: "Offline",
    suggTitle: "Network improvement tips",
    suggPing: "Move closer to the modem or switch to Wi-Fi for better ping",
    suggJitter: "Use a network cable or the 5GHz band",
    suggLoss: "Packets are being lost — check your modem and cables",
    suggDns: "Connect to a faster DNS with DNS Changer",
    goDns: "DNS Changer",
    suggGood: "Your connection is good for gaming",
    netNote: "Real RTT measured to the app server; on Android: ICMP + NetworkCapabilities",
    histTitle: "Test history",
    histEmpty: "Nothing recorded yet",
    kBoost: "Boost",
    kNet: "Network",
    kDns: "DNS",
    kSession: "Game session",
    real: "Real",
    est: "Estimated",
    histBoost: (game: string, freed: string) => `${game} · ${freed} freed`,
    histNet: (ping: string, jitter: string, loss: string) => `ping ${ping} · jitter ${jitter} · loss ${loss}%`,
    histDns: (name: string, ms: string) => `${name} · ${ms}`,
    histSession: (game: string, fps: string, drops: string) => `${game} · avg FPS ${fps} · drops ${drops}`,
    qExcellent: "Excellent",
    qGood: "Good",
    qFair: "Fair",
    qPoor: "Poor",
    qUnknown: "Unknown",
  },
};

type Strings = typeof S.fa;

/* --------------------------------- helpers --------------------------------- */

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

const KIND_COLOR: Record<HistoryEntry["kind"], GbColor> = {
  boost: "green",
  network: "cyan",
  dns: "purple",
  session: "amber",
};

function qualityLabel(q: NetQuality, t: Strings): string {
  switch (q) {
    case "excellent":
      return t.qExcellent;
    case "good":
      return t.qGood;
    case "fair":
      return t.qFair;
    case "poor":
      return t.qPoor;
    default:
      return t.qUnknown;
  }
}

function qualityColor(q: NetQuality): GbColor {
  switch (q) {
    case "excellent":
    case "good":
      return "green";
    case "fair":
      return "amber";
    case "poor":
      return "red";
    default:
      return "amber";
  }
}

function histSummary(entry: HistoryEntry, lang: Lang, t: Strings): string {
  switch (entry.kind) {
    case "boost": {
      const d = entry.data as BoostResult;
      const game = GAMES.find((g) => g.id === d.gameId);
      return t.histBoost(game ? game.name : d.gameId, fmtBytesMB(d.freedMB, lang));
    }
    case "network": {
      const d = entry.data as NetSummaryData;
      return t.histNet(`${fmtInt(d.ping, lang)} ms`, `${fmtInt(d.jitter, lang)} ms`, fmtInt(d.loss, lang));
    }
    case "dns": {
      const d = entry.data as DnsSummaryData;
      const srv = DNS_SERVERS.find((s) => s.id === d.serverId);
      const name = srv ? (lang === "fa" ? srv.name : srv.nameEn) : d.serverId;
      return t.histDns(name, d.ms !== null ? `${fmtInt(d.ms, lang)} ms` : "--");
    }
    case "session": {
      const d = entry.data as SessionSummaryData;
      const game = GAMES.find((g) => g.id === d.gameId);
      return t.histSession(game ? game.name : d.gameId, fmtInt(d.avgFps, lang), fmtInt(d.drops, lang));
    }
  }
}

function HistoryRow({ entry, lang, t }: { entry: HistoryEntry; lang: Lang; t: Strings }) {
  const label =
    entry.kind === "boost" ? t.kBoost : entry.kind === "network" ? t.kNet : entry.kind === "dns" ? t.kDns : t.kSession;
  const dnsData = entry.kind === "dns" ? (entry.data as DnsSummaryData) : null;
  return (
    <li className="anim-fade-up flex items-center gap-2 rounded-lg bg-gb-surface2/60 px-2.5 py-2 text-[11px]">
      <Chip color={KIND_COLOR[entry.kind]} className="shrink-0">
        {label}
      </Chip>
      <span className="min-w-0 flex-1 truncate text-gb-text/90">{histSummary(entry, lang, t)}</span>
      {dnsData ? (
        <Chip color={dnsData.source === "real" ? "green" : "amber"} className="shrink-0">
          {dnsData.source === "real" ? t.real : t.est}
        </Chip>
      ) : null}
      <TimeBadge at={entry.at} />
    </li>
  );
}

/* ================================== screen ================================= */

export default function MonitorScreen() {
  const lang = useBooster((s) => s.settings.lang);
  const t = S[lang];
  const goBack = useBooster((s) => s.goBack);
  const navigate = useBooster((s) => s.navigate);
  const perf = useBooster((s) => s.perf);
  const fps = useBooster((s) => s.fps);
  const device = useBooster((s) => s.device);
  const netDiag = useBooster((s) => s.netDiag);
  const dns = useBooster((s) => s.dns);
  const history = useBooster((s) => s.history);
  const runNetDiag = useBooster((s) => s.runNetDiag);

  useFrameMonitor(true);

  const [tab, setTab] = React.useState<string>("cpu");

  /* ---- derived metric data ---- */
  const pts = perf.points;
  const cpuSeries = pts.map((p) => p.cpu);
  const ramSeries = pts.map((p) => p.ram);
  const tempSeries = pts.map((p) => p.temp);

  const ramRatio = clamp01(perf.ramTotalGB > 0 ? perf.ramUsedGB / perf.ramTotalGB : 0);
  const freeGB = Math.max(0, perf.ramTotalGB - perf.ramUsedGB);
  const thermal = thermalState(perf.temp);
  const thColor: GbColor = thermal === "hot" ? "red" : thermal === "warm" ? "amber" : "green";
  const thLabel = thermal === "hot" ? t.thHot : thermal === "warm" ? t.thWarm : t.thNormal;

  const last30 = pts.slice(-30);
  const cpuAvg = last30.length > 0 ? last30.reduce((a, p) => a + p.cpu, 0) / last30.length : perf.cpu;

  const metricTab = tab === "cpu" || tab === "ram" || tab === "temp";

  const gaugeValue = tab === "cpu" ? perf.cpu / 100 : tab === "ram" ? ramRatio : clamp01((perf.temp - 28) / 24);
  const gaugeLabel =
    tab === "cpu" ? `${fmtInt(perf.cpu, lang)}٪` : tab === "ram" ? `${fmtOne(perf.ramUsedGB, lang)}GB` : `${fmtOne(perf.temp, lang)}°C`;
  const gaugeSub = tab === "ram" ? t.ramOf(fmtOne(perf.ramTotalGB, lang)) : tab === "temp" ? thLabel : undefined;
  const gaugeColor: GbColor =
    tab === "cpu" ? "cyan" : tab === "ram" ? (ramRatio > 0.85 ? "red" : "purple") : thColor;
  const sparkData = tab === "cpu" ? cpuSeries : tab === "ram" ? ramSeries : tempSeries;

  /* ---- network tab derived ---- */
  const pingVal = netDiag.ping;
  const jitVal = netDiag.jitter;
  const pingColor: GbColor =
    pingVal === null ? "cyan" : pingVal <= 60 ? "green" : pingVal <= 100 ? "amber" : "red";
  const jitColor: GbColor =
    jitVal === null ? "cyan" : jitVal <= 10 ? "green" : jitVal <= 20 ? "amber" : "red";
  const lossColor: GbColor = netDiag.loss === 0 ? "green" : netDiag.loss <= 5 ? "amber" : "red";

  const sugg: React.ReactNode[] = [];
  if ((pingVal ?? 0) > 90) {
    sugg.push(
      <Callout key="s-ping" color="amber" icon={<Wifi className="mt-0.5 size-4 shrink-0" />}>
        {t.suggPing}
      </Callout>
    );
  }
  if ((jitVal ?? 0) > 15) {
    sugg.push(
      <Callout key="s-jitter" color="amber" icon={<Activity className="mt-0.5 size-4 shrink-0" />}>
        {t.suggJitter}
      </Callout>
    );
  }
  if (netDiag.loss > 0) {
    sugg.push(
      <Callout key="s-loss" color="red" icon={<AlertTriangle className="mt-0.5 size-4 shrink-0" />}>
        {t.suggLoss}
      </Callout>
    );
  }
  if (!dns.connected) {
    sugg.push(
      <Callout key="s-dns" color="purple" icon={<Globe className="mt-0.5 size-4 shrink-0" />}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span>{t.suggDns}</span>
          <NeonButton size="sm" color="purple" variant="outline" onClick={() => navigate("dns")}>
            {t.goDns}
          </NeonButton>
        </div>
      </Callout>
    );
  }
  if (pingVal !== null && pingVal <= 90 && (jitVal ?? 0) <= 15 && netDiag.loss === 0) {
    sugg.push(
      <Callout key="s-ok" color="green" icon={<Check className="mt-0.5 size-4 shrink-0" />}>
        {t.suggGood}
      </Callout>
    );
  }

  const tabs = [
    { id: "cpu", label: t.tabCpu },
    { id: "ram", label: t.tabRam },
    { id: "temp", label: t.tabTemp },
    { id: "battery", label: t.tabBattery },
    { id: "network", label: t.tabNetwork },
  ];

  const batteryLevel = device.batteryLevel ?? 0;
  const charging = device.batteryCharging === true;
  const batteryColor: GbColor = batteryLevel < 20 ? "red" : batteryLevel < 50 ? "amber" : "green";

  return (
    <div>
      <ScreenHeader
        title={t.title}
        onBack={goBack}
        action={<LiveBadge label={fps !== null ? `FPS ${fmtInt(fps, lang)}` : "FPS --"} />}
      />

      <div className="space-y-4 px-4 pb-6 pt-4">
        {/* metric tabs */}
        <SegTabs items={tabs} value={tab} onChange={setTab} />

        {/* ------------------------- CPU / RAM / temp tab ------------------------- */}
        {metricTab ? (
          <>
            <NeonCard className="p-4">
              <div className="grid place-items-center py-1">
                <GaugeRing value={gaugeValue} label={gaugeLabel} sub={gaugeSub} color={gaugeColor} size={150} />
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3">
                {tab === "cpu" ? (
                  <>
                    <StatTile
                      icon={<Timer className="size-4" />}
                      title={t.avg30}
                      value={`${fmtInt(cpuAvg, lang)}٪`}
                      color="cyan"
                    />
                    <StatTile
                      icon={<Activity className="size-4" />}
                      title={t.status}
                      value={<Chip color={cpuAvg > 70 ? "red" : "green"}>{cpuAvg > 70 ? t.statusHigh : t.statusGood}</Chip>}
                      color={cpuAvg > 70 ? "red" : "green"}
                    />
                  </>
                ) : tab === "ram" ? (
                  <>
                    <StatTile
                      icon={<Check className="size-4" />}
                      title={t.free}
                      value={`${fmtOne(freeGB, lang)} GB`}
                      sub={`${fmtInt((1 - ramRatio) * 100, lang)}٪`}
                      color="green"
                    />
                    <StatTile
                      icon={<MemoryStick className="size-4" />}
                      title={t.used}
                      value={`${fmtOne(perf.ramUsedGB, lang)} GB`}
                      sub={`${fmtInt(ramRatio * 100, lang)}٪`}
                      color={ramRatio > 0.85 ? "red" : "cyan"}
                    />
                  </>
                ) : (
                  <>
                    <StatTile
                      icon={<Thermometer className="size-4" />}
                      title={t.thermal}
                      value={<Chip color={thColor}>{thLabel}</Chip>}
                      color={thColor}
                    />
                    <StatTile icon={<Gauge className="size-4" />} title={t.usual} value={t.usualVal} color="cyan" />
                  </>
                )}
              </div>

              <div className="mt-3">
                {pts.length >= 2 ? (
                  <Sparkline data={sparkData} color={gaugeColor} height={56} />
                ) : (
                  <div className="grid h-14 place-items-center rounded-xl border border-dashed border-gb-border text-[10px] text-gb-dim">
                    {t.waitData}
                  </div>
                )}
              </div>
            </NeonCard>

            {/* combined chart */}
            <NeonCard className="p-4">
              <SectionTitle icon={<Activity className="size-4" />} title={t.chartTitle} sub={t.chartSub} />
              <div className="mt-3">
                <MultiChart
                  series={[
                    { data: cpuSeries, color: "cyan", label: "CPU" },
                    { data: ramSeries, color: "green", label: "RAM" },
                    { data: tempSeries, color: "pink", label: t.tabTemp },
                  ]}
                  height={130}
                />
              </div>
              <p className="mt-2 text-[9px] text-gb-dim">{t.updateNote}</p>
            </NeonCard>
          </>
        ) : null}

        {/* ------------------------------ battery tab ----------------------------- */}
        {tab === "battery" ? (
          <NeonCard className="p-4">
            {device.batterySupported ? (
              <div className="space-y-3">
                <div className="grid place-items-center py-1">
                  <GaugeRing
                    value={clamp01(batteryLevel / 100)}
                    label={`${fmtInt(batteryLevel, lang)}٪`}
                    sub={charging ? t.plugged : t.unplugged}
                    color={batteryColor}
                    size={140}
                  />
                </div>
                <StatTile
                  icon={charging ? <BatteryCharging className="size-4" /> : <Battery className="size-4" />}
                  title={t.charging}
                  value={charging ? t.plugged : t.unplugged}
                  color={charging ? "green" : "amber"}
                />
                {charging && perf.temp > 38 ? (
                  <Callout color="amber" icon={<AlertTriangle className="mt-0.5 size-4 shrink-0" />}>
                    {t.chargingHot}
                  </Callout>
                ) : (
                  <Callout color="green" icon={<Check className="mt-0.5 size-4 shrink-0" />}>
                    {t.batteryOk}
                  </Callout>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <Callout color="amber" icon={<Battery className="mt-0.5 size-4 shrink-0" />}>
                  {t.noBatteryApi}
                </Callout>
                <div className="grid place-items-center py-1">
                  <GaugeRing value={0.82} label={`${fmtInt(82, lang)}٪`} sub={t.sim} color="purple" size={140} />
                </div>
              </div>
            )}
          </NeonCard>
        ) : null}

        {/* ------------------------------ network tab ----------------------------- */}
        {tab === "network" ? (
          <NeonCard className="p-4">
            <div className="space-y-3">
              <NeonButton color="green" size="lg" className="w-full" loading={netDiag.running} onClick={() => void runNetDiag()}>
                <Signal className="size-4" />
                {t.netTest}
              </NeonButton>

              <div className="grid grid-cols-3 gap-2.5">
                <StatTile
                  className="p-3"
                  title={t.ping}
                  value={pingVal !== null ? `${fmtInt(pingVal, lang)} ms` : "--"}
                  color={pingColor}
                />
                <StatTile
                  className="p-3"
                  title={t.jitter}
                  value={jitVal !== null ? `${fmtInt(jitVal, lang)} ms` : "--"}
                  color={jitColor}
                />
                <StatTile className="p-3" title={t.loss} value={`${fmtInt(netDiag.loss, lang)}٪`} color={lossColor} />
              </div>

              {netDiag.samples.length >= 2 ? (
                <Sparkline data={netDiag.samples} color="cyan" height={48} />
              ) : (
                <div className="grid h-12 place-items-center rounded-xl border border-dashed border-gb-border text-[10px] text-gb-dim">
                  {t.waitData}
                </div>
              )}

              <div className="space-y-2 rounded-xl border border-gb-border bg-gb-surface2/50 p-3">
                <div className="flex items-center justify-between gap-2">
                  <Chip color={qualityColor(netDiag.quality)} dot>
                    {qualityLabel(netDiag.quality, t)}
                  </Chip>
                  <span className="text-[11px] text-gb-dim">
                    {t.score}: <b className="text-gb-text">{fmtInt(netDiag.score, lang)} / {fmtInt(100, lang)}</b>
                  </span>
                </div>
                <ProgressBar value={clamp01(netDiag.score / 100)} color={qualityColor(netDiag.quality)} />
              </div>

              <div className="flex items-center justify-between rounded-xl border border-gb-border bg-gb-surface2/50 px-3 py-2.5 text-[11px]">
                <span className="flex min-w-0 items-center gap-1.5 text-gb-dim">
                  <Wifi className="size-3.5 shrink-0 text-gb-cyan" />
                  <span className="truncate">
                    {t.connType}: <b className="text-gb-text">{device.networkType}</b>
                  </span>
                </span>
                <span className={`flex shrink-0 items-center gap-1.5 font-bold ${device.online ? "text-gb-green" : "text-gb-red"}`}>
                  <StatusDot color={device.online ? "green" : "red"} />
                  {device.online ? t.online : t.offline}
                </span>
              </div>

              {sugg.length > 0 ? (
                <div className="space-y-2 pt-1">
                  <SectionTitle icon={<Lightbulb className="size-4" />} title={t.suggTitle} />
                  <div className="space-y-2">{sugg}</div>
                </div>
              ) : null}

              <p className="text-[9px] leading-relaxed text-gb-dim">{t.netNote}</p>
            </div>
          </NeonCard>
        ) : null}

        {/* ------------------------------ history card ---------------------------- */}
        <NeonCard className="p-4">
          <SectionTitle icon={<History className="size-4" />} title={t.histTitle} />
          {history.length === 0 ? (
            <p className="py-6 text-center text-[11px] text-gb-dim">{t.histEmpty}</p>
          ) : (
            <ul className="gb-scroll mt-3 max-h-56 space-y-1.5 overflow-y-auto pe-1">
              {history.map((e) => (
                <HistoryRow key={e.id} entry={e} lang={lang} t={t} />
              ))}
            </ul>
          )}
        </NeonCard>
      </div>
    </div>
  );
}
