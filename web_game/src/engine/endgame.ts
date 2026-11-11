import {
  ABILITIES,
  ANCIENT_TEXTS,
  CALAMITIES,
  OUTER_ENEMIES,
  REALMS,
  getRealmByIndex,
} from '../data/catalog';
import type {
  CombatTactic,
  PlayerLaws,
  PlayerState,
  ReincarnationLegacy,
} from '../types/game';
import { appendLog, calculateCombatPower, unlockCodexIds } from './character';
import { clamp, pickRandom, type RngFn } from './rng';

export const LAW_LABELS: Record<keyof PlayerLaws, string> = {
  thoiGian: 'Quy Luật Thời Gian',
  khongGian: 'Quy Luật Không Gian',
  nhanQua: 'Quy Luật Nhân Quả',
  honDon: 'Quy Luật Hỗn Độn',
};

export function comprehendLaw(
  state: PlayerState,
  lawKey: keyof PlayerLaws,
  rng: RngFn
): { ok: boolean; nextState: PlayerState; message: string } {
  if (state.actionPoints < 1) {
    return { ok: false, nextState: state, message: 'Cần 1 Điểm Hành Động để tham ngộ Quy luật.' };
  }
  if (state.stage < 4 && state.realmIndex < 5) {
    return {
      ok: false,
      nextState: state,
      message: 'Cần bước vào Giai đoạn 4 (500+ tuổi) hoặc Hóa Thần Cảnh mới cảm ứng nổi Quy luật!',
    };
  }
  const currentVal = state.laws[lawKey];
  if (currentVal >= 100) {
    return { ok: false, nextState: state, message: `${LAW_LABELS[lawKey]} đã đạt viên mãn 100%!` };
  }

  const gain = Math.round(7 + Math.min(10, state.ngoTinh * 0.04) + rng() * 5);
  const nextVal = clamp(currentVal + gain, 0, 100);
  const tuViGain = Math.max(400, Math.round(state.tuViCap * 0.18));
  const msg = `Tham ngộ [${LAW_LABELS[lawKey]}]: +${gain}% (hiện ${nextVal}%), Tu vi +${tuViGain.toLocaleString('vi-VN')}.`;

  return {
    ok: true,
    nextState: {
      ...state,
      actionPoints: state.actionPoints - 1,
      laws: { ...state.laws, [lawKey]: nextVal },
      tuVi: state.tuVi + tuViGain,
      logs: appendLog(state.logs, state.age, msg, 'epic'),
    },
    message: msg,
  };
}

export function decipherAncientScript(
  state: PlayerState,
  ancientId: string,
  rng: RngFn
): { ok: boolean; nextState: PlayerState; message: string } {
  if (state.actionPoints < 1) {
    return { ok: false, nextState: state, message: 'Cần 1 Điểm Hành Động để giải mã cổ văn.' };
  }
  if (state.ngoTinh < 30) {
    return {
      ok: false,
      nextState: state,
      message: 'Cần Ngộ tính ≥ 30 để không bị Thái Cổ Thần Văn phản phệ thần hồn.',
    };
  }
  const textEntry = ANCIENT_TEXTS.find((a) => a.id === ancientId) ?? ANCIENT_TEXTS[0];
  const progressGain = 12 + Math.floor(rng() * 10);
  const nextProgress = clamp(state.ancientProgress + progressGain, 0, 100);

  let next = {
    ...state,
    actionPoints: state.actionPoints - 1,
    ancientProgress: nextProgress,
    ngoTinh: state.ngoTinh + 4,
    decipheredAncientIds: state.decipheredAncientIds.includes(textEntry.id)
      ? state.decipheredAncientIds
      : [...state.decipheredAncientIds, textEntry.id],
    codexUnlocked: unlockCodexIds(state.codexUnlocked, [textEntry.id]),
  };

  let extraNote = '';
  const unlearned = ABILITIES.filter((a) => !next.learnedAbilityIds.includes(a.id));
  if (unlearned.length > 0 && rng() < 0.4) {
    const ab = pickRandom(unlearned, rng);
    next.learnedAbilityIds = [...next.learnedAbilityIds, ab.id];
    next.codexUnlocked = unlockCodexIds(next.codexUnlocked, [ab.id]);
    extraNote = ` Ngộ ra Thần thông thượng cổ [${ab.name}]!`;
  }

  const msg = `Bóc tách [${textEntry.name}]: Tiến độ văn tự cổ ${nextProgress}% (+${progressGain}%).${extraNote}`;
  next.logs = appendLog(next.logs, next.age, msg, 'epic');
  return { ok: true, nextState: next, message: msg };
}

export function faceCosmicCalamity(
  state: PlayerState,
  targetId: string,
  tactic: CombatTactic,
  rng: RngFn
): { ok: boolean; victory: boolean; nextState: PlayerState; message: string } {
  if (state.actionPoints < 1) {
    return {
      ok: false,
      victory: false,
      nextState: state,
      message: 'Cần 1 Điểm Hành Động để nghênh chiến kiếp nạn.',
    };
  }

  const foe =
    CALAMITIES.find((c) => c.id === targetId) ??
    OUTER_ENEMIES.find((o) => o.id === targetId) ??
    CALAMITIES[0];

  let next: PlayerState = {
    ...state,
    actionPoints: state.actionPoints - 1,
    codexUnlocked: unlockCodexIds(state.codexUnlocked, [foe.id]),
  };

  if (tactic === 'rut_lui') {
    const msg = `Thu liễm khí tức né tránh mũi nhọn của [${foe.name}], bảo toàn đạo cơ.`;
    next.logs = appendLog(next.logs, next.age, msg, 'info');
    return { ok: true, victory: true, nextState: next, message: msg };
  }

  const lawAvg =
    (next.laws.thoiGian + next.laws.khongGian + next.laws.nhanQua + next.laws.honDon) / 4;
  const power = calculateCombatPower(next);
  const relicBonus = next.inventory.some((i) => i.category === 'relic') ? 1.35 : 1;
  const arrayBonus = tactic === 'tran_phap' && next.activeArrayUid ? 1.25 : 1;

  const winChance = clamp(
    0.35 + lawAvg * 0.005 + (power * relicBonus * arrayBonus) / 250_000,
    0.2,
    0.95
  );
  const victory = rng() <= winChance;

  if (victory) {
    const tuViReward = Math.max(2500, Math.round(next.tuViCap * 0.35));
    next.tuVi += tuViReward;
    next.congDuc += 40;
    next.khiVan = clamp(next.khiVan + 5, 0, 100);

    const isUltimateSimCollapse =
      foe.name.includes('Giả Lập Sụp Đổ') && lawAvg >= 50;
    if (isUltimateSimCollapse) {
      next.ending = {
        id: 'victory_simulation_break',
        title: 'Phá Vỡ Giả Lập — Chân Ngã Vĩnh Hằng',
        summary: `Đạo hữu đã chinh phục đại kiếp tối cao [${foe.name}], đánh thức Bản Nguyên Thần Quy và bước ra khỏi giới hạn vũ trụ!`,
        type: 'victory',
        daoQuaAwarded: 200,
      };
    }

    const msg = `Chống đỡ thành công [${foe.name}]! Công đức +40, Tu vi +${tuViReward.toLocaleString('vi-VN')}!`;
    next.logs = appendLog(next.logs, next.age, msg, 'epic');
    return { ok: true, victory: true, nextState: next, message: msg };
  }

  const dmg = Math.max(40, Math.round(next.maxHp * 0.3));
  next.hp = Math.max(1, next.hp - dmg);
  const failMsg = `Bị [${foe.name}] đánh lui (-${dmg} HP)! Hãy lĩnh ngộ thêm Quy luật & mang Chí Bảo Trấn Phái.`;
  next.logs = appendLog(next.logs, next.age, failMsg, 'danger');
  return { ok: true, victory: false, nextState: next, message: failMsg };
}

export function triggerBodyPossession(
  state: PlayerState,
  rng: RngFn
): { ok: boolean; success: boolean; nextState: PlayerState; message: string } {
  if (state.hasUsedDoatXa) {
    return {
      ok: false,
      success: false,
      nextState: state,
      message: 'Thần hồn chỉ chịu nổi Đoạt Xá đúng 1 lần duy nhất trong một đời!',
    };
  }
  if (state.realmIndex < 2) {
    return {
      ok: false,
      success: false,
      nextState: state,
      message: 'Cần tối thiểu cảnh giới Trúc Cơ để nguyên thần rời xác Đoạt Xá.',
    };
  }

  const chance = clamp(0.45 + state.tamCanh * 0.003 + state.ngoTinh * 0.002, 0.25, 0.92);
  const success = rng() <= chance;

  if (!success) {
    const ending = {
      id: 'death_doat_xa_fail',
      title: 'Đoạt Xá Thất Bại — Hồn Phi Phách Tán',
      summary: `Thân xác mới phản kháng kịch liệt, thần hồn tiêu tan tại tuổi ${state.age}.`,
      type: 'death' as const,
      daoQuaAwarded: Math.max(10, state.realmIndex * 5),
    };
    return {
      ok: true,
      success: false,
      nextState: {
        ...state,
        hasUsedDoatXa: true,
        hp: 0,
        ending,
        logs: appendLog(state.logs, state.age, ending.summary, 'danger'),
      },
      message: ending.summary,
    };
  }

  const droppedRealmIdx = Math.max(1, state.realmIndex - 2);
  const targetRealm = getRealmByIndex(droppedRealmIdx);
  const thoTinhMult = state.fate.name.includes('Thọ Tinh') ? 1.4 : 1;
  const newMaxAge = Math.round(targetRealm.maxAge * thoTinhMult);

  const msg = `ĐOẠT XÁ THÀNH CÔNG! Tái sinh vào thân xác thiên tài 18 tuổi, giữ lại công pháp & quy luật (tu vi tụt 2 bậc còn [${targetRealm.name}], bị Trấn Thế Minh truy xét)!`;
  const next: PlayerState = {
    ...state,
    age: 18,
    stage: 2,
    maxAge: Math.max(120, newMaxAge),
    realmIndex: droppedRealmIdx,
    tuVi: Math.round(targetRealm.tuViCap * 0.2),
    tuViCap: targetRealm.tuViCap,
    hp: state.maxHp,
    hasUsedDoatXa: true,
    wantedByTranTheMinh: true,
    survivalCrisisActive: false,
    nghiepLuc: state.nghiepLuc + 45,
    logs: appendLog(state.logs, 18, msg, 'epic'),
  };
  return { ok: true, success: true, nextState: next, message: msg };
}

export function triggerCryoHibernation(state: PlayerState): {
  ok: boolean;
  nextState: PlayerState;
  message: string;
} {
  if (state.realmIndex < 3 && state.dongPhuLevel < 1) {
    return {
      ok: false,
      nextState: state,
      message: 'Cần đạt Kim Đan Cảnh hoặc có Động Phủ hộ trận mới phong ấn làm Xác Ướp Chiến Lược!',
    };
  }

  const sleepYears = 500;
  const nextAge = state.age + sleepYears;
  const nextMaxAge = state.maxAge + sleepYears;
  const passiveTuVi = Math.max(500, Math.round(state.tuViCap * 0.35));

  const msg = `XÁC ƯỚP CHIẾN LƯỢC: Phong ấn vào băng quan ${sleepYears} năm, đóng băng tiêu hao thọ nguyên! Tỉnh dậy khi tông môn cần hộ đạo (Tu vi +${passiveTuVi.toLocaleString('vi-VN')}).`;
  const next: PlayerState = {
    ...state,
    age: nextAge,
    maxAge: nextMaxAge,
    stage: 4,
    cryoSleepCycles: state.cryoSleepCycles + 1,
    survivalCrisisActive: false,
    tuVi: state.tuVi + passiveTuVi,
    hp: state.maxHp,
    logs: appendLog(state.logs, nextAge, msg, 'epic'),
  };
  return { ok: true, nextState: next, message: msg };
}

export function triggerReincarnation(
  state: PlayerState,
  legacy: ReincarnationLegacy,
  inheritedTechniqueId?: string
): ReincarnationLegacy {
  const earnedPoints =
    10 +
    state.realmIndex * 5 +
    (state.ascendedLowerWorld ? 20 : 0) +
    (state.ending?.daoQuaAwarded ?? 0);

  const chosenTech =
    inheritedTechniqueId && state.learnedTechniqueIds.includes(inheritedTechniqueId)
      ? [inheritedTechniqueId]
      : state.learnedTechniqueIds.slice(0, 1);

  const nextCodex = new Set([...legacy.unlockedCodexIds, ...state.codexUnlocked]);
  const nextEndings = new Set(legacy.completedEndings);
  if (state.ending) nextEndings.add(state.ending.id);

  return {
    rebirthCount: legacy.rebirthCount + 1,
    daoQuaPoints: legacy.daoQuaPoints + earnedPoints,
    inheritedTechniqueIds: chosenTech,
    unlockedCodexIds: Array.from(nextCodex),
    bestRealmIndex: Math.max(legacy.bestRealmIndex, state.realmIndex, REALMS[0].index),
    completedEndings: Array.from(nextEndings),
  };
}
