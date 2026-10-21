"use client";

import { create } from "zustand";
import { toast } from "sonner";
import type {
  BoostState,
  CleanableItem,
  DnsProtocol,
  DnsState,
  DnsTestResult,
  DeviceInfo,
  Game,
  GameProfile,
  HistoryEntry,
  Lang,
  NetDiag,
  PerfState,
  RamHog,
  ScreenId,
  SessionEvent,
  SessionState,
  Settings,
  WorkJob,
  WorkLog,
} from "./types";
import { GAMES, DEFAULT_FAVORITES, defaultProfile, gameRamNeedGB } from "./model/games";
import { DNS_SERVERS } from "./model/dns-servers";
import { clearPersisted, loadPersisted, savePersisted } from "./model/storage";
import { detectCleanables, detectHogs, initialPerf, stepSim, thermalState } from "./model/simulator";
import { classifyQuality, detectDevice, measureNetwork, testAllDns } from "./model/diagnostics";
import { translate, type DictKey } from "./i18n";

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/* ------------------------------- defaults ---------------------------------- */

export const DEFAULT_JOBS: WorkJob[] = [
  { id: "smart_manager", intervalH: 6, enabled: true, lastRun: null },
  { id: "cache_clean", intervalH: 24, enabled: true, lastRun: null },
  { id: "memory_opt", intervalH: 12, enabled: true, lastRun: null },
  { id: "apps_check", intervalH: 48, enabled: true, lastRun: null },
];

const DEFAULT_SETTINGS: Settings = {
  lang: "fa",
  theme: "dark",
  perfMode: true,
  bgClean: true,
  graphicsBoost: false,
  batterySaver: false,
  shaderProtect: true,
  sensitiveConfirm: true,
  permissions: { usage: true, vpn: false, notify: true, battery: false },
};

const dev0 = detectDevice();
const ramTotalGB = dev0.ramGB;
const p0 = initialPerf(ramTotalGB);

function initHistory(): HistoryEntry[] {
  return [];
}

function initState() {
  const p = loadPersisted();
  return {
    settings: { ...DEFAULT_SETTINGS, ...((p?.settings as Settings) ?? {}) },
    selectedGameId: (p?.selectedGameId as string | null) ?? null,
    favorites: (p?.favorites as string[]) ?? DEFAULT_FAVORITES,
    profiles: (p?.profiles as Record<string, GameProfile>) ?? {},
    dns: {
      connected: (p?.dns as { connected?: boolean })?.connected ?? false,
      serverId: (p?.dns as { serverId?: string | null })?.serverId ?? null,
      serverLabel: (p?.dns as { serverLabel?: string | null })?.serverLabel ?? null,
      protocol: ((p?.dns as { protocol?: DnsProtocol })?.protocol ?? "doh") as DnsProtocol,
      connectedAt: (p?.dns as { connectedAt?: number | null })?.connectedAt ?? null,
      customIp: (p?.dns as { customIp?: string | null })?.customIp ?? null,
    } as DnsState,
    jobs: ((p?.jobs as WorkJob[]) ?? DEFAULT_JOBS).map((j) => ({
      ...j,
      lastRun: j.lastRun ?? Date.now() - Math.random() * j.intervalH * 3600_000 * 0.6,
    })) as WorkJob[],
    history: (p?.history as HistoryEntry[]) ?? initHistory(),
    workLogs: (p?.workLogs as WorkLog[]) ?? [],
    lastFreedMB: (p?.lastFreedMB as number | null) ?? null,
    lastBoostAt: (p?.lastBoostAt as number | null) ?? null,
  };
}

/* --------------------------------- store ------------------------------------ */

export interface BoosterStore {
  /* --- persisted --- */
  settings: Settings;
  selectedGameId: string | null;
  favorites: string[];
  profiles: Record<string, GameProfile>;
  dns: DnsState;
  jobs: WorkJob[];
  history: HistoryEntry[];
  workLogs: WorkLog[];

  /* --- transient --- */
  perf: PerfState;
  fps: number | null;
  dnsTests: DnsTestResult[];
  dnsTestRunning: boolean;
  netDiag: NetDiag;
  hogs: RamHog[];
  cleanables: CleanableItem[];
  boost: BoostState;
  session: SessionState;
  device: DeviceInfo;
  screen: ScreenId;
  prevScreen: ScreenId;
  lastFreedMB: number | null;
  lastBoostAt: number | null;
  storeSavedAt: number | null;

  /* --- actions --- */
  t: (key: DictKey) => string;
  setLang: (l: Lang) => void;
  setTheme: (t: "dark" | "light") => void;
  patchSettings: (p: Partial<Settings>) => void;
  setPermission: (k: keyof Settings["permissions"], v: boolean) => void;
  navigate: (s: ScreenId) => void;
  goBack: () => void;
  selectGame: (id: string | null) => void;
  toggleFavorite: (id: string) => void;
  setProfile: (id: string, p: Partial<GameProfile>) => void;

  tick: () => void;
  setFps: (fps: number | null) => void;
  setBattery: (level: number | null, charging: boolean | null) => void;
  setOnline: (online: boolean) => void;

  refreshHogs: () => void;
  killOwnHogs: () => number;
  refreshCleanables: () => void;
  cleanSafeItems: () => number;
  cleanShaderCache: () => number;

  startBoost: (gameId: string) => Promise<void>;
  cancelBoost: () => void;
  resolveSensitive: (allow: boolean) => void;
  launchFromBoost: () => void;
  closeBoost: () => void;

  startSession: (gameId: string) => void;
  pushSessionEvent: (message: string, level?: SessionEvent["level"]) => void;
  endSession: () => void;

  connectDns: (serverId: string | "custom", label: string) => void;
  disconnectDns: () => void;
  setDnsProtocol: (p: DnsProtocol) => void;
  setCustomDns: (ip: string | null) => void;
  runDnsTests: () => Promise<void>;
  applyBestDns: () => void;

  runNetDiag: () => Promise<void>;

  toggleJob: (id: string) => void;
  runJobNow: (id: string, auto?: boolean) => void;
  pushWorkLog: (jobId: string, message: string) => void;

  saveSettingsNow: () => void;
  resetAll: () => void;
  freeRam: (mb: number) => void;
}

let boostAborted = false;
let boostWaitingSensitive = false;

export const useBooster = create<BoosterStore>((set, get) => {
  const s = initState();

  const persist = () => {
    const st = get();
    savePersisted({
      settings: st.settings,
      selectedGameId: st.selectedGameId,
      favorites: st.favorites,
      profiles: st.profiles,
      dns: {
        serverId: st.dns.serverId,
        serverLabel: st.dns.serverLabel,
        protocol: st.dns.protocol,
        customIp: st.dns.customIp,
        connected: st.dns.connected,
        connectedAt: st.dns.connectedAt,
      },
      jobs: st.jobs,
      history: st.history,
      workLogs: st.workLogs.slice(0, 80),
      lastFreedMB: st.lastFreedMB,
      lastBoostAt: st.lastBoostAt,
    });
    set({ storeSavedAt: Date.now() });
  };

  return {
    settings: s.settings,
    selectedGameId: s.selectedGameId,
    favorites: s.favorites,
    profiles: s.profiles,
    dns: s.dns,
    jobs: s.jobs,
    history: s.history,
    workLogs: s.workLogs,

    perf: {
      cpu: p0.cpu,
      ramUsedGB: p0.ramUsedGB,
      ramTotalGB,
      temp: p0.temp,
      points: [],
    },
    fps: null,
    dnsTests: [],
    dnsTestRunning: false,
    netDiag: { running: false, ping: null, jitter: null, loss: 0, samples: [], quality: "unknown", score: 0, at: null },
    hogs: [],
    cleanables: [],
    boost: { active: false, stage: 0, lines: [], progress: 0, freedMB: 0, foundHogs: 0, netPing: null, netJitter: null, quality: "unknown", result: null, sensitiveAsk: false, sensitiveResolved: true, sensitiveAllowed: false },
    session: { active: false, gameId: null, startedAt: null, fps: null, avgFps: 0, drops: 0, events: [] },
    device: {
      ...dev0,
      platform: "web",
      screen: typeof window !== "undefined" ? `${window.screen.width}×${window.screen.height}` : "—",
      batteryLevel: null,
      batteryCharging: null,
      batterySupported: false,
      networkType: "—",
      online: true,
    },
    screen: "home",
    prevScreen: "home",
    lastFreedMB: s.lastFreedMB,
    lastBoostAt: s.lastBoostAt,
    storeSavedAt: null,

    /* ------------------------------ settings ------------------------------- */
    t: (key) => translate(get().settings.lang, key),
    setLang: (l) => {
      set({ settings: { ...get().settings, lang: l } });
      if (typeof document !== "undefined") {
        document.documentElement.lang = l;
        document.documentElement.dir = l === "fa" ? "rtl" : "ltr";
      }
      persist();
    },
    setTheme: (t) => {
      set({ settings: { ...get().settings, theme: t } });
      persist();
    },
    patchSettings: (p) => {
      set({ settings: { ...get().settings, ...p } });
      persist();
    },
    setPermission: (k, v) => {
      set({ settings: { ...get().settings, permissions: { ...get().settings.permissions, [k]: v } } });
      persist();
    },

    /* ------------------------------ navigation ----------------------------- */
    navigate: (sc) => set({ prevScreen: get().screen, screen: sc }),
    goBack: () => set({ screen: get().prevScreen ?? "home" }),
    selectGame: (id) => {
      set({ selectedGameId: id });
      persist();
    },
    toggleFavorite: (id) => {
      const f = get().favorites.includes(id) ? get().favorites.filter((x) => x !== id) : [...get().favorites, id];
      set({ favorites: f });
      persist();
    },
    setProfile: (id, p) => {
      const game = GAMES.find((g) => g.id === id);
      const cur = get().profiles[id] ?? (game ? defaultProfile(game) : defaultProfile(GAMES[0]));
      set({ profiles: { ...get().profiles, [id]: { ...cur, ...p, updatedAt: Date.now() } } });
      persist();
    },

    /* -------------------------------- engine -------------------------------- */
    tick: () => {
      const st = get();
      const gaming = st.session.active;
      const out = stepSim({
        cpu: st.perf.cpu,
        ramUsedGB: st.perf.ramUsedGB,
        ramTotalGB: st.perf.ramTotalGB,
        temp: st.perf.temp,
        sessionActive: gaming,
        gaming,
      });
      const points = [...st.perf.points, out.point].slice(-60);
      set({
        perf: { ...st.perf, cpu: out.cpu, ramUsedGB: out.ramUsedGB, temp: out.temp, points },
      });

      // session events
      if (gaming && st.session.startedAt) {
        const elapsed = Date.now() - st.session.startedAt;
        const sess = st.session;
        const maybePush = (message: string, level: SessionEvent["level"]) => {
          const ev: SessionEvent = { id: uid(), at: Date.now(), message, level };
          set({ session: { ...get().session, events: [...get().session.events, ev].slice(-12) } });
        };
        if (elapsed > 8000 && elapsed % 9000 < 1100) {
          const temp = out.temp;
          const fps = get().session.fps;
          if (thermalState(temp) === "hot") maybePush("دمای دستگاه بالاست؛ احتمال افت عملکرد حرارتی", "warn");
          else if (fps !== null && fps < 48) maybePush("افت فریم شناسایی شد — پیشنهاد: کاهش گرافیک به «روان»", "warn");
          else if (st.dns.connected) maybePush(`کیفیت شبکه پایدار است — DNS: ${st.dns.serverLabel ?? "فعال"}`, "good");
          else maybePush("عملکرد پایدار است. پایش در پس‌زمینه ادامه دارد.", "info");
        }
        // fps bookkeeping
        if (sess.fps !== null) {
          const avg = sess.avgFps === 0 ? sess.fps : (sess.avgFps * 0.9 + sess.fps * 0.1);
          set({ session: { ...get().session, avgFps: Math.round(avg) } });
        }
      }

      // WorkManager: auto-run due jobs (background simulation)
      const now = Date.now();
      st.jobs.forEach((j) => {
        if (!j.enabled) return;
        const due = j.lastRun === null || now - j.lastRun > j.intervalH * 3600_000;
        if (due && now - (j.lastRun ?? 0) > 60_000) {
          get().runJobNow(j.id, true);
        }
      });
    },

    setFps: (fps) => set({ fps, session: get().session.active ? { ...get().session, fps } : get().session }),
    setBattery: (level, charging) =>
      set({ device: { ...get().device, batteryLevel: level, batteryCharging: charging, batterySupported: level !== null } }),
    setOnline: (online) => set({ device: { ...get().device, online } }),

    /* ---------------------------- RAM manager ------------------------------ */
    refreshHogs: () => set({ hogs: detectHogs() }),
    killOwnHogs: () => {
      const own = get().hogs.filter((h) => h.own);
      const freed = own.reduce((a, b) => a + b.mb, 0);
      set({ hogs: get().hogs.filter((h) => !h.own) });
      get().freeRam(freed);
      return freed;
    },
    refreshCleanables: () => set({ cleanables: detectCleanables(get().settings.shaderProtect) }),
    cleanSafeItems: () => {
      const freed = get().cleanables.filter((c) => c.safe).reduce((a, b) => a + b.mb, 0);
      set({ cleanables: get().cleanables.map((c) => (c.safe ? { ...c, mb: 0 } : c)) });
      get().freeRam(freed);
      return freed;
    },
    cleanShaderCache: () => {
      const item = get().cleanables.find((c) => c.protectedShader !== undefined);
      if (!item) return 0;
      set({ cleanables: get().cleanables.map((c) => (c.id === "shader" ? { ...c, mb: 0 } : c)) });
      get().freeRam(item.mb);
      return item.mb;
    },
    freeRam: (mb) => {
      const st = get();
      const used = Math.max(st.perf.ramTotalGB * 0.3, st.perf.ramUsedGB - mb / 1024);
      set({ perf: { ...st.perf, ramUsedGB: used } });
    },

    /* -------------------------------- boost --------------------------------- */
    startBoost: async (gameId) => {
      const game = GAMES.find((g) => g.id === gameId);
      if (!game) return;
      const st0 = get();
      const lang = st0.settings.lang;
      const L = (fa: string, en: string) => (lang === "fa" ? fa : en);
      boostAborted = false;
      boostWaitingSensitive = false;

      const ramBefore = st0.perf.ramUsedGB;
      set({
        boost: { active: true, stage: 1, lines: [], progress: 0, freedMB: 0, foundHogs: 0, netPing: null, netJitter: null, quality: "unknown", result: null, sensitiveAsk: false, sensitiveResolved: true, sensitiveAllowed: false },
      });

      const setStage = (stage: BoostState["stage"], progress: number, patch: Partial<BoostState> = {}) =>
        set({ boost: { ...get().boost, stage, progress, ...patch } });
      const pushLine = (line: string) => set({ boost: { ...get().boost, lines: [...get().boost.lines, line].slice(-9) } });
      const animate = async (duration: number, onTick?: (p: number) => void) => {
        const steps = 22;
        for (let i = 1; i <= steps; i++) {
          if (boostAborted) return false;
          const p = i / steps;
          onTick?.(p);
          await sleep(duration / steps);
        }
        return true;
      };

      try {
        /* ---------- Stage 1: memory pressure pre-check ---------- */
        pushLine(L("۱/۵ بررسی فشار حافظه…", "1/5 Checking memory pressure…"));
        const hogs = detectHogs();
        const hogMB = hogs.reduce((a, b) => a + b.mb, 0);
        const need = gameRamNeedGB(game, get().perf.ramTotalGB);
        const availBefore = get().perf.ramTotalGB - get().perf.ramUsedGB;
        setStage(1, 0);
        pushLine(L(`فعالیت‌های پرمصرف قابل‌تشخیص: ${hogs.length} مورد (${hogMB} مگابایت)`, `Detectable high-usage activities: ${hogs.length} (${hogMB} MB)`));
        await animate(900, (p) => setStage(1, p));
        if (boostAborted) return;
        pushLine(
          availBefore + 0.6 >= need
            ? L(`حافظه کافی است: ${availBefore.toFixed(1)} گیگ در دسترس (نیاز بازی ~${need} گیگ)`, `Enough memory: ${availBefore.toFixed(1)} GB free (game needs ~${need} GB)`)
            : L(`فشار حافظه بالاست! نیاز بازی ~${need} گیگ — آزادسازی لازم است`, `High memory pressure! Game needs ~${need} GB — freeing required`)
        );
        set({ boost: { ...get().boost, foundHogs: hogs.length, stage: 2, progress: 0, lines: [...get().boost.lines] } });

        /* ---------- Stage 2: clean + free ---------- */
        pushLine(L("۲/۵ آزادسازی حافظه و پاک‌سازی کش…", "2/5 Freeing memory and clearing cache…"));
        await animate(500, (p) => setStage(2, p));
        if (boostAborted) return;
        let freed = 0;
        if (get().settings.bgClean) {
          const own = get().hogs.length ? get().hogs.filter((h) => h.own) : detectHogs().filter((h) => h.own);
          const ownMB = own.reduce((a, b) => a + b.mb, 0);
          if (ownMB > 0) {
            freed += ownMB;
            pushLine(L(`توقف ${own.length} فعالیت غیرضروری خود برنامه (+${ownMB} MB)`, `Stopped ${own.length} own non-essential activities (+${ownMB} MB)`));
            await sleep(280);
          }
        }
        const cleans = detectCleanables(get().settings.shaderProtect);
        const safeMB = cleans.filter((c) => c.safe).reduce((a, b) => a + b.mb, 0);
        freed += safeMB;
        pushLine(L(`پاک‌سازی کش خود برنامه و فایل‌های موقت (+${safeMB} MB)`, `Cleared own cache and temp files (+${safeMB} MB)`));
        await animate(600, (p) => setStage(2, Math.min(0.9, p)));
        if (boostAborted) return;

        // sensitive: shader cache
        const shaderItem = cleans.find((c) => c.protectedShader !== undefined);
        if (shaderItem && !get().settings.shaderProtect && !boostWaitingSensitive) {
          set({ boost: { ...get().boost, sensitiveAsk: true, sensitiveResolved: false, sensitiveAllowed: false, progress: 0.9 } });
          await new Promise<void>((res) => {
            const check = () => {
              if (get().boost.sensitiveResolved || boostAborted) res();
              else setTimeout(check, 120);
            };
            check();
          });
          if (boostAborted) return;
          if (get().boost.sensitiveAllowed) {
            freed += shaderItem.mb;
            pushLine(L(`کش Shader پاک شد (+${shaderItem.mb} MB) — ممکن است مکث اولیه بازی بیشتر شود`, `Shader cache cleared (+${shaderItem.mb} MB) — initial stutter may increase`));
          } else {
            pushLine(L("کش Shader بازی‌ها حفظ شد (به انتخاب شما)", "Game shader cache kept (by your choice)"));
          }
        } else if (shaderItem) {
          pushLine(L(`کش Shader بازی‌ها محافظت شد (${shaderItem.mb} MB دست‌نخورده)`, `Game shader cache protected (${shaderItem.mb} MB untouched)`));
        }

        set({
          boost: { ...get().boost, freedMB: freed, stage: 3, progress: 0, sensitiveAsk: false, sensitiveResolved: true, lines: [...get().boost.lines] },
        });

        /* ---------- Stage 3: network ---------- */
        pushLine(L("۳/۵ بررسی شبکه و DNS…", "3/5 Checking network and DNS…"));
        const net = await measureNetwork(5);
        if (boostAborted) return;
        pushLine(L(`پینگ: ${net.ping ?? "—"} ms | جیتر: ${net.jitter ?? "—"} ms | افت بسته: ${net.loss}٪`, `Ping: ${net.ping ?? "—"} ms | Jitter: ${net.jitter ?? "—"} ms | Loss: ${net.loss}%`));
        const { quality } = classifyQuality(net.ping, net.jitter, net.loss);
        if (get().dns.connected) pushLine(L(`DNS فعال: ${get().dns.serverLabel} ✓`, `DNS active: ${get().dns.serverLabel} ✓`));
        else pushLine(L("DNS متصل نیست — از سیستم DNS Changer می‌توانید اتصال دهید", "DNS not connected — use DNS Changer to connect"));
        await animate(450, (p) => setStage(3, p));
        get().freeRam(freed);
        set({ boost: { ...get().boost, netPing: net.ping, netJitter: net.jitter, quality, stage: 4, progress: 0 } });

        /* ---------- Stage 4: prepare launch (allowed features) ---------- */
        const prof = get().profiles[game.id] ?? defaultProfile(game);
        pushLine(L("۴/۵ اعمال قابلیت‌های مجاز عملکردی…", "4/5 Applying allowed performance features…"));
        const feats: string[] = [];
        if (get().settings.perfMode) feats.push(L("حالت افزایش عملکرد (بدون روت، در محدوده مجاز)", "Performance mode (no-root, within allowed scope)"));
        if (prof.priority === "performance") feats.push(L("اولویت پردازش برای بازی", "Process priority for game"));
        if (prof.netPriority) feats.push(L("اولویت شبکه فعال شد", "Network priority enabled"));
        if (get().settings.graphicsBoost) feats.push(L("بهینه‌سازی گرافیک: پیشنهاد «" + (prof.graphics === "high" ? "بالا" : prof.graphics === "balanced" ? "متعادل" : "روان") + "»", "Graphics tuning: suggested “" + prof.graphics + "”"));
        feats.push(L("Game Mode سازنده: در صورت پشتیبانی فعال می‌شود", "Vendor Game Mode: enabled when supported"));
        for (const f of feats) {
          if (boostAborted) return;
          pushLine(f);
          await sleep(220);
        }
        await animate(500, (p) => setStage(4, p));
        set({ boost: { ...get().boost, stage: 5, progress: 0 } });

        /* ---------- Stage 5: start monitoring ---------- */
        pushLine(L("۵/۵ شروع پایش عملکرد…", "5/5 Starting performance monitoring…"));
        await animate(600, (p) => setStage(5, p));
        if (boostAborted) return;
        pushLine(L("پایش افت فریم، حافظه و شبکه فعال شد ✓", "Frame-drop, memory and network monitoring active ✓"));

        const ramAfter = get().perf.ramUsedGB;
        const result: BoostResultLike = {
          gameId: game.id,
          freedMB: freed,
          ramBefore: +ramBefore.toFixed(2),
          ramAfter: +ramAfter.toFixed(2),
          ping: net.ping,
          jitter: net.jitter,
          quality,
        };
        const entry: HistoryEntry = { id: uid(), kind: "boost", at: Date.now(), data: result };
        set({
          boost: { ...get().boost, active: true, stage: 5, progress: 1, result, lines: [...get().boost.lines] },
          lastFreedMB: freed,
          lastBoostAt: Date.now(),
          history: [entry, ...get().history].slice(0, 60),
        });
        persist();
      } catch {
        toast.error(L("خطا در فرایند بهینه‌سازی", "Boost process error"));
        set({ boost: { ...get().boost, active: false, stage: 0 } });
      }
    },
    cancelBoost: () => {
      boostAborted = true;
      boostWaitingSensitive = false;
      set({ boost: { ...get().boost, active: false, stage: 0, progress: 0, sensitiveAsk: false, sensitiveResolved: true, sensitiveAllowed: false } });
    },
    resolveSensitive: (allow) => {
      set({ boost: { ...get().boost, sensitiveAsk: false, sensitiveResolved: true, sensitiveAllowed: allow } });
    },
    launchFromBoost: () => {
      const r = get().boost.result;
      if (!r) return;
      set({ boost: { ...get().boost, active: false, stage: 0 } });
      get().startSession(r.gameId);
    },
    closeBoost: () => {
      set({ boost: { ...get().boost, active: false, stage: 0 } });
    },

    /* ------------------------------- session -------------------------------- */
    startSession: (gameId) => {
      set({
        session: { active: true, gameId, startedAt: Date.now(), fps: null, avgFps: 0, drops: 0, events: [{ id: uid(), at: Date.now(), message: "جلسه بازی آغاز شد — پایش عملکرد فعال است", level: "info" }] },
      });
    },
    pushSessionEvent: (message, level = "info") => {
      const ev: SessionEvent = { id: uid(), at: Date.now(), message, level };
      set({ session: { ...get().session, events: [...get().session.events, ev].slice(-12) } });
    },
    endSession: () => {
      const sess = get().session;
      if (!sess.active || !sess.gameId) return;
      const durationMs = sess.startedAt ? Date.now() - sess.startedAt : 0;
      const maxTemp = Math.max(...get().perf.points.slice(-Math.min(90, get().perf.points.length)).map((p) => p.temp), get().perf.temp);
      const entry: HistoryEntry = {
        id: uid(),
        kind: "session",
        at: Date.now(),
        data: { gameId: sess.gameId, avgFps: sess.avgFps || sess.fps || 60, drops: sess.drops, durationMs, maxTemp: +maxTemp.toFixed(1) },
      };
      set({ session: { active: false, gameId: null, startedAt: null, fps: null, avgFps: 0, drops: 0, events: [] }, history: [entry, ...get().history].slice(0, 60) });
      persist();
    },

    /* --------------------------------- DNS ----------------------------------- */
    connectDns: (serverId, label) => {
      const st = get();
      if (!st.settings.permissions.vpn) {
        toast(st.settings.lang === "fa" ? "برای تغییر DNS، مجوز VPN را فعال کنید" : "Grant the VPN permission to change DNS");
        return;
      }
      set({ dns: { ...st.dns, connected: true, serverId: serverId === "custom" ? "custom" : serverId, serverLabel: label, connectedAt: Date.now() } });
      toast.success(st.settings.lang === "fa" ? `DNS متصل شد: ${label}` : `DNS connected: ${label}`);
      persist();
    },
    disconnectDns: () => {
      const st = get();
      set({ dns: { ...st.dns, connected: false, connectedAt: null } });
      toast(st.settings.lang === "fa" ? "DNS قطع شد؛ تنظیمات دستگاه به حالت اولیه بازگشت" : "DNS disconnected; device DNS restored to default");
      persist();
    },
    setDnsProtocol: (p) => {
      set({ dns: { ...get().dns, protocol: p } });
      persist();
    },
    setCustomDns: (ip) => {
      set({ dns: { ...get().dns, customIp: ip } });
      persist();
    },
    runDnsTests: async () => {
      if (get().dnsTestRunning) return;
      set({ dnsTestRunning: true });
      try {
        const results = await testAllDns();
        set({ dnsTests: results.map((r) => ({ ...r, at: Date.now() })), dnsTestRunning: false });
        const lang = get().settings.lang;
        const best = results.filter((r) => r.ms !== null).sort((a, b) => (a.ms ?? 9e9) - (b.ms ?? 9e9))[0];
        if (best) {
          const srv = DNS_SERVERS.find((s) => s.id === best.serverId);
          toast.success(lang === "fa" ? `تست کامل شد — سریع‌ترین: ${srv?.name ?? best.serverId} (${best.ms} ms)` : `Done — fastest: ${srv?.nameEn ?? best.serverId} (${best.ms} ms)`);
          const entry: HistoryEntry = { id: uid(), kind: "dns", at: Date.now(), data: { serverId: best.serverId, ms: best.ms, source: best.source } };
          set({ history: [entry, ...get().history].slice(0, 60) });
          persist();
        }
      } catch {
        set({ dnsTestRunning: false });
        toast.error(get().settings.lang === "fa" ? "خطا در تست سرورهای DNS" : "DNS test failed");
      }
    },
    applyBestDns: () => {
      const best = get().dnsTests.filter((r) => r.ms !== null).sort((a, b) => (a.ms ?? 9e9) - (b.ms ?? 9e9))[0];
      if (!best) return;
      const srv = DNS_SERVERS.find((s) => s.id === best.serverId);
      if (srv) get().connectDns(srv.id, get().settings.lang === "fa" ? srv.name : srv.nameEn);
    },

    /* ------------------------------ network diag ----------------------------- */
    runNetDiag: async () => {
      if (get().netDiag.running) return;
      set({ netDiag: { ...get().netDiag, running: true, samples: [] } });
      const r = await measureNetwork(8);
      const entry: HistoryEntry = { id: uid(), kind: "network", at: Date.now(), data: { ping: r.ping ?? 0, jitter: r.jitter ?? 0, loss: r.loss, score: r.score } };
      set({ netDiag: { ...r, running: false, at: Date.now() }, history: [entry, ...get().history].slice(0, 60) });
      persist();
    },

    /* ------------------------------ WorkManager ------------------------------ */
    toggleJob: (id) => {
      set({ jobs: get().jobs.map((j) => (j.id === id ? { ...j, enabled: !j.enabled } : j)) });
      persist();
    },
    runJobNow: (id, auto = false) => {
      const st = get();
      const lang = st.settings.lang;
      const job = st.jobs.find((j) => j.id === id);
      if (!job) return;
      let msg = "";
      switch (id) {
        case "smart_manager": {
          const hogs = detectHogs().filter((h) => h.own);
          const mb = hogs.reduce((a, b) => a + b.mb, 0);
          get().freeRam(mb);
          msg = lang === "fa" ? `مدیریت هوشمند: ${hogs.length} فعالیت خود برنامه متوقف شد (${mb} MB آزاد شد)` : `Smart manager: stopped ${hogs.length} own activities (${mb} MB freed)`;
          break;
        }
        case "cache_clean": {
          const mb = Math.round(80 + Math.random() * 220);
          get().freeRam(mb);
          msg = lang === "fa" ? `پاک‌سازی حافظه نهان: ${mb} MB آزاد شد` : `Cache clean: ${mb} MB freed`;
          break;
        }
        case "memory_opt": {
          const mb = Math.round(40 + Math.random() * 120);
          get().freeRam(mb);
          msg = lang === "fa" ? `بهینه‌سازی آمار عملکرد و حافظه: ${mb} MB بازیابی شد` : `Performance stats and memory optimized: ${mb} MB reclaimed`;
          break;
        }
        case "apps_check": {
          msg = lang === "fa" ? `بررسی بازی‌های نصب‌شده: ${GAMES.length} بازی شناسایی شد` : `Installed games check: ${GAMES.length} games found`;
          break;
        }
      }
      set({
        jobs: get().jobs.map((j) => (j.id === id ? { ...j, lastRun: Date.now() } : j)),
      });
      get().pushWorkLog(id, (auto ? "[خودکار] " : "") + msg);
      if (!auto && !job.enabled === false) {
        // manual run feedback
      }
      if (!auto) toast.success(msg);
      persist();
    },
    pushWorkLog: (jobId, message) => {
      const log: WorkLog = { id: uid(), jobId, at: Date.now(), message };
      set({ workLogs: [log, ...get().workLogs].slice(0, 80) });
      persist();
    },

    /* ------------------------------ DataStore ops ----------------------------- */
    saveSettingsNow: () => {
      persist();
      const info = get().settings.lang === "fa" ? "تنظیمات با DataStore ذخیره شد ✓" : "Settings saved via DataStore ✓";
      toast.success(info);
    },
    resetAll: () => {
      clearPersisted();
      set({
        settings: { ...DEFAULT_SETTINGS },
        selectedGameId: null,
        favorites: [...DEFAULT_FAVORITES],
        profiles: {},
        dns: { connected: false, serverId: null, serverLabel: null, protocol: "doh", connectedAt: null, customIp: null },
        jobs: DEFAULT_JOBS.map((j) => ({ ...j, lastRun: Date.now() })),
        history: [],
        workLogs: [],
        lastFreedMB: null,
        lastBoostAt: null,
      });
      if (typeof document !== "undefined") {
        document.documentElement.lang = "fa";
        document.documentElement.dir = "rtl";
      }
    },
  };
});

/* helper type to avoid circular import */
type BoostResultLike = import("./types").BoostResult;
