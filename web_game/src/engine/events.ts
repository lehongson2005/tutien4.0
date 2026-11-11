import {
  ABILITIES,
  ARTIFACTS,
  ARRAYS,
  BEASTS,
  CALAMITIES,
  COMPANIONS,
  ELIXIRS,
  EVENTS_BY_STAGE,
  FRIENDS,
  HERBS,
  SECT_RELICS,
  TECHNIQUES,
  WEATHER_PHENOMENA,
  getRealmByIndex,
} from '../data/catalog';
import type {
  ChoiceOption,
  GameEvent,
  ItemCategory,
  LifeStage,
  LoreEntry,
  PlayerState,
  StatKey,
  WorldTier,
} from '../types/game';
import { appendLog, createInventoryItem, unlockCodexIds } from './character';
import { clamp, pickRandom, type RngFn } from './rng';

export function getStageForAge(age: number): LifeStage {
  if (age < 18) return 1;
  if (age < 100) return 2;
  if (age < 500) return 3;
  return 4;
}

export function getStepYears(state: PlayerState): number {
  if (state.stage === 1) return 1;
  if (state.stage === 2) return state.stage2StepYears;
  if (state.stage === 3) return 15;
  if (state.realmIndex <= 6) return 150;
  if (state.realmIndex <= 10) return 1_500;
  if (state.realmIndex <= 20) return 50_000;
  return 1_000_000;
}

export function getSubStageKey(stage: LifeStage, age: number): string {
  if (stage === 1) {
    if (age <= 3) return '0-3';
    if (age <= 10) return '4-10';
    if (age <= 15) return '11-15';
    return '16-18';
  }
  if (stage === 2) return age <= 50 ? '18-50' : '51-100';
  if (stage === 3) return age <= 250 ? '100-250' : '251-500';
  return age < 5000 ? '500-5000' : '5000+';
}

export function pickEventForState(state: PlayerState, rng: RngFn): GameEvent {
  const stagePool = EVENTS_BY_STAGE[state.stage];
  const subKey = getSubStageKey(state.stage, state.age);
  const used = new Set(state.usedEventIds);

  // Special milestones at birth/exact Stage 1 thresholds
  if (state.stage === 1 && state.age === 0 && !used.has('ev_001')) {
    return stagePool.find((e) => e.id === 'ev_001') ?? stagePool[0];
  }
  if (state.stage === 1 && state.age === 18 && !used.has('ev_200')) {
    return stagePool.find((e) => e.id === 'ev_200') ?? stagePool[stagePool.length - 1];
  }

  let candidates = stagePool.filter((e) => e.subStage === subKey && !used.has(e.id));
  if (candidates.length === 0) {
    candidates = stagePool.filter((e) => !used.has(e.id));
  }
  if (candidates.length === 0) {
    // Pool exhausted: recycle repeatable events cleanly without returning undefined
    candidates = stagePool.filter((e) => e.subStage === subKey && !e.oneTime);
    if (candidates.length === 0) {
      candidates = stagePool.filter((e) => !e.oneTime);
    }
    if (candidates.length === 0) {
      candidates = stagePool;
    }
  }
  return pickRandom(candidates, rng);
}

function readStat(state: PlayerState, key: StatKey): number {
  switch (key) {
    case 'hp':
      return state.hp;
    case 'maxHp':
      return state.maxHp;
    case 'nhucThan':
      return state.nhucThan;
    case 'ngoTinh':
      return state.ngoTinh;
    case 'tamCanh':
      return state.tamCanh;
    case 'khiVan':
      return state.khiVan;
    case 'tuVi':
      return state.tuVi;
    case 'linhThach':
      return state.linhThach;
    case 'congDuc':
      return state.congDuc;
    case 'nghiepLuc':
      return state.nghiepLuc;
    case 'danDoc':
      return state.danDoc;
    case 'maxAge':
      return state.maxAge;
    case 'sectContribution':
      return state.sectContribution;
    case 'lawThoiGian':
      return state.laws.thoiGian;
    case 'lawKhongGian':
      return state.laws.khongGian;
    case 'lawNhanQua':
      return state.laws.nhanQua;
    case 'lawHonDon':
      return state.laws.honDon;
    case 'ancientProgress':
      return state.ancientProgress;
  }
}

export function canSelectChoice(state: PlayerState, choice: ChoiceOption): boolean {
  const req = choice.requirement;
  if (!req) return true;
  if (typeof req.minRealm === 'number' && state.realmIndex < req.minRealm) {
    return false;
  }
  if (req.daoAlignment && state.daoAlignment !== req.daoAlignment) {
    return false;
  }
  if (req.minStat) {
    for (const [k, minVal] of Object.entries(req.minStat)) {
      if (typeof minVal === 'number' && readStat(state, k as StatKey) < minVal) {
        return false;
      }
    }
  }
  return true;
}

export function computeChoiceSuccessChance(
  state: PlayerState,
  choice: ChoiceOption
): number {
  const luckDiff = (state.khiVan - 45) * 0.004;
  const statDiff = Math.min(0.12, (state.ngoTinh + state.tamCanh) * 0.0008);
  return clamp(choice.successRateBase + luckDiff + statDiff, 0.15, 0.98);
}

function getWorldTierForState(state: PlayerState): WorldTier {
  if (state.realmIndex >= 21) return 'than_gioi';
  if (state.realmIndex >= 11) return 'tien_gioi';
  return 'ha_gioi';
}

function filterByTier(pool: readonly LoreEntry[], tier: WorldTier): LoreEntry[] {
  const matching = pool.filter((item) => item.tier === tier);
  return matching.length > 0 ? matching : [...pool];
}

export function grantRewardFromPool(
  state: PlayerState,
  pool: string,
  rng: RngFn
): { state: PlayerState; rewardNote: string | null } {
  const worldTier = getWorldTierForState(state);
  let next = { ...state };

  const addItem = (entry: LoreEntry, category: ItemCategory) => {
    const existingIdx = next.inventory.findIndex(
      (i) => i.catalogId === entry.id && i.category === category
    );
    if (existingIdx >= 0 && (category === 'herb' || category === 'elixir')) {
      const updated = [...next.inventory];
      updated[existingIdx] = {
        ...updated[existingIdx],
        quantity: updated[existingIdx].quantity + 1,
      };
      next.inventory = updated;
    } else {
      const item = createInventoryItem(
        entry,
        category,
        `${next.age}_${next.inventory.length + 1}`
      );
      next.inventory = [...next.inventory, item];
    }
    next.codexUnlocked = unlockCodexIds(next.codexUnlocked, [entry.id]);
    return `Nhận được [${entry.name}]!`;
  };

  if (pool === 'herb') {
    const pick = pickRandom(filterByTier(HERBS, worldTier), rng);
    return { state: next, rewardNote: addItem(pick, 'herb') };
  }
  if (pool === 'elixir') {
    const pick = pickRandom(filterByTier(ELIXIRS, worldTier), rng);
    return { state: next, rewardNote: addItem(pick, 'elixir') };
  }
  if (pool === 'artifact') {
    const pick = pickRandom(filterByTier(ARTIFACTS, worldTier), rng);
    return { state: next, rewardNote: addItem(pick, 'artifact') };
  }
  if (pool === 'array') {
    const pick = pickRandom(filterByTier(ARRAYS, worldTier), rng);
    return { state: next, rewardNote: addItem(pick, 'array') };
  }
  if (pool === 'beast') {
    const pick = pickRandom(filterByTier(BEASTS, worldTier), rng);
    return { state: next, rewardNote: addItem(pick, 'beast') };
  }
  if (pool === 'relic') {
    const pick = pickRandom(SECT_RELICS, rng);
    return { state: next, rewardNote: addItem(pick, 'relic') };
  }
  if (pool === 'technique') {
    const candidates = filterByTier(TECHNIQUES, worldTier).filter(
      (t) => !next.learnedTechniqueIds.includes(t.id)
    );
    if (candidates.length > 0) {
      const pick = pickRandom(candidates, rng);
      next.learnedTechniqueIds = [...next.learnedTechniqueIds, pick.id];
      next.codexUnlocked = unlockCodexIds(next.codexUnlocked, [pick.id]);
      return { state: next, rewardNote: `Lĩnh ngộ công pháp [${pick.name}]!` };
    }
  }
  if (pool === 'ability') {
    const candidates = filterByTier(ABILITIES, worldTier).filter(
      (a) => !next.learnedAbilityIds.includes(a.id)
    );
    if (candidates.length > 0) {
      const pick = pickRandom(candidates, rng);
      next.learnedAbilityIds = [...next.learnedAbilityIds, pick.id];
      next.codexUnlocked = unlockCodexIds(next.codexUnlocked, [pick.id]);
      return { state: next, rewardNote: `Thức tỉnh thần thông [${pick.name}]!` };
    }
  }
  if (pool === 'companion') {
    const avail = filterByTier(COMPANIONS, worldTier).filter(
      (c) => !next.companions.some((owned) => owned.id === c.id)
    );
    if (avail.length > 0) {
      const pick = pickRandom(avail, rng);
      next.companions = [...next.companions, pick];
      next.codexUnlocked = unlockCodexIds(next.codexUnlocked, [pick.id]);
      return { state: next, rewardNote: `Kết duyên Đạo lữ [${pick.name}]!` };
    }
  }
  if (pool === 'friend') {
    const avail = filterByTier(FRIENDS, worldTier).filter(
      (f) => !next.friends.some((owned) => owned.id === f.id)
    );
    if (avail.length > 0) {
      const pick = pickRandom(avail, rng);
      next.friends = [...next.friends, pick];
      next.codexUnlocked = unlockCodexIds(next.codexUnlocked, [pick.id]);
      return { state: next, rewardNote: `Kết giao Bằng hữu [${pick.name}]!` };
    }
  }

  return { state: next, rewardNote: null };
}

export function applyStatDelta(
  state: PlayerState,
  delta: Partial<Record<StatKey, number>>
): PlayerState {
  let maxHp = Math.max(20, state.maxHp + (delta.maxHp ?? 0));
  let hp = clamp(state.hp + (delta.hp ?? 0), 0, maxHp);
  if ((delta.maxHp ?? 0) > 0 && (delta.hp ?? 0) === 0) {
    hp = clamp(hp + (delta.maxHp ?? 0), 0, maxHp);
  }
  const tuViBoost =
    (delta.tuVi ?? 0) > 0
      ? Math.round((delta.tuVi ?? 0) * (1 + (state.spiritRoot.speedMultiplier - 1) * 0.25))
      : delta.tuVi ?? 0;

  return {
    ...state,
    maxHp,
    hp,
    nhucThan: Math.max(1, state.nhucThan + (delta.nhucThan ?? 0)),
    ngoTinh: Math.max(1, state.ngoTinh + (delta.ngoTinh ?? 0)),
    tamCanh: Math.max(1, state.tamCanh + (delta.tamCanh ?? 0)),
    khiVan: clamp(state.khiVan + (delta.khiVan ?? 0), 0, 100),
    tuVi: Math.max(0, state.tuVi + tuViBoost),
    linhThach: Math.max(0, Math.round(state.linhThach + (delta.linhThach ?? 0))),
    congDuc: Math.max(0, state.congDuc + (delta.congDuc ?? 0)),
    nghiepLuc: Math.max(0, state.nghiepLuc + (delta.nghiepLuc ?? 0)),
    danDoc: clamp(state.danDoc + (delta.danDoc ?? 0), 0, 100),
    maxAge: Math.max(state.age + 1, state.maxAge + (delta.maxAge ?? 0)),
    sectContribution: Math.max(0, state.sectContribution + (delta.sectContribution ?? 0)),
    laws: {
      thoiGian: clamp(state.laws.thoiGian + (delta.lawThoiGian ?? 0), 0, 100),
      khongGian: clamp(state.laws.khongGian + (delta.lawKhongGian ?? 0), 0, 100),
      nhanQua: clamp(state.laws.nhanQua + (delta.lawNhanQua ?? 0), 0, 100),
      honDon: clamp(state.laws.honDon + (delta.lawHonDon ?? 0), 0, 100),
    },
    ancientProgress: clamp(state.ancientProgress + (delta.ancientProgress ?? 0), 0, 100),
  };
}

export function resolveChoice(
  state: PlayerState,
  event: GameEvent,
  choiceKey: 'A' | 'B' | 'C',
  rng: RngFn
): { nextState: PlayerState; success: boolean; outcomeText: string } {
  const choice = event.choices.find((c) => c.key === choiceKey) ?? event.choices[0];
  if (!canSelectChoice(state, choice)) {
    return {
      nextState: state,
      success: false,
      outcomeText: `Chưa đủ điều kiện (${choice.requirement?.label ?? 'Yêu cầu chưa đạt'}).`,
    };
  }

  const chance = computeChoiceSuccessChance(state, choice);
  const success = rng() <= chance;
  const outcome = success ? choice.onSuccess : choice.onFail;

  let next = applyStatDelta(state, outcome.statDelta);
  if (outcome.daoShift) {
    next.daoAlignment = outcome.daoShift;
  }

  let rewardMsg: string | null = null;
  if (success && outcome.rewardPool) {
    const granted = grantRewardFromPool(next, outcome.rewardPool, rng);
    next = granted.state;
    rewardMsg = granted.rewardNote;
  } else if (success && rng() < 0.16 && state.age >= 5) {
    const bonusPool =
      state.stage === 1 ? 'herb' : state.stage === 2 ? 'elixir' : 'artifact';
    const granted = grantRewardFromPool(next, bonusPool, rng);
    next = granted.state;
    rewardMsg = granted.rewardNote;
  }

  const fullText = rewardMsg ? `${outcome.narrative} ${rewardMsg}` : outcome.narrative;

  const usedSet = new Set(next.usedEventIds);
  usedSet.add(event.id);
  next.usedEventIds = Array.from(usedSet);
  next.currentEvent = null;
  next.logs = appendLog(next.logs, next.age, fullText, success ? 'good' : 'warn');

  if (next.hp <= 0) {
    next.ending = {
      id: 'death_injury',
      title: 'Trọng Thương Vẫn Lạc',
      summary: `Tại tuổi ${next.age}, đạo hữu kiệt quệ nguyên khí vì biến cố "${event.title}".`,
      type: 'death',
      daoQuaAwarded: Math.max(4, next.realmIndex * 5),
    };
    next.logs = appendLog(next.logs, next.age, next.ending.summary, 'danger');
  }

  return { nextState: next, success, outcomeText: fullText };
}

export function advanceTimeStep(state: PlayerState, rng: RngFn): PlayerState {
  if (state.ending) return state;

  const step = getStepYears(state);
  let nextAge = state.age + step;
  let next: PlayerState = {
    ...state,
    actionPoints: state.maxActionPoints,
    danDoc: Math.max(0, state.danDoc - Math.max(6, Math.round(step * 0.4))),
    hp: Math.min(state.maxHp, state.hp + Math.round(state.maxHp * 0.12)),
  };

  // Stage 2 Age-100 mortality gate when realmIndex < Trúc Cơ (index 2)
  if (state.age < 100 && nextAge >= 100 && state.realmIndex < 2 && nextAge >= state.maxAge) {
    const finalAge = Math.min(nextAge, state.maxAge);
    next.age = finalAge;
    next.currentEvent = null;
    next.ending = {
      id: 'death_age_100_gate',
      title: 'Mục Nát Nơi Phàm Trần (Cửa Ải Tuổi 100)',
      summary: `Chạm ngưỡng ${finalAge} tuổi nhưng chưa đột phá Trúc Cơ, thọ nguyên phàm trần đã cạn.`,
      type: 'death',
      daoQuaAwarded: Math.max(5, next.realmIndex * 5 + 3),
    };
    next.logs = appendLog(next.logs, finalAge, next.ending.summary, 'danger');
    return next;
  }

  // Lifespan Crisis clamping for Stage 2-4 mortals before hitting maxAge abruptly
  const finiteMaxAge = state.maxAge < 9_000_000_000_000;
  const crisisMargin = Math.max(25, Math.floor(step * 0.5));
  if (
    finiteMaxAge &&
    state.stage >= 2 &&
    !state.survivalCrisisActive &&
    nextAge >= state.maxAge - crisisMargin
  ) {
    const clampedAge = Math.min(nextAge, Math.max(state.age + 1, state.maxAge - 1));
    next.age = clampedAge;
    next.stage = getStageForAge(clampedAge);
    next.survivalCrisisActive = true;
    next.logs = appendLog(
      next.logs,
      clampedAge,
      `CẢNH BÁO ĐẠI HẠN: Thọ nguyên chỉ còn vài năm (${clampedAge}/${state.maxAge}). Hãy mở bảng Sinh Tồn để chọn Đoạt Xá, Luân Hồi hoặc Xác Ướp Chiến Lược!`,
      'danger'
    );
    next.currentEvent = pickEventForState(next, rng);
    return next;
  }

  // Check actual natural lifespan death if already past crisis or unstopped
  if (finiteMaxAge && nextAge >= state.maxAge) {
    next.age = state.maxAge;
    next.currentEvent = null;
    next.ending = {
      id: 'death_lifespan',
      title: 'Thọ Nguyên Cạn Kiệt — Hóa Đạo Quy Khư',
      summary: `Hưởng thọ ${state.maxAge} năm ở cảnh giới ${getRealmByIndex(state.realmIndex).name}, thần hồn tiêu tán giữa đất trời.`,
      type: 'death',
      daoQuaAwarded: Math.max(8, next.realmIndex * 7 + (state.ascendedLowerWorld ? 20 : 0)),
    };
    next.logs = appendLog(next.logs, next.age, next.ending.summary, 'danger');
    return next;
  }

  next.age = nextAge;
  next.stage = getStageForAge(nextAge);

  if (next.stage !== state.stage) {
    const stageTitles: Record<LifeStage, string> = {
      1: 'Hồng Trần Khởi Nguyên (0–18 tuổi)',
      2: 'Thiên Kiêu Tranh Phong (18–100 tuổi)',
      3: 'Mưu Đồ Vạn Giới (100–500 tuổi)',
      4: 'Nghịch Thiên Cải Mệnh (500+ tuổi)',
    };
    next.logs = appendLog(
      next.logs,
      next.age,
      `Bước sang Giai đoạn ${next.stage}: ${stageTitles[next.stage]}!`,
      'epic'
    );
  }

  // Periodic Stage 3 Spirit Stone Inflation & Mine Income
  if (next.stage === 3) {
    next.turnsInStage3 += 1;
    if (next.turnsInStage3 % 3 === 0) {
      const wave = 1.15 + rng() * 1.9;
      next.inflationMultiplier = clamp(Number(wave.toFixed(2)), 0.85, 4.0);
      next.logs = appendLog(
        next.logs,
        next.age,
        `Biến động Kinh tế Vạn Giới: Chỉ số Lạm phát Linh thạch đạt ${next.inflationMultiplier}x!`,
        next.inflationMultiplier >= 2 ? 'warn' : 'info'
      );
    }
    if (next.mineLevel > 0) {
      const income = Math.round(next.mineLevel * 220 * Math.max(1, next.inflationMultiplier));
      next.linhThach += income;
    }
  }

  // Stage 4 calamity countdown & periodic flavor weather
  if (next.stage === 4) {
    next.calamityCountdown = Math.max(0, next.calamityCountdown - 1);
    if (next.calamityCountdown === 0) {
      const cal = pickRandom(CALAMITIES, rng);
      next.codexUnlocked = unlockCodexIds(next.codexUnlocked, [cal.id]);
      next.logs = appendLog(
        next.logs,
        next.age,
        `CHU KỲ ĐẠI KIẾP SẮP GIÁNG LÂM: [${cal.name}] — Hãy chuẩn bị phòng hộ trong tab Thế Giới!`,
        'danger'
      );
      next.calamityCountdown = 5;
    }
  } else if (rng() < 0.22) {
    const w = pickRandom(WEATHER_PHENOMENA, rng);
    next.codexUnlocked = unlockCodexIds(next.codexUnlocked, [w.id]);
    next.logs = appendLog(
      next.logs,
      next.age,
      `Thiên tượng dị biến [${w.name}]: ${w.description}`,
      'warn'
    );
  }

  next.currentEvent = pickEventForState(next, rng);
  return next;
}
