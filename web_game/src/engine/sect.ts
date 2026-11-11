import {
  ABILITIES,
  ARTIFACTS,
  BEASTS,
  HERBS,
  RANKINGS,
  REGIONS,
  SECRET_REALMS,
  SECTS,
  SECT_RANKS,
  SECT_RELICS,
  TECHNIQUES,
  VEHICLES,
} from '../data/catalog';
import type { CombatTactic, LoreEntry, PlayerState } from '../types/game';
import {
  appendLog,
  calculateCombatPower,
  createInventoryItem,
  unlockCodexIds,
} from './character';
import { clamp, pickRandom, type RngFn } from './rng';

export function joinSect(
  state: PlayerState,
  sectId: string
): { ok: boolean; nextState: PlayerState; message: string } {
  const sect = SECTS.find((s) => s.id === sectId);
  if (!sect) return { ok: false, nextState: state, message: 'Tông môn không tồn tại.' };

  const power = calculateCombatPower(state);
  const req = sect.tier === 'than_gioi' ? 100000 : sect.tier === 'tien_gioi' ? 6000 : 40;
  if (power < req && state.realmIndex < 1) {
    // Allow low tier sects anytime for Ha Gioi, restrict high tier
    if (sect.tier !== 'ha_gioi') {
      return {
        ok: false,
        nextState: state,
        message: `Thực lực chưa đủ gia nhập thế lực ${sect.tier}.`,
      };
    }
  }

  const initialRank = Math.max(1, Math.min(4, state.realmIndex + 1));
  const msg = `Chính thức bái nhập [${sect.name}] (Cấp bậc: ${SECT_RANKS[initialRank - 1]?.name ?? 'Đệ tử'})!`;

  const next: PlayerState = {
    ...state,
    isTanTu: false,
    sectId: sect.id,
    sectName: sect.name,
    sectFaction: sect.faction ?? 'trung_lap',
    sectRankOrder: initialRank,
    sectContribution: Math.max(state.sectContribution, 50),
    codexUnlocked: unlockCodexIds(state.codexUnlocked, [sect.id]),
    logs: appendLog(state.logs, state.age, msg, 'epic'),
  };
  return { ok: true, nextState: next, message: msg };
}

export function chooseTanTuPath(state: PlayerState): {
  ok: boolean;
  nextState: PlayerState;
  message: string;
} {
  const nextLevel = state.dongPhuLevel + 1;
  const cost = nextLevel > 1 ? nextLevel * 120 : 0;
  if (state.linhThach < cost) {
    return { ok: false, nextState: state, message: `Cần ${cost} linh thạch mở rộng Động phủ.` };
  }

  const msg =
    nextLevel === 1
      ? 'Gia nhập Tán Tu Liên Minh & khai phá Động Phủ riêng tại linh mạch ẩn thế!'
      : `Nâng cấp Tán Tu Động Phủ lên cấp ${nextLevel} (tăng hiệu suất Bế quan & bảo vệ khi Bế quan/Xác ướp)!`;

  return {
    ok: true,
    nextState: {
      ...state,
      isTanTu: true,
      sectId: state.sectId === 'sect_custom' ? state.sectId : null,
      sectName: state.sectId === 'sect_custom' ? state.sectName : 'Tán Tu Liên Minh',
      dongPhuLevel: nextLevel,
      linhThach: state.linhThach - cost,
      logs: appendLog(state.logs, state.age, msg, 'good'),
    },
    message: msg,
  };
}

export function foundOwnSect(
  state: PlayerState,
  customName: string
): { ok: boolean; nextState: PlayerState; message: string } {
  const clean = customName.trim();
  if (!clean) {
    return { ok: false, nextState: state, message: 'Hãy đặt tên cho tông môn mới.' };
  }
  if (state.realmIndex < 3) {
    return {
      ok: false,
      nextState: state,
      message: 'Cần đạt tối thiểu Kim Đan Cảnh mới đủ uy vọng khai tông lập phái!',
    };
  }
  const cost = 2000;
  if (state.linhThach < cost) {
    return {
      ok: false,
      nextState: state,
      message: `Cần ${cost} linh thạch để dựng sơn môn.`,
    };
  }

  const msg = `KHAI TÔNG LẬP PHÁI: Thành lập [${clean}]! Đạo hữu trở thành Thái Thượng Lão Tổ / Chưởng Môn!`;
  return {
    ok: true,
    nextState: {
      ...state,
      isTanTu: false,
      sectId: 'sect_custom',
      sectName: clean,
      sectFaction: state.daoAlignment,
      sectRankOrder: SECT_RANKS.length, // 11 = Supreme Elder / Master
      mineLevel: Math.max(1, state.mineLevel),
      linhThach: state.linhThach - cost,
      codexUnlocked: unlockCodexIds(state.codexUnlocked, [SECT_RELICS[0].id]),
      logs: appendLog(state.logs, state.age, msg, 'epic'),
    },
    message: msg,
  };
}

export function promoteSectRank(state: PlayerState): {
  ok: boolean;
  nextState: PlayerState;
  message: string;
} {
  if (!state.sectId) {
    return { ok: false, nextState: state, message: 'Hãy gia nhập tông môn trước hoặc nâng cấp Động phủ.' };
  }
  const nextOrder = state.sectRankOrder + 1;
  const targetRank = SECT_RANKS.find((r) => r.rankOrder === nextOrder);
  if (!targetRank) {
    return { ok: false, nextState: state, message: 'Đã đứng trên đỉnh cao quyền lực tông môn!' };
  }
  const reqContrib = targetRank.rankOrder * 45;
  if (state.realmIndex < targetRank.minRealm) {
    return {
      ok: false,
      nextState: state,
      message: `Cần cảnh giới cao hơn (yêu cầu bậc ${targetRank.minRealm}) để thăng lên ${targetRank.name}.`,
    };
  }
  if (state.sectContribution < reqContrib) {
    return {
      ok: false,
      nextState: state,
      message: `Cần ${reqContrib} điểm cống hiến tông môn.`,
    };
  }

  const msg = `Thăng chức trong tông môn lên [${targetRank.name}]!`;
  return {
    ok: true,
    nextState: {
      ...state,
      sectRankOrder: targetRank.rankOrder,
      sectContribution: state.sectContribution - reqContrib,
      logs: appendLog(state.logs, state.age, msg, 'epic'),
    },
    message: msg,
  };
}

export function manageSectMine(
  state: PlayerState,
  rng: RngFn
): { ok: boolean; nextState: PlayerState; message: string } {
  if (state.actionPoints < 1) {
    return { ok: false, nextState: state, message: 'Cần 1 Điểm Hành Động để khai thác mỏ / linh mạch.' };
  }
  const nextLevel = Math.max(1, state.mineLevel + 1);
  const harvest = Math.round(
    (220 + nextLevel * 180 + state.realmIndex * 90) *
      Math.max(1, state.inflationMultiplier) *
      (0.85 + rng() * 0.4)
  );
  const msg = state.sectId
    ? `Điều hành Mỏ Linh Thạch (Cấp ${nextLevel}): Thu hoạch ${harvest.toLocaleString('vi-VN')} linh thạch, +30 cống hiến!`
    : `Khai phá Linh Mạch Động Phủ (Cấp ${nextLevel}): Thu hoạch ${harvest.toLocaleString('vi-VN')} linh thạch!`;

  return {
    ok: true,
    nextState: {
      ...state,
      actionPoints: state.actionPoints - 1,
      mineLevel: nextLevel,
      linhThach: state.linhThach + harvest,
      sectContribution: state.sectContribution + 30,
      logs: appendLog(state.logs, state.age, msg, 'good'),
    },
    message: msg,
  };
}

export function stealProdigyLuck(
  state: PlayerState,
  rng: RngFn
): { ok: boolean; nextState: PlayerState; message: string } {
  if (state.actionPoints < 1) {
    return { ok: false, nextState: state, message: 'Cần 1 Điểm Hành Động.' };
  }
  if (state.realmIndex < 2 && state.stage < 3) {
    return {
      ok: false,
      nextState: state,
      message: 'Cần đạt tối thiểu Trúc Cơ hoặc Giai đoạn 3 mới dùng được bí thuật Tước Đoạt Khí Vận.',
    };
  }

  const gainedLuck = 8 + Math.floor(rng() * 8);
  const gainedStones = Math.round((450 + state.realmIndex * 260) * Math.max(1, state.inflationMultiplier));
  const gainedTuVi = Math.round(state.tuViCap * 0.25);

  const msg = `Hắc Ám Mưu Đồ: Tước đoạt Khí vận của thiên tài trẻ! Khí vận +${gainedLuck}, Tu vi +${gainedTuVi}, Linh thạch +${gainedStones}, Nghiệp lực +35!`;
  return {
    ok: true,
    nextState: {
      ...state,
      actionPoints: state.actionPoints - 1,
      khiVan: clamp(state.khiVan + gainedLuck, 0, 100),
      linhThach: state.linhThach + gainedStones,
      tuVi: state.tuVi + gainedTuVi,
      nghiepLuc: state.nghiepLuc + 35,
      daoAlignment:
        state.daoAlignment === 'chua_chon' || state.daoAlignment === 'trung_lap'
          ? 'nghich_thien'
          : state.daoAlignment,
      logs: appendLog(state.logs, state.age, msg, 'warn'),
    },
    message: msg,
  };
}

export function exploreSecretRealm(
  state: PlayerState,
  secretRealmId: string,
  tactic: CombatTactic,
  rng: RngFn
): { ok: boolean; victory: boolean; nextState: PlayerState; message: string } {
  if (state.actionPoints < 1) {
    return {
      ok: false,
      victory: false,
      nextState: state,
      message: 'Cần 1 Điểm Hành Động để tiến vào Bí Cảnh.',
    };
  }
  const realm = SECRET_REALMS.find((s) => s.id === secretRealmId) ?? SECRET_REALMS[0];
  let next: PlayerState = {
    ...state,
    actionPoints: state.actionPoints - 1,
    codexUnlocked: unlockCodexIds(state.codexUnlocked, [realm.id]),
  };

  if (tactic === 'rut_lui') {
    const minorStones = 35 * Math.max(1, state.realmIndex);
    const msg = `Khám phá ngoại vi [${realm.name}] rồi rút lui bảo toàn: thu ${minorStones} linh thạch.`;
    next.linhThach += minorStones;
    next.logs = appendLog(next.logs, next.age, msg, 'info');
    return { ok: true, victory: true, nextState: next, message: msg };
  }

  const power = calculateCombatPower(next);
  const diff =
    realm.tier === 'than_gioi' ? 250_000 : realm.tier === 'tien_gioi' ? 8_000 : 110;
  let tacticBonus = 1;
  if (tactic === 'phap_bao' && next.equippedArtifactUid) tacticBonus = 1.35;
  if (tactic === 'tran_phap' && next.activeArrayUid) tacticBonus = 1.35;
  if (tactic === 'hop_kich' && (next.companions.length > 0 || next.activeBeastUid)) {
    tacticBonus = 1.4;
  }

  const winChance = clamp(0.45 + (power * tacticBonus) / Math.max(1, diff * 2.2), 0.2, 0.94);
  const victory = rng() <= winChance;

  if (victory) {
    const tierMatches = (pool: readonly LoreEntry[]) => {
      const m = pool.filter((x) => x.tier === realm.tier);
      return m.length > 0 ? m : [...pool];
    };
    const rollType = rng();
    let dropEntry: LoreEntry;
    let cat: 'herb' | 'artifact' | 'beast' = 'herb';
    if (rollType < 0.42) {
      dropEntry = pickRandom(tierMatches(HERBS), rng);
      cat = 'herb';
    } else if (rollType < 0.78) {
      dropEntry = pickRandom(tierMatches(ARTIFACTS), rng);
      cat = 'artifact';
    } else {
      dropEntry = pickRandom(tierMatches(BEASTS), rng);
      cat = 'beast';
    }
    const item = createInventoryItem(dropEntry, cat, `${next.age}_${next.inventory.length + 1}`);
    const techPool = tierMatches(TECHNIQUES).filter(
      (t) => !next.learnedTechniqueIds.includes(t.id)
    );
    const learnedTech = techPool.length > 0 && rng() < 0.25 ? pickRandom(techPool, rng) : null;
    const abilityPool = tierMatches(ABILITIES).filter(
      (a) => !next.learnedAbilityIds.includes(a.id)
    );
    const learnedAbility =
      !learnedTech && abilityPool.length > 0 && rng() < 0.18 ? pickRandom(abilityPool, rng) : null;

    const tuViGain = Math.max(45, Math.round(next.tuViCap * 0.2));
    next.tuVi += tuViGain;
    next.linhThach += 90 * (next.realmIndex + 1);
    next.inventory = [...next.inventory, item];
    next.codexUnlocked = unlockCodexIds(next.codexUnlocked, [dropEntry.id]);
    if (learnedTech) {
      next.learnedTechniqueIds = [...next.learnedTechniqueIds, learnedTech.id];
      next.codexUnlocked = unlockCodexIds(next.codexUnlocked, [learnedTech.id]);
    }
    if (learnedAbility) {
      next.learnedAbilityIds = [...next.learnedAbilityIds, learnedAbility.id];
      next.codexUnlocked = unlockCodexIds(next.codexUnlocked, [learnedAbility.id]);
    }

    const msg = `Chinh phục Bí Cảnh [${realm.name}]! Tu vi +${tuViGain}, nhặt [${dropEntry.name}]${learnedTech ? ` & lĩnh ngộ [${learnedTech.name}]` : ''}${learnedAbility ? ` & ngộ thần thông [${learnedAbility.name}]` : ''}!`;
    next.logs = appendLog(next.logs, next.age, msg, 'epic');
    return { ok: true, victory: true, nextState: next, message: msg };
  }

  const dmg = Math.max(15, Math.round(next.maxHp * 0.22));
  next.hp = Math.max(1, next.hp - dmg);
  const failMsg = `Gặp yêu thú trấn giữ trong [${realm.name}], chiến thuật thất thế (-${dmg} HP) phải rút về.`;
  next.logs = appendLog(next.logs, next.age, failMsg, 'warn');
  return { ok: true, victory: false, nextState: next, message: failMsg };
}

export function challengeRanking(
  state: PlayerState,
  rankingId: string,
  tactic: CombatTactic,
  rng: RngFn
): { ok: boolean; victory: boolean; nextState: PlayerState; message: string } {
  if (state.actionPoints < 1) {
    return {
      ok: false,
      victory: false,
      nextState: state,
      message: 'Cần 1 Điểm Hành Động để khiêu chiến Bảng Xếp Hạng.',
    };
  }
  const rank = RANKINGS.find((r) => r.id === rankingId) ?? RANKINGS[0];
  let next: PlayerState = {
    ...state,
    actionPoints: state.actionPoints - 1,
    codexUnlocked: unlockCodexIds(state.codexUnlocked, [rank.id]),
  };

  if (tactic === 'rut_lui') {
    const msg = `Quan sát đài tỷ thí [${rank.name}], rút kinh nghiệm chiến đấu (+3 Tâm cảnh).`;
    next.tamCanh += 3;
    next.logs = appendLog(next.logs, next.age, msg, 'info');
    return { ok: true, victory: true, nextState: next, message: msg };
  }

  const power = calculateCombatPower(next);
  const reqPower = 85 * Math.pow(2.1, Math.max(0, rank.minRealm));
  const boost = tactic === 'phap_bao' || tactic === 'hop_kich' ? 1.25 : 1.1;
  const chance = clamp(0.35 + (power * boost) / Math.max(1, reqPower * 1.8), 0.15, 0.95);
  const victory = rng() <= chance;

  if (victory) {
    const rewardStones = 180 * Math.max(1, rank.minRealm);
    next.linhThach += rewardStones;
    next.khiVan = clamp(next.khiVan + 4, 0, 100);
    next.sectContribution += 80;
    const msg = `Vang danh thiên hạ trên [${rank.name}]! Khí vận +4, +80 cống hiến, +${rewardStones} linh thạch!`;
    next.logs = appendLog(next.logs, next.age, msg, 'epic');
    return { ok: true, victory: true, nextState: next, message: msg };
  }

  const dmg = Math.max(10, Math.round(next.maxHp * 0.15));
  next.hp = Math.max(1, next.hp - dmg);
  next.nhucThan += 2;
  const failMsg = `Thất thủ trên lôi đài [${rank.name}] (-${dmg} HP), nhận ra thiếu sót để mài giũa tiếp (+2 Nhục thân).`;
  next.logs = appendLog(next.logs, next.age, failMsg, 'warn');
  return { ok: true, victory: false, nextState: next, message: failMsg };
}

export function travelRegion(
  state: PlayerState,
  regionId: string
): { ok: boolean; nextState: PlayerState; message: string } {
  const region = REGIONS.find((r) => r.id === regionId);
  if (!region) return { ok: false, nextState: state, message: 'Khu vực không tồn tại.' };
  if (region.id === state.regionId) {
    return { ok: false, nextState: state, message: 'Đang ở khu vực này rồi.' };
  }
  if (region.tier === 'tien_gioi' && state.realmIndex < 11) {
    return { ok: false, nextState: state, message: 'Cần phi thăng Nhân Tiên mới bước vào Tiên Giới.' };
  }
  if (region.tier === 'than_gioi' && state.realmIndex < 21) {
    return { ok: false, nextState: state, message: 'Cần đạt Hạ Vị Thần mới bước vào Thần Giới.' };
  }
  if (state.actionPoints < 1) {
    return { ok: false, nextState: state, message: 'Cần 1 Điểm Hành Động để di chuyển.' };
  }

  const vehicleHint = VEHICLES[Math.min(VEHICLES.length - 1, Math.floor(state.realmIndex / 2))];
  const msg = `Ngự [${vehicleHint?.name ?? 'Linh Chu'}] di chuyển tới [${region.name}].`;

  return {
    ok: true,
    nextState: {
      ...state,
      actionPoints: state.actionPoints - 1,
      regionId: region.id,
      codexUnlocked: unlockCodexIds(state.codexUnlocked, [region.id]),
      logs: appendLog(state.logs, state.age, msg, 'info'),
    },
    message: msg,
  };
}
