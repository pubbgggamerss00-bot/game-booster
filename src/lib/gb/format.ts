import type { Lang } from "./types";

/** Locale-aware number formatting (Persian digits for fa) */
export function fmtNum(n: number | string, lang: Lang): string {
  if (lang === "fa") {
    return new Intl.NumberFormat("fa-IR").format(typeof n === "number" ? n : parseFloat(n) || 0);
  }
  return typeof n === "number" ? new Intl.NumberFormat("en-US").format(n) : n;
}

export function fmtInt(n: number, lang: Lang): string {
  return fmtNum(Math.round(n), lang);
}

export function fmtOne(n: number, lang: Lang): string {
  const v = Math.round(n * 10) / 10;
  return lang === "fa" ? new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 1 }).format(v) : String(v);
}

export function fmtBytesMB(mb: number, lang: Lang): string {
  if (mb >= 1024) return `${fmtOne(mb / 1024, lang)} GB`;
  return `${fmtInt(mb, lang)} MB`;
}

export function fmtPct(n: number, lang: Lang): string {
  return `${fmtInt(n, lang)}٪`;
}

export function fmtTime(ts: number, lang: Lang): string {
  const d = new Date(ts);
  return d.toLocaleTimeString(lang === "fa" ? "fa-IR" : "en-US", { hour: "2-digit", minute: "2-digit" });
}

export function fmtDateTime(ts: number, lang: Lang): string {
  const d = new Date(ts);
  return d.toLocaleString(lang === "fa" ? "fa-IR" : "en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function fmtDuration(ms: number, lang: Lang): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (lang === "fa") {
    return m > 0 ? `${fmtInt(m, lang)}:${String(r).padStart(2, "0")}` : `${fmtInt(r, lang)} ثانیه`;
  }
  return m > 0 ? `${m}:${String(r).padStart(2, "0")}` : `${r}s`;
}

export function nowClock(lang: Lang): string {
  return new Date().toLocaleTimeString(lang === "fa" ? "fa-IR" : "en-US", { hour: "2-digit", minute: "2-digit" });
}
