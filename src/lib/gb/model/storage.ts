/**
 * DataStore simulation (Android Jetpack DataStore ⇄ localStorage).
 * Versioned, safe JSON persistence — MVVM Model layer.
 * The repository API mirrors AndroidX DataStore<Preferences> semantics:
 *   read → snapshot, edit → update atomically, auto-persisted.
 */

const KEY = "gb-datastore-v1";
const HISTORY_LIMIT = 60;
const WORKLOG_LIMIT = 80;

export interface PersistedState {
  version: 1;
  settings: unknown;
  selectedGameId: string | null;
  favorites: string[];
  profiles: Record<string, unknown>;
  dns: { serverId: string | null; serverLabel: string | null; protocol: string; customIp: string | null; connected: boolean; connectedAt: number | null };
  jobs: unknown[];
  history: unknown[];
  workLogs: unknown[];
  lastFreedMB: number | null;
  lastBoostAt: number | null;
  savedAt: number;
}

export function loadPersisted(): Partial<PersistedState> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedState;
    if (parsed.version !== 1) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function savePersisted(patch: Partial<PersistedState>): void {
  if (typeof window === "undefined") return;
  try {
    const current = loadPersisted() ?? ({ version: 1 } as PersistedState);
    const next = { ...current, ...patch, version: 1 as const, savedAt: Date.now() };
    // enforce caps
    if (Array.isArray(next.history) && next.history.length > HISTORY_LIMIT) {
      next.history = next.history.slice(0, HISTORY_LIMIT);
    }
    if (Array.isArray(next.workLogs) && next.workLogs.length > WORKLOG_LIMIT) {
      next.workLogs = next.workLogs.slice(0, WORKLOG_LIMIT);
    }
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage full / private mode — ignore */
  }
}

export function clearPersisted(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* noop */
  }
}

/** Info for the DataStore settings card */
export function dataStoreInfo(): { keys: number; savedAt: number | null } {
  const p = loadPersisted();
  if (!p) return { keys: 0, savedAt: null };
  const keys = [
    p.settings !== undefined,
    p.selectedGameId !== undefined,
    p.favorites !== undefined,
    p.profiles !== undefined,
    p.dns !== undefined,
    p.jobs !== undefined,
    p.history !== undefined,
    p.workLogs !== undefined,
  ].filter(Boolean).length;
  return { keys, savedAt: p.savedAt ?? null };
}
