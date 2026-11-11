import type { PlayerState, ReincarnationLegacy } from '../types/game';
import { createEmptyLegacy } from './character';

export const SAVE_KEY = 'nhan_sinh_tu_tien_save_v1';
export const LEGACY_KEY = 'nhan_sinh_tu_tien_legacy_v1';

interface SaveEnvelope {
  version: number;
  savedAt: string;
  state: PlayerState | null;
  legacy: ReincarnationLegacy;
}

function isValidPlayerState(raw: unknown): raw is PlayerState {
  if (!raw || typeof raw !== 'object') return false;
  const s = raw as Record<string, unknown>;
  return (
    typeof s.name === 'string' &&
    typeof s.age === 'number' &&
    Number.isFinite(s.age) &&
    typeof s.maxAge === 'number' &&
    typeof s.realmIndex === 'number' &&
    typeof s.origin === 'object' &&
    s.origin !== null &&
    typeof s.physique === 'object' &&
    s.physique !== null &&
    typeof s.laws === 'object' &&
    s.laws !== null &&
    Array.isArray(s.inventory) &&
    Array.isArray(s.logs)
  );
}

function normalizeLegacy(raw: unknown): ReincarnationLegacy {
  if (!raw || typeof raw !== 'object') return createEmptyLegacy();
  const l = raw as Record<string, unknown>;
  return {
    rebirthCount: typeof l.rebirthCount === 'number' ? Math.max(0, l.rebirthCount) : 0,
    daoQuaPoints: typeof l.daoQuaPoints === 'number' ? Math.max(0, l.daoQuaPoints) : 0,
    inheritedTechniqueIds: Array.isArray(l.inheritedTechniqueIds)
      ? l.inheritedTechniqueIds.filter((x): x is string => typeof x === 'string')
      : [],
    unlockedCodexIds: Array.isArray(l.unlockedCodexIds)
      ? l.unlockedCodexIds.filter((x): x is string => typeof x === 'string')
      : [],
    bestRealmIndex: typeof l.bestRealmIndex === 'number' ? Math.max(0, l.bestRealmIndex) : 0,
    completedEndings: Array.isArray(l.completedEndings)
      ? l.completedEndings.filter((x): x is string => typeof x === 'string')
      : [],
  };
}

export function saveToLocalStorage(
  state: PlayerState | null,
  legacy: ReincarnationLegacy
): void {
  try {
    if (state) {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    } else {
      localStorage.removeItem(SAVE_KEY);
    }
    localStorage.setItem(LEGACY_KEY, JSON.stringify(legacy));
  } catch {
    // Ignore quota or storage restriction failures cleanly
  }
}

export function loadFromLocalStorage(): {
  state: PlayerState | null;
  legacy: ReincarnationLegacy;
} {
  let state: PlayerState | null = null;
  let legacy = createEmptyLegacy();

  try {
    const rawLegacy = localStorage.getItem(LEGACY_KEY);
    if (rawLegacy) {
      legacy = normalizeLegacy(JSON.parse(rawLegacy));
    }
  } catch {
    legacy = createEmptyLegacy();
  }

  try {
    const rawSave = localStorage.getItem(SAVE_KEY);
    if (rawSave) {
      const parsed = JSON.parse(rawSave);
      if (isValidPlayerState(parsed)) {
        state = parsed;
      }
    }
  } catch {
    state = null;
  }

  return { state, legacy };
}

export function exportSaveString(
  state: PlayerState | null,
  legacy: ReincarnationLegacy
): string {
  const envelope: SaveEnvelope = {
    version: 1,
    savedAt: new Date().toISOString(),
    state,
    legacy,
  };
  return JSON.stringify(envelope, null, 2);
}

export function importSaveString(jsonStr: string): {
  ok: boolean;
  state: PlayerState | null;
  legacy: ReincarnationLegacy | null;
  error?: string;
} {
  try {
    const parsed = JSON.parse(jsonStr) as Partial<SaveEnvelope>;
    if (!parsed || typeof parsed !== 'object') {
      return { ok: false, state: null, legacy: null, error: 'Định dạng Save không hợp lệ.' };
    }
    if (parsed.state && !isValidPlayerState(parsed.state)) {
      return {
        ok: false,
        state: null,
        legacy: null,
        error: 'Dữ liệu nhân vật trong file Save bị thiếu trường hoặc hỏng.',
      };
    }
    if (!parsed.state && !parsed.legacy) {
      return {
        ok: false,
        state: null,
        legacy: null,
        error: 'Không tìm thấy dữ liệu tu sĩ hoặc di sản luân hồi.',
      };
    }
    return {
      ok: true,
      state: parsed.state ?? null,
      legacy: normalizeLegacy(parsed.legacy),
    };
  } catch {
    return {
      ok: false,
      state: null,
      legacy: null,
      error: 'Không thể giải mã JSON (chuỗi Save bị lỗi cú pháp).',
    };
  }
}
