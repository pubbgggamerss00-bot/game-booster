/**
 * Game Booster — Domain Types (MVVM · Model layer)
 * Mirror of the Android app domain (Kotlin → TS prototype)
 */

export type Lang = "fa" | "en";
export type ThemeMode = "dark" | "light";

export type ScreenId =
  | "home"
  | "library"
  | "monitor"
  | "settings"
  | "dns"
  | "ram"
  | "work"
  | "device";

/* ---------------------------------- Games ---------------------------------- */

export type GameCategory = "battle" | "moba" | "racing" | "sandbox" | "sports" | "strategy";

export interface Game {
  id: string;
  name: string;
  packageId: string; // Android package name (PackageManager simulation)
  category: GameCategory;
  sizeMB: number;
  gradient: [string, string]; // icon tile gradient
  initials: string;
  ramDemand: "low" | "medium" | "high"; // used by Smart RAM Manager
}

export interface GameProfile {
  graphics: "high" | "balanced" | "smooth";
  priority: "performance" | "balanced" | "battery";
  netPriority: boolean;
  updatedAt: number;
}

/* ------------------------------- Performance ------------------------------- */

export interface MetricPoint {
  t: number;
  cpu: number; // 0..100
  ram: number; // 0..100
  temp: number; // °C
}

export interface PerfState {
  cpu: number;
  ramUsedGB: number;
  ramTotalGB: number;
  temp: number;
  points: MetricPoint[]; // rolling window
}

export type NetQuality = "excellent" | "good" | "fair" | "poor" | "unknown";

/* ----------------------------------- DNS ----------------------------------- */

export interface DnsServer {
  id: string;
  name: string;
  nameEn: string;
  ip: string;
  ip2?: string;
  dohUrl?: string; // DoH endpoint (JSON, CORS-enabled when testable)
  dotHost?: string;
  region: "global" | "iran";
  testable: boolean; // real DoH test possible from browser
  color: string;
}

export type DnsProtocol = "doh" | "dot";

export interface DnsState {
  connected: boolean;
  serverId: string | null;
  serverLabel: string | null;
  protocol: DnsProtocol;
  connectedAt: number | null;
  customIp: string | null;
}

export interface DnsTestResult {
  serverId: string;
  ms: number | null;
  source: "real" | "sim";
  at: number;
}

/* ---------------------------- Network diagnostics --------------------------- */

export interface NetDiag {
  running: boolean;
  ping: number | null;
  jitter: number | null;
  loss: number; // %
  samples: number[];
  quality: NetQuality;
  score: number; // 0..100
  at: number | null;
}

/* -------------------------------- WorkManager ------------------------------- */

export interface WorkJob {
  id: string;
  intervalH: number;
  enabled: boolean;
  lastRun: number | null;
}

export interface WorkLog {
  id: string;
  jobId: string;
  at: number;
  message: string;
}

/* --------------------------------- History --------------------------------- */

export interface BoostResult {
  gameId: string;
  freedMB: number;
  ramBefore: number;
  ramAfter: number;
  ping: number | null;
  jitter: number | null;
  quality: NetQuality;
}

export interface SessionSummaryData {
  gameId: string;
  avgFps: number;
  drops: number;
  durationMs: number;
  maxTemp: number;
}

export interface NetSummaryData {
  ping: number;
  jitter: number;
  loss: number;
  score: number;
}

export interface DnsSummaryData {
  serverId: string;
  ms: number | null;
  source: string;
}

export interface HistoryEntry {
  id: string;
  kind: "boost" | "network" | "dns" | "session";
  at: number;
  data: BoostResult | NetSummaryData | DnsSummaryData | SessionSummaryData;
}

/* --------------------------------- Session --------------------------------- */

export interface SessionEvent {
  id: string;
  at: number;
  message: string;
  level: "info" | "warn" | "good";
}

export interface SessionState {
  active: boolean;
  gameId: string | null;
  startedAt: number | null;
  fps: number | null;
  avgFps: number;
  drops: number;
  events: SessionEvent[];
}

/* --------------------------------- Settings -------------------------------- */

export interface Permissions {
  usage: boolean; // Usage Access (PackageStats)
  vpn: boolean; // VpnService for DNS
  notify: boolean;
  battery: boolean; // battery-optimization exemption
}

export interface Settings {
  lang: Lang;
  theme: ThemeMode;
  perfMode: boolean; // حالت افزایش عملکرد
  bgClean: boolean; // پاک‌سازی پس‌زمینه
  graphicsBoost: boolean; // بهبود گرافیک
  batterySaver: boolean; // حالت باتری
  shaderProtect: boolean; // محافظت از کش Shader بازی‌ها
  sensitiveConfirm: boolean; // تأیید کاربر برای پاک‌سازی حساس
  permissions: Permissions;
}

/* --------------------------------- Device ---------------------------------- */

export interface DeviceInfo {
  model: string;
  platform: string;
  isEmulator: boolean;
  cores: number;
  ramGB: number;
  screen: string;
  batteryLevel: number | null;
  batteryCharging: boolean | null;
  batterySupported: boolean;
  networkType: string;
  online: boolean;
}

/* ---------------------------------- Boost ----------------------------------- */

export type BoostStage = 0 | 1 | 2 | 3 | 4 | 5; // 0=idle, 1..5 stages, 5=done

export interface BoostState {
  active: boolean;
  stage: BoostStage;
  lines: string[]; // terminal-style log lines
  progress: number; // 0..1 for current stage
  freedMB: number;
  foundHogs: number;
  netPing: number | null;
  netJitter: number | null;
  quality: NetQuality;
  result: BoostResult | null;
  sensitiveAsk: boolean; // needs user confirmation
  sensitiveResolved: boolean;
  sensitiveAllowed: boolean;
}

/* ------------------------------- RAM manager -------------------------------- */

export interface RamHog {
  id: string;
  name: string;
  mb: number;
  own: boolean; // belongs to Game Booster (stoppable)
  icon: string;
}

export interface CleanableItem {
  id: string;
  name: string;
  mb: number;
  safe: boolean; // safe = own app cache; false = sensitive/other apps (restricted)
  protectedShader?: boolean;
}
