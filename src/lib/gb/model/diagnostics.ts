import type { DnsServer, NetQuality } from "../types";
import { DNS_SERVERS, DNS_SIM_LATENCY } from "./dns-servers";

/**
 * Real network diagnostics (browser-measured) + graceful fallback.
 * - Ping/Jitter/Loss: measured against our own /api/ping endpoint (same-origin RTT).
 * - DoH latency: REAL queries to CORS-enabled DoH JSON endpoints (Cloudflare/Google/Quad9/AdGuard).
 * - Anything un-measurable falls back to a clearly-marked simulated value.
 */

export async function pingOnce(timeoutMs = 3500): Promise<number | null> {
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), timeoutMs);
  const t0 = performance.now();
  try {
    const res = await fetch(`/api/ping?t=${Date.now()}-${Math.random().toString(36).slice(2)}`, {
      cache: "no-store",
      signal: ctrl.signal,
    });
    await res.json();
    return Math.round(performance.now() - t0);
  } catch {
    return null;
  } finally {
    clearTimeout(to);
  }
}

export interface NetMeasurement {
  ping: number | null;
  jitter: number | null;
  loss: number;
  samples: number[];
  quality: NetQuality;
  score: number;
}

export function classifyQuality(ping: number | null, jitter: number | null, loss: number): { quality: NetQuality; score: number } {
  if (ping === null) return { quality: "poor", score: 10 };
  let score = 100;
  score -= Math.min(60, (ping / 3.2) | 0);
  score -= Math.min(25, (jitter ?? 0) * 1.6);
  score -= Math.min(35, loss * 3.5);
  score = Math.max(5, Math.min(100, Math.round(score)));
  const quality: NetQuality = score >= 82 ? "excellent" : score >= 62 ? "good" : score >= 40 ? "fair" : "poor";
  return { quality, score };
}

export async function measureNetwork(count = 6): Promise<NetMeasurement> {
  const samples: number[] = [];
  let timeouts = 0;
  // warm-up request (discarded) — absorbs JIT/compile/DNS-cache effects of the first hit
  await pingOnce();
  for (let i = 0; i < count; i++) {
    const ms = await pingOnce();
    if (ms === null) timeouts++;
    else samples.push(ms);
  }
  const loss = Math.round((timeouts / count) * 100);
  let ping: number | null = null;
  let jitter: number | null = null;
  if (samples.length > 0) {
    ping = Math.round(samples.reduce((a, b) => a + b, 0) / samples.length);
    if (samples.length > 1) {
      let j = 0;
      for (let i = 1; i < samples.length; i++) j += Math.abs(samples[i] - samples[i - 1]);
      jitter = Math.round(j / (samples.length - 1));
    } else {
      jitter = 0;
    }
  }
  const { quality, score } = classifyQuality(ping, jitter, loss);
  return { ping, jitter, loss, samples, quality, score };
}

/* ---------------------------------- DoH test -------------------------------- */

export interface DohResult {
  ms: number | null;
  source: "real" | "sim";
}

export async function testDohServer(server: DnsServer): Promise<DohResult> {
  if (server.testable && server.dohUrl) {
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 4500);
    const t0 = performance.now();
    try {
      const res = await fetch(server.dohUrl, {
        headers: { accept: "application/dns-json" },
        cache: "no-store",
        signal: ctrl.signal,
      });
      const json = (await res.json()) as { Status?: number; Answer?: unknown[] };
      const ms = Math.round(performance.now() - t0);
      if (json && typeof json.Status === "number" && json.Status === 0) {
        return { ms, source: "real" };
      }
      return { ms, source: "real" };
    } catch {
      // CORS/network failure → fall through to simulation
    } finally {
      clearTimeout(to);
    }
  }
  return { ms: simulateLatency(server.id), source: "sim" };
}

function simulateLatency(serverId: string): number {
  const range = DNS_SIM_LATENCY[serverId] ?? [60, 140];
  return Math.round(range[0] + Math.random() * (range[1] - range[0]));
}

export async function testAllDns(): Promise<Array<{ serverId: string; ms: number | null; source: "real" | "sim" }>> {
  const results = await Promise.all(
    DNS_SERVERS.map(async (s) => {
      const r = await testDohServer(s);
      return { serverId: s.id, ms: r.ms, source: r.source };
    })
  );
  return results;
}

/* ------------------------------ device context ------------------------------ */

export function detectDevice() {
  if (typeof navigator === "undefined") {
    return { model: "—" , isEmulator: false, cores: 8, ramGB: 8 };
  }
  const ua = navigator.userAgent;
  // crude device-model extraction from UA (Android phones usually report a model)
  let model = "دستگاه ناشناس";
  const andMatch = ua.match(/Android\s+[\d.]+;\s*([^;)]+)\s*(?:Build|\))/i);
  if (andMatch && andMatch[1]) {
    model = andMatch[1].trim();
  } else if (/iPhone/i.test(ua)) {
    model = "iPhone";
  } else if (/Macintosh/i.test(ua)) {
    model = "Mac (Web Preview)";
  } else if (/Windows/i.test(ua)) {
    model = "Windows PC (Web Preview)";
  } else if (/Linux/i.test(ua)) {
    model = "Linux (Web Preview)";
  }
  const isEmulator = /(emulator|genymotion|bluestacks|sdk_gphone|google_sdk)/i.test(ua);
  const cores = navigator.hardwareConcurrency || 8;
  const nav = navigator as Navigator & { deviceMemory?: number };
  const ramGB = nav.deviceMemory && nav.deviceMemory >= 1 ? Math.min(16, Math.max(2, nav.deviceMemory * 2)) : 8;
  return { model, isEmulator, cores, ramGB };
}

export function networkTypeLabel(conn?: { effectiveType?: string; type?: string } | null): string {
  if (!conn) return "نامشخص";
  if (conn.type === "wifi") return "Wi-Fi";
  if (conn.type === "cellular") {
    const eff = (conn.effectiveType || "").toLowerCase();
    if (eff === "4g") return "4G";
    if (eff === "3g") return "3G";
    if (eff === "2g") return "2G";
    return "سلولی";
  }
  const eff = (conn.effectiveType || "").toLowerCase();
  if (eff) return eff.toUpperCase();
  return "نامشخص";
}

export interface NetworkInfoLike {
  effectiveType?: string;
  type?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

export function getNetworkInfo(): NetworkInfoLike | null {
  if (typeof navigator === "undefined") return null;
  const c = (navigator as Navigator & { connection?: NetworkInfoLike }).connection;
  return c ?? null;
}
