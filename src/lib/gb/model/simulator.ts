import type { MetricPoint, RamHog, CleanableItem } from "../types";

/**
 * Performance simulation engine (Android Performance APIs stand-in).
 * CPU / temperature are NOT exposed by browsers → simulated with realistic
 * random-walk dynamics. RAM total is approximated via navigator.deviceMemory.
 * Everything is deterministic-ish, smooth and reacts to app state (session, boost).
 */

export interface SimInput {
  cpu: number;
  ramUsedGB: number;
  ramTotalGB: number;
  temp: number;
  sessionActive: boolean;
  gaming: boolean; // high demand phase
}

export interface SimOutput {
  cpu: number;
  ramUsedGB: number;
  temp: number;
  point: MetricPoint;
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export function stepSim(prev: SimInput): SimOutput {
  // --- CPU: random walk with pulls toward a state-dependent baseline
  const cpuBase = prev.sessionActive ? (prev.gaming ? 58 : 34) : 24;
  const noise = (Math.random() - 0.5) * 14;
  const pull = (cpuBase - prev.cpu) * 0.18;
  const spike = Math.random() < 0.06 ? 12 : 0;
  const cpu = clamp(prev.cpu + pull + noise + spike, 3, 98);

  // --- RAM: slow drift upward (fragmentation) + jitter
  const ramDrift = prev.sessionActive ? 0.02 : 0.012;
  const jitter = (Math.random() - 0.5) * 0.05;
  const ramUsedGB = clamp(prev.ramUsedGB + ramDrift + jitter, prev.ramTotalGB * 0.28, prev.ramTotalGB * 0.97);

  // --- Temperature: heat when gaming, cool otherwise
  const targetTemp = prev.sessionActive ? (prev.gaming ? 41.5 : 37.5) : 33.5;
  const tPull = (targetTemp - prev.temp) * 0.06 + (Math.random() - 0.5) * 0.35;
  const temp = clamp(prev.temp + tPull, 28, 52);

  const point: MetricPoint = { t: Date.now(), cpu: Math.round(cpu), ram: Math.round((ramUsedGB / prev.ramTotalGB) * 100), temp: +temp.toFixed(1) };
  return { cpu: point.cpu, ramUsedGB: +ramUsedGB.toFixed(2), temp: point.temp, point };
}

export function initialPerf(ramTotalGB: number) {
  return {
    cpu: 22,
    ramUsedGB: +(ramTotalGB * 0.58).toFixed(2),
    temp: 33.5,
  };
}

/* ------------------------- Smart RAM Manager data --------------------------- */

export function detectHogs(): RamHog[] {
  const pool: Array<Omit<RamHog, "mb"> & { min: number; max: number }> = [
    { id: "browser", name: "مرورگر — ۵ تب فعال", own: false, icon: "Globe", min: 380, max: 720 },
    { id: "gallery", name: "گالری (پیش‌نمایش‌ها)", own: false, icon: "Image", min: 150, max: 300 },
    { id: "updater", name: "به‌روزرسان خودکار", own: false, icon: "RefreshCw", min: 90, max: 220 },
    { id: "gb-analyzer", name: "آنالیزور Game Booster", own: true, icon: "Activity", min: 60, max: 140 },
    { id: "gb-cache", name: "کش موقت Game Booster", own: true, icon: "Database", min: 40, max: 110 },
    { id: "gb-notifier", name: "اطلاع‌رسان غیرفعال", own: true, icon: "BellOff", min: 20, max: 60 },
    { id: "music", name: "پخش‌کننده موسیقی (پس‌زمینه)", own: false, icon: "Music", min: 120, max: 260 },
    { id: "sync", name: "همگام‌سازی ابری", own: false, icon: "Cloud", min: 80, max: 180 },
  ];
  return pool.map((p) => ({
    id: p.id,
    name: p.name,
    own: p.own,
    icon: p.icon,
    mb: Math.round(p.min + Math.random() * (p.max - p.min)),
  }));
}

export function detectCleanables(shaderProtected: boolean): CleanableItem[] {
  const ownCache = Math.round(80 + Math.random() * 240); // MB
  const items: CleanableItem[] = [
    { id: "own-cache", name: "کش خود برنامه (Game Booster)", mb: ownCache, safe: true },
    { id: "temp-files", name: "فایل‌های موقت قابل‌دسترسی", mb: Math.round(30 + Math.random() * 120), safe: true },
    { id: "thumbnails", name: "آیکون‌های کوچک گالری", mb: Math.round(15 + Math.random() * 60), safe: true },
  ];
  if (shaderProtected) {
    items.push({ id: "shader", name: "کش Shader بازی‌ها (محافظت‌شده)", mb: Math.round(400 + Math.random() * 900), safe: false, protectedShader: true });
  } else {
    items.push({ id: "shader", name: "کش Shader بازی‌ها (خطر حذف)", mb: Math.round(400 + Math.random() * 900), safe: false, protectedShader: false });
  }
  items.push({ id: "other-cache", name: "کش خصوصی سایر اپلیکیشن‌ها (محدود اندروید)", mb: Math.round(200 + Math.random() * 800), safe: false });
  return items;
}

/** thermal throttling state */
export function thermalState(temp: number): "normal" | "warm" | "hot" {
  if (temp >= 43) return "hot";
  if (temp >= 38.5) return "warm";
  return "normal";
}
