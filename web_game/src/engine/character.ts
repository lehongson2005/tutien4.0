import {
  FATES,
  LUCKS,
  ORIGINS,
  PHYSIQUES,
  REALMS,
  REGIONS,
  SPIRIT_ROOTS,
  getRealmByIndex,
} from '../data/catalog';
import type {
  InventoryItem,
  ItemCategory,
  LogEntry,
  LoreEntry,
  PlayerState,
  Rarity,
  ReincarnationLegacy,
} from '../types/game';
import { clamp, pickWeightedByRarity, type RngFn } from './rng';

export function createEmptyLegacy(): ReincarnationLegacy {
  return {
    rebirthCount: 0,
    daoQuaPoints: 0,
    inheritedTechniqueIds: [],
    unlockedCodexIds: [],
    bestRealmIndex: 0,
    completedEndings: [],
  };
}

export function getLuckTier(khiVan: number): {
  label: string;
  hex: string;
  tierKey: 'den' | 'trang' | 'do' | 'vang' | 'tim';
} {
  const val = clamp(khiVan, 0, 100);
  if (val < 20) return { label: 'Đen (Đại Hung)', hex: '#9ca3af', tierKey: 'den' };
  if (val < 40) return { label: 'Trắng (Phàm Nhân)', hex: '#e2e8f0', tierKey: 'trang' };
  if (val < 60) return { label: 'Đỏ (Hữu Duyên)', hex: '#f87171', tierKey: 'do' };
  if (val < 80) return { label: 'Vàng (Thiên Tài)', hex: '#fbbf24', tierKey: 'vang' };
  return { label: 'Tím (Chí Tôn)', hex: '#c084fc', tierKey: 'tim' };
}

export function formatSpiritStones(amount: number, realmIndex: number): string {
  const safe = Number.isFinite(amount) ? Math.max(0, Math.floor(amount)) : 0;
  if (realmIndex >= 21) {
    const thanTinh = Math.floor(safe / 100_000_000);
    if (thanTinh >= 1) {
      const rem = safe % 100_000_000;
      const tien = Math.floor(rem / 100_000);
      return tien > 0
        ? `${thanTinh.toLocaleString('vi-VN')} Thần Tinh ${tien.toLocaleString('vi-VN')} Tiên Thạch`
        : `${thanTinh.toLocaleString('vi-VN')} Thần Tinh`;
    }
  }
  if (realmIndex >= 11) {
    const tienThach = Math.floor(safe / 100_000);
    if (tienThach >= 1) {
      const rem = safe % 100_000;
      return rem >= 1000
        ? `${tienThach.toLocaleString('vi-VN')} Tiên Thạch ${Math.floor(rem / 100)} Trung phẩm`
        : `${tienThach.toLocaleString('vi-VN')} Tiên Thạch`;
    }
  }
  if (safe >= 10_000_000) {
    const cuc = Math.floor(safe / 10_000_000);
    const thuong = Math.floor((safe % 10_000_000) / 10_000);
    return thuong > 0 ? `${cuc} Cực phẩm ${thuong} Thượng phẩm` : `${cuc} Cực phẩm Linh thạch`;
  }
  if (safe >= 10_000) {
    const thuong = Math.floor(safe / 10_000);
    const trung = Math.floor((safe % 10_000) / 100);
    return trung > 0 ? `${thuong} Thượng phẩm ${trung} Trung phẩm` : `${thuong} Thượng phẩm Linh thạch`;
  }
  if (safe >= 100) {
    const trung = Math.floor(safe / 100);
    const ha = safe % 100;
    return ha > 0 ? `${trung} Trung phẩm ${ha} Hạ phẩm` : `${trung} Trung phẩm Linh thạch`;
  }
  return `${safe} Hạ phẩm Linh thạch`;
}

export function getRarityBonus(rarity: Rarity): number {
  switch (rarity) {
    case 'pham':
      return 15;
    case 'linh':
      return 40;
    case 'vuong':
      return 110;
    case 'thanh':
      return 300;
    case 'chi_ton':
      return 850;
  }
}

export function createInventoryItem(
  entry: LoreEntry,
  category: ItemCategory,
  uidSuffix: string
): InventoryItem {
  const tierFactor = entry.tier === 'than_gioi' ? 25 : entry.tier === 'tien_gioi' ? 6 : 1;
  return {
    uid: `${entry.id}_${uidSuffix}`,
    catalogId: entry.id,
    name: entry.name,
    category,
    rarity: entry.rarity,
    tier: entry.tier,
    quantity: 1,
    powerBonus: getRarityBonus(entry.rarity) * tierFactor,
    level: 1,
    description: entry.description,
  };
}

export function unlockCodexIds(existing: string[], ids: string[]): string[] {
  const next = new Set(existing);
  ids.forEach((id) => {
    if (id) next.add(id);
  });
  return Array.from(next);
}

export function appendLog(
  logs: LogEntry[],
  age: number,
  text: string,
  tone: LogEntry['tone'] = 'info'
): LogEntry[] {
  const entry: LogEntry = {
    id: `log_${age}_${logs.length + 1}`,
    age,
    text,
    tone,
  };
  return [entry, ...logs].slice(0, 120);
}

export function rollCharacter(
  rawName: string,
  legacy: ReincarnationLegacy,
  rng: RngFn,
  inheritedTechniqueId?: string
): PlayerState {
  const cleanName = rawName.trim() || 'Mặc Vô Danh';
  const origin = pickWeightedByRarity(ORIGINS, legacy.daoQuaPoints, rng);
  const physique = pickWeightedByRarity(PHYSIQUES, legacy.daoQuaPoints, rng);
  const spiritRoot = pickWeightedByRarity(
    SPIRIT_ROOTS,
    legacy.daoQuaPoints + (origin.spiritRootBias === 'high' ? 20 : 0),
    rng
  );
  const luck = pickWeightedByRarity(LUCKS, legacy.daoQuaPoints, rng);
  const fate = pickWeightedByRarity(FATES, legacy.daoQuaPoints, rng);

  const realm0 = REALMS[0];
  let maxAge = realm0.maxAge;
  if (fate.name.includes('Thọ Tinh')) {
    maxAge = Math.round(maxAge * 1.4);
  }
  if (physique.name.includes('Vĩnh Hằng')) {
    maxAge += 30;
  }

  const baseHp = 100 + Math.round(origin.bonuses.nhucThan * 4 + physique.nhucThanBonus * 3);
  const startKhiVan = clamp(
    luck.khiVanBase + origin.bonuses.khiVan + Math.min(12, Math.floor(legacy.daoQuaPoints / 10)),
    5,
    100
  );

  const learnedTechniques: string[] = [];
  if (inheritedTechniqueId) {
    learnedTechniques.push(inheritedTechniqueId);
  }

  const startingRegion = REGIONS[0]?.id ?? 'region_01';
  const codexUnlocked = unlockCodexIds(legacy.unlockedCodexIds, [
    origin.id,
    physique.id,
    luck.id,
    fate.id,
  ]);

  const initialLogs = appendLog(
    [],
    0,
    `Khởi kiếp mới [${cleanName}]: Xuất thân ${origin.name}, thể chất ${physique.name}, ${spiritRoot.name}, khí vận ${luck.name}.`,
    'epic'
  );

  return {
    version: 1,
    name: cleanName,
    age: 0,
    maxAge,
    stage: 1,
    realmIndex: 0,
    tuVi: 0,
    tuViCap: realm0.tuViCap,
    hp: baseHp,
    maxHp: baseHp,
    nhucThan: 8 + origin.bonuses.nhucThan + physique.nhucThanBonus,
    ngoTinh: 8 + origin.bonuses.ngoTinh + physique.ngoTinhBonus + Math.floor(legacy.daoQuaPoints / 15),
    tamCanh: 8 + origin.bonuses.tamCanh,
    khiVan: startKhiVan,
    congDuc: Math.max(0, origin.bonuses.congDuc),
    nghiepLuc: Math.max(0, origin.bonuses.nghiepLuc),
    danDoc: 0,
    linhThach: Math.max(0, 20 + origin.bonuses.linhThach),
    origin,
    physique,
    spiritRoot,
    luck,
    fate,
    daoAlignment: 'chua_chon',
    selectedDaoId: null,
    regionId: startingRegion,
    sectId: null,
    sectName: null,
    sectFaction: null,
    sectRankOrder: 0,
    sectContribution: 0,
    isTanTu: false,
    dongPhuLevel: 0,
    mineLevel: 0,
    inflationMultiplier: 1,
    turnsInStage3: 0,
    inventory: [],
    equippedArtifactUid: null,
    activeArrayUid: null,
    activeBeastUid: null,
    learnedTechniqueIds: learnedTechniques,
    learnedAbilityIds: [],
    companions: [],
    friends: [],
    professions: [],
    laws: {
      thoiGian: 0,
      khongGian: 0,
      nhanQua: 0,
      honDon: 0,
    },
    ancientProgress: 0,
    decipheredAncientIds: [],
    calamityCountdown: 6,
    hasUsedDoatXa: false,
    wantedByTranTheMinh: false,
    cryoSleepCycles: 0,
    ascendedLowerWorld: false,
    stage2StepYears: 2,
    actionPoints: 2,
    maxActionPoints: 2,
    currentEvent: null,
    usedEventIds: [],
    survivalCrisisActive: false,
    ending: null,
    codexUnlocked,
    logs: initialLogs,
  };
}

export function calculateCombatPower(state: PlayerState): number {
  const realm = getRealmByIndex(state.realmIndex);
  const artifact = state.inventory.find((i) => i.uid === state.equippedArtifactUid);
  const arrayItem = state.inventory.find((i) => i.uid === state.activeArrayUid);
  const beastItem = state.inventory.find((i) => i.uid === state.activeBeastUid);

  const equipBonus =
    (artifact ? artifact.powerBonus * (1 + (artifact.level - 1) * 0.35) : 0) +
    (arrayItem ? arrayItem.powerBonus * 0.8 : 0) +
    (beastItem ? beastItem.powerBonus * 0.9 : 0);

  const lawSum =
    state.laws.thoiGian + state.laws.khongGian + state.laws.nhanQua + state.laws.honDon;

  const techBonus =
    state.learnedTechniqueIds.length * 35 * (state.realmIndex + 1) +
    state.learnedAbilityIds.length * 90 * (state.realmIndex + 1);

  const partyBonus =
    state.companions.length * 120 * Math.max(1, state.realmIndex) +
    state.friends.length * 55 * Math.max(1, state.realmIndex);

  const statScore =
    state.nhucThan * 4 +
    state.ngoTinh * 3 +
    state.tamCanh * 2 +
    state.physique.powerBonus;

  return Math.max(
    1,
    Math.round(
      realm.powerBase +
        statScore * Math.max(1, state.realmIndex * 0.75 + 1) +
        equipBonus +
        techBonus +
        partyBonus +
        lawSum * 1500
    )
  );
}
