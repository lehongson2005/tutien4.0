import {
  INNER_DEMONS,
  REALMS,
  TRIBULATIONS,
  getRealmByIndex,
} from '../data/catalog';
import type { BreakthroughTactic, PlayerState } from '../types/game';
import { appendLog, unlockCodexIds } from './character';
import { clamp, pickRandom, type RngFn } from './rng';

export function meditate(
  state: PlayerState,
  rng: RngFn
): { ok: boolean; nextState: PlayerState; gainedTuVi: number; message: string } {
  if (state.ending) {
    return { ok: false, nextState: state, gainedTuVi: 0, message: 'Kiếp sống đã khép lại.' };
  }
  if (state.actionPoints < 1) {
    return {
      ok: false,
      nextState: state,
      gainedTuVi: 0,
      message: 'Đã hết Điểm Hành Động trong lượt này. Hãy sống tiếp để hồi phục!',
    };
  }

  const base = Math.max(25, Math.round(state.tuViCap * 0.14));
  const techMult = 1 + Math.min(1.5, state.learnedTechniqueIds.length * 0.14);
  const homeMult = 1 + state.dongPhuLevel * 0.12 + state.sectRankOrder * 0.08;
  const companionMult = state.companions.length > 0 ? 1.15 : 1;
  const ngoTinhMult = 1 + Math.min(0.8, state.ngoTinh * 0.004);
  const danDocPenalty = state.danDoc >= 75 ? 0.65 : 1;
  const randomVariance = 0.9 + rng() * 0.25;

  const gained = Math.max(
    15,
    Math.round(
      base *
        state.spiritRoot.speedMultiplier *
        state.physique.tuViMultiplier *
        techMult *
        homeMult *
        companionMult *
        ngoTinhMult *
        danDocPenalty *
        randomVariance
    )
  );

  const bonusNgoTinh = rng() < 0.25 ? 1 : 0;
  let next: PlayerState = {
    ...state,
    actionPoints: state.actionPoints - 1,
    tuVi: state.tuVi + gained,
    ngoTinh: state.ngoTinh + bonusNgoTinh,
    hp: Math.min(state.maxHp, state.hp + Math.round(state.maxHp * 0.08)),
  };
  const msg = `Bế quan thổ nạp linh khí: Tu vi +${gained.toLocaleString('vi-VN')}${bonusNgoTinh ? ', Ngộ tính +1' : ''}.`;
  next.logs = appendLog(next.logs, next.age, msg, 'good');
  return { ok: true, nextState: next, gainedTuVi: gained, message: msg };
}

export function consumeElixir(
  state: PlayerState,
  itemUid: string
): { ok: boolean; nextState: PlayerState; message: string } {
  const idx = state.inventory.findIndex(
    (item) => item.uid === itemUid && item.category === 'elixir' && item.quantity > 0
  );
  if (idx < 0) {
    return { ok: false, nextState: state, message: 'Không tìm thấy đan dược hợp lệ.' };
  }

  const item = state.inventory[idx];
  const updatedInv = state.inventory
    .map((entry, i) => (i === idx ? { ...entry, quantity: entry.quantity - 1 } : entry))
    .filter((entry) => entry.quantity > 0);

  const lowName = item.name.toLowerCase();
  const lowDesc = item.description.toLowerCase();
  const isCleanse =
    lowName.includes('tẩy tủy') ||
    lowName.includes('giải độc') ||
    lowName.includes('thanh tâm') ||
    lowDesc.includes('tẩy tủy');
  const isLifespan =
    lowName.includes('thọ') ||
    lowName.includes('tục mệnh') ||
    lowName.includes('trường sinh') ||
    lowDesc.includes('thọ nguyên');
  const isHeal =
    lowName.includes('hồi') || lowName.includes('chữa') || lowDesc.includes('hồi phục');

  let nextDanDoc = state.danDoc;
  let nextHp = state.hp;
  let nextTuVi = state.tuVi;
  let nextMaxAge = state.maxAge;
  let extraMsg = '';

  const tierScale = item.tier === 'than_gioi' ? 4000 : item.tier === 'tien_gioi' ? 180 : 1;

  if (isCleanse) {
    nextDanDoc = Math.max(0, state.danDoc - 40);
    nextHp = Math.min(state.maxHp, state.hp + Math.round(state.maxHp * 0.25));
    extraMsg = 'Thanh lọc kinh mạch, Đan độc giảm mạnh (-40)!';
  } else {
    const cleanBody = state.physique.name.includes('Vạn Cổ Đan');
    nextDanDoc = clamp(state.danDoc + (cleanBody ? 4 : 18), 0, 100);
    if (isLifespan) {
      const yearsAdded = Math.max(40, 45 * tierScale);
      nextMaxAge += yearsAdded;
      extraMsg = `Thọ nguyên tăng thêm +${yearsAdded.toLocaleString('vi-VN')} năm!`;
    } else if (isHeal) {
      const healAmt = Math.round(state.maxHp * 0.45);
      nextHp = Math.min(state.maxHp, state.hp + healAmt);
      extraMsg = `Hồi phục +${healAmt} HP.`;
    } else {
      const tuViGain = Math.max(80, Math.round(state.tuViCap * 0.24));
      nextTuVi += tuViGain;
      nextHp = Math.min(state.maxHp, state.hp + Math.round(state.maxHp * 0.15));
      extraMsg = `Hấp thụ dược lực: Tu vi +${tuViGain.toLocaleString('vi-VN')}.`;
    }
  }

  let backlashNote = '';
  if (nextDanDoc > 85) {
    const dmg = Math.max(12, Math.round(state.maxHp * 0.2));
    nextHp = Math.max(1, nextHp - dmg);
    backlashNote = ` Cảnh báo: Đan độc tích tụ quá ngưỡng (${nextDanDoc}%), phản phệ -${dmg} HP!`;
  }

  const msg = `Dùng [${item.name}]: ${extraMsg}${backlashNote}`;
  const next: PlayerState = {
    ...state,
    inventory: updatedInv,
    danDoc: nextDanDoc,
    hp: nextHp,
    tuVi: nextTuVi,
    maxAge: nextMaxAge,
    logs: appendLog(state.logs, state.age, msg, backlashNote ? 'warn' : 'good'),
  };
  return { ok: true, nextState: next, message: msg };
}

export function purifyDanDoc(state: PlayerState): {
  ok: boolean;
  nextState: PlayerState;
  message: string;
} {
  if (state.actionPoints < 1) {
    return {
      ok: false,
      nextState: state,
      message: 'Cần 1 Điểm Hành Động để vận công bài độc.',
    };
  }
  const nextDanDoc = Math.max(0, state.danDoc - 35);
  const heal = Math.round(state.maxHp * 0.1);
  const next: PlayerState = {
    ...state,
    actionPoints: state.actionPoints - 1,
    danDoc: nextDanDoc,
    hp: Math.min(state.maxHp, state.hp + heal),
    logs: appendLog(
      state.logs,
      state.age,
      `Vận công trục xuất tạp chất, Đan độc còn ${nextDanDoc}%.`,
      'good'
    ),
  };
  return { ok: true, nextState: next, message: `Đã thanh lọc đan độc (còn ${nextDanDoc}%).` };
}

export function attemptBreakthrough(
  state: PlayerState,
  tactic: BreakthroughTactic,
  rng: RngFn
): {
  ok: boolean;
  success: boolean;
  nextState: PlayerState;
  demonName: string | null;
  tribulationName: string | null;
  tribulationDamage: number;
  message: string;
} {
  if (state.ending) {
    return {
      ok: false,
      success: false,
      nextState: state,
      demonName: null,
      tribulationName: null,
      tribulationDamage: 0,
      message: 'Kiếp sống đã kết thúc.',
    };
  }
  if (state.realmIndex >= REALMS.length - 1) {
    return {
      ok: false,
      success: false,
      nextState: state,
      demonName: null,
      tribulationName: null,
      tribulationDamage: 0,
      message: 'Đã đạt tới Siêu Thoát Cảnh đỉnh cao!',
    };
  }
  if (state.tuVi < state.tuViCap) {
    return {
      ok: false,
      success: false,
      nextState: state,
      demonName: null,
      tribulationName: null,
      tribulationDamage: 0,
      message: `Chưa đủ Tu vi đột phá (${state.tuVi}/${state.tuViCap}).`,
    };
  }

  const nextRealm = getRealmByIndex(state.realmIndex + 1);
  let next = { ...state };
  let demonName: string | null = null;
  let tribulationName: string | null = null;
  let tribulationDamage = 0;

  // Consume Độ Kiếp Đan / Tâm Ma Đan if chosen and available
  let hasBreakthroughElixir = false;
  if (tactic.useDoKiepDan || tactic.innerDemon === 'uong_dan') {
    const elIdx = next.inventory.findIndex((i) => i.category === 'elixir' && i.quantity > 0);
    if (elIdx >= 0) {
      hasBreakthroughElixir = true;
      next.inventory = next.inventory
        .map((e, idx) => (idx === elIdx ? { ...e, quantity: e.quantity - 1 } : e))
        .filter((e) => e.quantity > 0);
    }
  }

  // Phase 1: Tâm Ma Kiếp (Trúc Cơ+)
  if (nextRealm.requiresTamMa) {
    const demon = pickRandom(INNER_DEMONS, rng);
    demonName = demon.name;
    next.codexUnlocked = unlockCodexIds(next.codexUnlocked, [demon.id]);

    let demonPassChance = 0.62 + next.tamCanh * 0.004 + next.khiVan * 0.0015;
    if (tactic.innerDemon === 'uong_dan' && hasBreakthroughElixir) demonPassChance += 0.2;
    if (tactic.innerDemon === 'nho_dao_lu' && next.companions.length > 0) demonPassChance += 0.22;
    if (next.fate.name.includes('Sủng Nhi')) demonPassChance += 0.1;

    if (rng() > clamp(demonPassChance, 0.25, 0.96)) {
      const dmg = Math.max(15, Math.round(next.maxHp * 0.28));
      next.hp = Math.max(1, next.hp - dmg);
      next.tuVi = Math.max(0, Math.round(next.tuVi * 0.78));
      const failMsg = `Đột phá ${nextRealm.name} thất bại vì [${demon.name}]! Tụt Tu vi & -${dmg} HP.`;
      next.logs = appendLog(next.logs, next.age, failMsg, 'danger');
      return {
        ok: true,
        success: false,
        nextState: next,
        demonName,
        tribulationName: null,
        tribulationDamage: dmg,
        message: failMsg,
      };
    }
  }

  // Phase 2: Lôi Kiếp (Kim Đan+)
  if (nextRealm.requiresLoiKiep) {
    const tierTribs = TRIBULATIONS.filter((t) => t.tier === nextRealm.tier);
    const trib = pickRandom(tierTribs.length > 0 ? tierTribs : TRIBULATIONS, rng);
    tribulationName = trib.name;
    next.codexUnlocked = unlockCodexIds(next.codexUnlocked, [trib.id]);

    const rawLightning = Math.round(next.maxHp * 0.52 + next.nghiepLuc * 1.4);
    const bodyMitigation = next.nhucThan * 1.8 + next.congDuc * 1.1;
    let multiplier = 1;
    if (tactic.useArrayDefense && next.activeArrayUid) multiplier *= 0.68;
    if (tactic.useDoKiepDan && hasBreakthroughElixir) multiplier *= 0.72;
    if (next.fate.name.includes('Sủng Nhi')) multiplier *= 0.65;
    if (next.origin.name.includes('Sét Đánh Không Chết')) multiplier *= 0.15;

    tribulationDamage = Math.max(
      10,
      Math.round(Math.max(15, rawLightning - bodyMitigation) * multiplier)
    );

    if (tribulationDamage >= next.hp) {
      next.hp = Math.max(1, Math.round(next.maxHp * 0.12));
      next.tuVi = Math.max(0, Math.round(next.tuVi * 0.72));
      const failMsg = `Không chống nổi thiên uy [${trib.name}] (${tribulationDamage} sát thương)! Kinh mạch tổn thương nặng.`;
      next.logs = appendLog(next.logs, next.age, failMsg, 'danger');
      return {
        ok: true,
        success: false,
        nextState: next,
        demonName,
        tribulationName,
        tribulationDamage,
        message: failMsg,
      };
    }
    next.hp -= tribulationDamage;
  }

  // Breakthrough Success!
  const remainingTuVi = Math.max(0, next.tuVi - next.tuViCap);
  const newMaxHp = Math.round(next.maxHp * 1.55 + nextRealm.index * 80);
  const thoTinhMult = next.fate.name.includes('Thọ Tinh') ? 1.4 : 1;
  const targetMaxAge = Math.round(nextRealm.maxAge * thoTinhMult);

  next = {
    ...next,
    realmIndex: nextRealm.index,
    tuVi: remainingTuVi,
    tuViCap: nextRealm.tuViCap,
    maxHp: newMaxHp,
    hp: newMaxHp,
    nhucThan: next.nhucThan + 6 + nextRealm.index * 2,
    ngoTinh: next.ngoTinh + 4 + nextRealm.index,
    tamCanh: next.tamCanh + 5 + nextRealm.index,
    maxAge: Math.max(next.maxAge, targetMaxAge),
    survivalCrisisActive: false,
    codexUnlocked: unlockCodexIds(next.codexUnlocked, [nextRealm.id]),
  };

  if (nextRealm.index >= 11 && !next.ascendedLowerWorld) {
    next.ascendedLowerWorld = true;
    next.logs = appendLog(
      next.logs,
      next.age,
      `PHI THĂNG TIÊN GIỚI! Đột phá [${nextRealm.name}] thành công — Mở khóa bản đồ Tiên Giới & Tiên Thạch!`,
      'epic'
    );
  }

  if (nextRealm.index >= 30) {
    next.ending = {
      id: 'victory_sieu_thoat',
      title: 'Siêu Thoát Cảnh — Vô Thượng Chân Tự Tại',
      summary: `Tại tuổi ${next.age}, đạo hữu nhảy ra khỏi mọi dòng thời gian và quy luật đa vũ trụ, đạt đại viên mãn tối thượng!`,
      type: 'victory',
      daoQuaAwarded: 150,
    };
  }

  const okMsg = `Đột phá thành công lên [${nextRealm.name}]! Thọ nguyên tối đa nâng lên ${next.maxAge.toLocaleString('vi-VN')} năm.${tribulationName ? ` (Đã vượt ${tribulationName}, chịu ${tribulationDamage} sát thương).` : ''}`;
  next.logs = appendLog(next.logs, next.age, okMsg, 'epic');

  return {
    ok: true,
    success: true,
    nextState: next,
    demonName,
    tribulationName,
    tribulationDamage,
    message: okMsg,
  };
}
