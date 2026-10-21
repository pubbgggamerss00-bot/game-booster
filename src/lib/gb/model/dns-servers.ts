import type { DnsServer } from "../types";

/**
 * Trusted DNS servers (Android VpnService + DoH/DoT simulation).
 * `testable` servers expose a CORS-enabled DoH JSON endpoint so the
 * browser can perform REAL latency tests. Others are estimated (sim).
 */
export const DNS_SERVERS: DnsServer[] = [
  {
    id: "cloudflare",
    name: "کلادفلر",
    nameEn: "Cloudflare",
    ip: "1.1.1.1",
    ip2: "1.0.0.1",
    dohUrl: "https://cloudflare-dns.com/dns-query?name=example.com&type=A",
    dotHost: "cloudflare-dns.com",
    region: "global",
    testable: true,
    color: "#f97316",
  },
  {
    id: "google",
    name: "گوگل",
    nameEn: "Google",
    ip: "8.8.8.8",
    ip2: "8.8.4.4",
    dohUrl: "https://dns.google/resolve?name=example.com&type=A",
    dotHost: "dns.google",
    region: "global",
    testable: true,
    color: "#22c55e",
  },
  {
    id: "quad9",
    name: "کواد۹",
    nameEn: "Quad9",
    ip: "9.9.9.9",
    ip2: "149.112.112.112",
    dohUrl: "https://dns.quad9.net:5053/dns-query?name=example.com&type=A",
    dotHost: "dns.quad9.net",
    region: "global",
    testable: true,
    color: "#8b5cf6",
  },
  {
    id: "adguard",
    name: "ادگارد",
    nameEn: "AdGuard",
    ip: "94.140.14.14",
    ip2: "94.140.15.15",
    dohUrl: "https://dns.adguard-dns.com/resolve?name=example.com&type=A",
    dotHost: "dns.adguard-dns.com",
    region: "global",
    testable: true,
    color: "#22d3ee",
  },
  {
    id: "opendns",
    name: "اوپن‌دی‌ان‌اس",
    nameEn: "OpenDNS",
    ip: "208.67.222.222",
    ip2: "208.67.220.220",
    region: "global",
    testable: false,
    color: "#3b82f6",
  },
  {
    id: "shecan",
    name: "شکن",
    nameEn: "Shecan",
    ip: "178.22.122.100",
    ip2: "185.51.200.2",
    region: "iran",
    testable: false,
    color: "#14b8a6",
  },
  {
    id: "radar",
    name: "رادار گیم",
    nameEn: "Radar Game",
    ip: "10.202.10.202",
    ip2: "10.202.10.102",
    region: "iran",
    testable: false,
    color: "#eab308",
  },
  {
    id: "electro",
    name: "الکترو",
    nameEn: "Electro",
    ip: "78.157.42.100",
    ip2: "78.157.42.101",
    region: "iran",
    testable: false,
    color: "#ef4444",
  },
  {
    id: "begzar",
    name: "بگذر",
    nameEn: "Begzar",
    ip: "185.55.226.26",
    ip2: "185.55.225.25",
    region: "iran",
    testable: false,
    color: "#a3e635",
  },
  {
    id: "403online",
    name: "۴۰۳ آنلاین",
    nameEn: "403.online",
    ip: "10.202.10.10",
    ip2: "10.202.10.11",
    region: "iran",
    testable: false,
    color: "#f472b6",
  },
];

/** Estimated latency baseline (ms) for non-testable servers — realistic per-region values */
export const DNS_SIM_LATENCY: Record<string, [number, number]> = {
  opendns: [95, 160],
  shecan: [45, 110],
  radar: [35, 95],
  electro: [55, 120],
  begzar: [60, 130],
  "403online": [40, 100],
};

export const DNS_CUSTOM_ID = "custom";
