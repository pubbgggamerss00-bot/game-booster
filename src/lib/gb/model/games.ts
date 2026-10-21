import type { Game, GameProfile } from "../types";

/**
 * Installed-games catalog (PackageManager simulation).
 * On Android these are discovered via PackageManager with QUERY_ALL_PACKAGES
 * or <queries> declarations; here we emulate a scan result on a mid-range device.
 */
export const GAMES: Game[] = [
  { id: "pubgm", name: "PUBG Mobile", packageId: "com.tencent.ig", category: "battle", sizeMB: 3120, gradient: ["#f59e0b", "#dc2626"], initials: "PB", ramDemand: "high" },
  { id: "codm", name: "Call of Duty: Mobile", packageId: "com.activision.callofduty.shooter", category: "battle", sizeMB: 2840, gradient: ["#22d3ee", "#1d4ed8"], initials: "COD", ramDemand: "high" },
  { id: "freefire", name: "Free Fire", packageId: "com.dts.freefireth", category: "battle", sizeMB: 940, gradient: ["#fb923c", "#b91c1c"], initials: "FF", ramDemand: "medium" },
  { id: "genshin", name: "Genshin Impact", packageId: "com.miHoYo.GenshinImpact", category: "battle", sizeMB: 8600, gradient: ["#34d399", "#0ea5e9"], initials: "GI", ramDemand: "high" },
  { id: "coc", name: "Clash of Clans", packageId: "com.supercell.clashofclans", category: "strategy", sizeMB: 620, gradient: ["#f97316", "#92400e"], initials: "CoC", ramDemand: "low" },
  { id: "cr", name: "Clash Royale", packageId: "com.supercell.clashroyale", category: "strategy", sizeMB: 540, gradient: ["#818cf8", "#4338ca"], initials: "CR", ramDemand: "low" },
  { id: "mlbb", name: "Mobile Legends", packageId: "com.mobile.legends", category: "moba", sizeMB: 1180, gradient: ["#38bdf8", "#7c3aed"], initials: "ML", ramDemand: "medium" },
  { id: "roblox", name: "Roblox", packageId: "com.roblox.client", category: "sandbox", sizeMB: 320, gradient: ["#f87171", "#991b1b"], initials: "RBX", ramDemand: "medium" },
  { id: "asphalt9", name: "Asphalt 9: Legends", packageId: "com.gameloft.android.ANMP.GloftA9HM", category: "racing", sizeMB: 3480, gradient: ["#facc15", "#c026d3"], initials: "A9", ramDemand: "high" },
  { id: "brawl", name: "Brawl Stars", packageId: "com.supercell.brawlstars", category: "moba", sizeMB: 480, gradient: ["#fde047", "#f97316"], initials: "BS", ramDemand: "low" },
  { id: "efootball", name: "eFootball 2025", packageId: "jp.konami.pesam", category: "sports", sizeMB: 1780, gradient: ["#4ade80", "#166534"], initials: "EF", ramDemand: "medium" },
  { id: "wr", name: "Wild Rift", packageId: "com.riotgames.league.wildrift", category: "moba", sizeMB: 2260, gradient: ["#c084fc", "#0e7490"], initials: "WR", ramDemand: "high" },
];

export const DEFAULT_FAVORITES = ["pubgm", "codm", "mlbb"];

export function defaultProfile(game: Game): GameProfile {
  return {
    graphics: game.ramDemand === "high" ? "balanced" : "high",
    priority: game.ramDemand === "high" ? "performance" : "balanced",
    netPriority: game.category === "battle" || game.category === "moba",
    updatedAt: Date.now(),
  };
}

/** RAM the game itself is expected to occupy when running (Smart RAM Manager) */
export function gameRamNeedGB(game: Game, totalGB: number): number {
  const ratio = game.ramDemand === "high" ? 0.42 : game.ramDemand === "medium" ? 0.3 : 0.18;
  return Math.max(0.8, +(totalGB * ratio).toFixed(1));
}
