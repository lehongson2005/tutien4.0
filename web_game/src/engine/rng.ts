import type { Rarity } from '../types/game';

export type RngFn = () => number;

export function createSeededRng(seed: number): RngFn {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function clamp(val: number, min: number, max: number): number {
  if (Number.isNaN(val)) return min;
  return Math.max(min, Math.min(max, val));
}

export function pickRandom<T>(items: readonly T[], rng: RngFn): T {
  const idx = Math.floor(clamp(rng(), 0, 0.999999) * items.length);
  return items[idx];
}

export function pickWeightedByRarity<T extends { rarity?: Rarity }>(
  items: readonly T[],
  daoQuaPoints: number,
  rng: RngFn
): T {
  const boost = clamp(daoQuaPoints / 20, 0, 4);
  const baseWeights: Record<Rarity, number> = {
    pham: Math.max(12, 48 - boost * 7),
    linh: 28,
    vuong: 14 + boost * 3.5,
    thanh: 7 + boost * 2.5,
    chi_ton: 3 + boost * 1.5,
  };

  let total = 0;
  const weights = items.map((item) => {
    const w = baseWeights[item.rarity ?? 'pham'];
    total += w;
    return w;
  });

  let roll = rng() * total;
  for (let i = 0; i < items.length; i += 1) {
    roll -= weights[i];
    if (roll <= 0) return items[i];
  }
  return items[items.length - 1];
}
