import {
  ARTIFACTS,
  ARRAYS,
  BEASTS,
  ELIXIRS,
  GUILDS,
  HERBS,
  PROFESSIONS,
  SECT_RELICS,
} from '../data/catalog';
import type {
  ItemCategory,
  LoreEntry,
  PlayerState,
  WorldTier,
} from '../types/game';
import { appendLog, createInventoryItem, unlockCodexIds } from './character';
import { clamp, pickRandom, type RngFn } from './rng';

export interface ShopCatalogEntry {
  entry: LoreEntry;
  category: ItemCategory;
  basePrice: number;
}

export function updateInflation(state: PlayerState, rng: RngFn): PlayerState {
  if (state.stage < 3) {
    return { ...state, inflationMultiplier: 1 };
  }
  const factor = 1.15 + rng() * 2.25;
  const safeFactor = clamp(Number(factor.toFixed(2)), 0.85, 4.0);
  return {
    ...state,
    inflationMultiplier: safeFactor,
  };
}

export function getShopPrice(basePrice: number, state: PlayerState): number {
  const safeBase = Number.isFinite(basePrice) ? Math.max(1, basePrice) : 10;
  const inf = Number.isFinite(state.inflationMultiplier)
    ? clamp(state.inflationMultiplier, 0.5, 5)
    : 1;
  const contribDiscount = Math.max(0.8, 1 - Math.min(0.2, state.sectContribution * 0.0002));
  return Math.max(1, Math.round(safeBase * inf * contribDiscount));
}

function getWorldTier(realmIndex: number): WorldTier {
  if (realmIndex >= 21) return 'than_gioi';
  if (realmIndex >= 11) return 'tien_gioi';
  return 'ha_gioi';
}

export function getShopCatalog(state: PlayerState): ShopCatalogEntry[] {
  const tier = getWorldTier(state.realmIndex);
  const mult = tier === 'than_gioi' ? 1500 : tier === 'tien_gioi' ? 80 : 1;

  const filterPool = (pool: readonly LoreEntry[], limit: number) => {
    const matched = pool.filter((i) => i.tier === tier);
    return (matched.length > 0 ? matched : pool).slice(0, limit);
  };

  const list: ShopCatalogEntry[] = [];
  filterPool(ELIXIRS, 6).forEach((entry, idx) =>
    list.push({ entry, category: 'elixir', basePrice: (45 + idx * 30) * mult })
  );
  filterPool(HERBS, 5).forEach((entry, idx) =>
    list.push({ entry, category: 'herb', basePrice: (30 + idx * 20) * mult })
  );
  filterPool(ARTIFACTS, 5).forEach((entry, idx) =>
    list.push({ entry, category: 'artifact', basePrice: (120 + idx * 90) * mult })
  );
  filterPool(ARRAYS, 4).forEach((entry, idx) =>
    list.push({ entry, category: 'array', basePrice: (160 + idx * 110) * mult })
  );
  filterPool(BEASTS, 3).forEach((entry, idx) =>
    list.push({ entry, category: 'beast', basePrice: (220 + idx * 140) * mult })
  );

  if (state.stage >= 3 || state.realmIndex >= 3) {
    filterPool(SECT_RELICS, 3).forEach((entry, idx) =>
      list.push({ entry, category: 'relic', basePrice: (1800 + idx * 900) * mult })
    );
  }

  return list;
}

export function getActiveGuildInfo(state: PlayerState): LoreEntry {
  const idx = state.realmIndex >= 21 ? 2 : state.realmIndex >= 11 ? 1 : 0;
  return GUILDS[idx] ?? GUILDS[0];
}

export function buyShopItem(
  state: PlayerState,
  entry: LoreEntry,
  category: ItemCategory,
  basePrice: number
): { ok: boolean; nextState: PlayerState; message: string } {
  const finalPrice = getShopPrice(basePrice, state);
  if (state.linhThach < finalPrice) {
    return {
      ok: false,
      nextState: state,
      message: `Không đủ linh thạch (cần ${finalPrice.toLocaleString('vi-VN')}).`,
    };
  }

  let nextInv = [...state.inventory];
  const stackable = category === 'herb' || category === 'elixir';
  const existingIdx = stackable
    ? nextInv.findIndex((i) => i.catalogId === entry.id && i.category === category)
    : -1;

  if (existingIdx >= 0) {
    nextInv[existingIdx] = {
      ...nextInv[existingIdx],
      quantity: nextInv[existingIdx].quantity + 1,
    };
  } else {
    nextInv.push(createInventoryItem(entry, category, `${state.age}_${nextInv.length + 1}`));
  }

  const msg = `Mua [${entry.name}] với giá ${finalPrice.toLocaleString('vi-VN')} linh thạch.`;
  const next: PlayerState = {
    ...state,
    linhThach: Math.max(0, state.linhThach - finalPrice),
    inventory: nextInv,
    codexUnlocked: unlockCodexIds(state.codexUnlocked, [entry.id]),
    logs: appendLog(state.logs, state.age, msg, 'info'),
  };
  return { ok: true, nextState: next, message: msg };
}

export function sellInventoryItem(
  state: PlayerState,
  itemUid: string
): { ok: boolean; nextState: PlayerState; message: string } {
  const idx = state.inventory.findIndex((i) => i.uid === itemUid && i.quantity > 0);
  if (idx < 0) {
    return { ok: false, nextState: state, message: 'Không tìm thấy vật phẩm để bán.' };
  }
  const item = state.inventory[idx];
  const value = Math.max(
    10,
    Math.round((item.powerBonus * 2 + 25) * item.level * Math.min(2, state.inflationMultiplier))
  );

  const nextInv = state.inventory
    .map((e, i) => (i === idx ? { ...e, quantity: e.quantity - 1 } : e))
    .filter((e) => e.quantity > 0);

  const removedCompletely = !nextInv.some((i) => i.uid === itemUid);
  const msg = `Bán [${item.name}] thu về ${value.toLocaleString('vi-VN')} linh thạch.`;

  const next: PlayerState = {
    ...state,
    linhThach: state.linhThach + value,
    inventory: nextInv,
    equippedArtifactUid:
      removedCompletely && state.equippedArtifactUid === itemUid
        ? null
        : state.equippedArtifactUid,
    activeArrayUid:
      removedCompletely && state.activeArrayUid === itemUid
        ? null
        : state.activeArrayUid,
    activeBeastUid:
      removedCompletely && state.activeBeastUid === itemUid
        ? null
        : state.activeBeastUid,
    logs: appendLog(state.logs, state.age, msg, 'good'),
  };
  return { ok: true, nextState: next, message: msg };
}

export function equipInventoryItem(
  state: PlayerState,
  itemUid: string
): { ok: boolean; nextState: PlayerState; message: string } {
  const item = state.inventory.find((i) => i.uid === itemUid);
  if (!item) return { ok: false, nextState: state, message: 'Vật phẩm không tồn tại.' };

  if (item.category === 'artifact' || item.category === 'relic') {
    const toggle = state.equippedArtifactUid === itemUid ? null : itemUid;
    return {
      ok: true,
      nextState: { ...state, equippedArtifactUid: toggle },
      message: toggle ? `Đã trang bị [${item.name}].` : `Đã tháo [${item.name}].`,
    };
  }
  if (item.category === 'array') {
    const toggle = state.activeArrayUid === itemUid ? null : itemUid;
    return {
      ok: true,
      nextState: { ...state, activeArrayUid: toggle },
      message: toggle ? `Đã kích hoạt trận pháp [${item.name}].` : `Đã thu hồi [${item.name}].`,
    };
  }
  if (item.category === 'beast') {
    const toggle = state.activeBeastUid === itemUid ? null : itemUid;
    return {
      ok: true,
      nextState: { ...state, activeBeastUid: toggle },
      message: toggle ? `Triệu hồi linh thú [${item.name}] xuất chiến!` : `Thu hồi [${item.name}].`,
    };
  }
  return { ok: false, nextState: state, message: 'Loại vật phẩm này không thể trang bị trực tiếp.' };
}

export function learnProfession(
  state: PlayerState,
  professionId: string
): { ok: boolean; nextState: PlayerState; message: string } {
  const prof = PROFESSIONS.find((p) => p.id === professionId);
  if (!prof) {
    return { ok: false, nextState: state, message: 'Không tìm thấy nghề phụ này.' };
  }
  if (state.professions.some((p) => p.id === professionId)) {
    return { ok: false, nextState: state, message: `Đã theo học nghề [${prof.name}].` };
  }
  if (state.professions.length >= 2) {
    return { ok: false, nextState: state, message: 'Tối đa học 2 chức nghiệp phụ trong một kiếp.' };
  }

  const next: PlayerState = {
    ...state,
    professions: [...state.professions, { id: prof.id, name: prof.name, tierLevel: 1, exp: 0 }],
    codexUnlocked: unlockCodexIds(state.codexUnlocked, [prof.id]),
    logs: appendLog(state.logs, state.age, `Bái sư học nghề phụ [${prof.name}] (Nhất phẩm).`, 'good'),
  };
  return { ok: true, nextState: next, message: `Đã bái nhập nghề [${prof.name}]!` };
}

export function trainProfession(
  state: PlayerState,
  professionId: string
): { ok: boolean; nextState: PlayerState; message: string } {
  if (state.actionPoints < 1) {
    return { ok: false, nextState: state, message: 'Cần 1 Điểm Hành Động để rèn luyện nghề.' };
  }
  const idx = state.professions.findIndex((p) => p.id === professionId);
  if (idx < 0) {
    return { ok: false, nextState: state, message: 'Chưa học nghề này.' };
  }
  const curr = state.professions[idx];
  const nextExp = curr.exp + 40 + state.ngoTinh;
  let nextLevel = curr.tierLevel;
  let remExp = nextExp;
  if (remExp >= 100 && nextLevel < 11) {
    nextLevel += 1;
    remExp -= 100;
  }
  const updated = state.professions.map((p, i) =>
    i === idx ? { ...p, tierLevel: nextLevel, exp: remExp } : p
  );
  const feeEarned = nextLevel * 35;
  const msg = `Nghiên cứu [${curr.name}] (Phẩm ${nextLevel}): thu nhập ${feeEarned} linh thạch, Ngộ tính +1.`;
  const next: PlayerState = {
    ...state,
    actionPoints: state.actionPoints - 1,
    professions: updated,
    ngoTinh: state.ngoTinh + 1,
    linhThach: state.linhThach + feeEarned,
    logs: appendLog(state.logs, state.age, msg, 'good'),
  };
  return { ok: true, nextState: next, message: msg };
}

export function craftAction(
  state: PlayerState,
  mode: 'alchemy' | 'forge' | 'array',
  targetUid: string | null,
  rng: RngFn
): { ok: boolean; nextState: PlayerState; message: string } {
  if (state.actionPoints < 1) {
    return { ok: false, nextState: state, message: 'Hết Điểm Hành Động để chế tác.' };
  }
  const tier = getWorldTier(state.realmIndex);

  if (mode === 'alchemy') {
    const herbIdx = state.inventory.findIndex(
      (i) => i.category === 'herb' && (!targetUid || i.uid === targetUid) && i.quantity > 0
    );
    if (herbIdx < 0) {
      return { ok: false, nextState: state, message: 'Cần có Linh thảo trong túi để luyện đan!' };
    }
    const herb = state.inventory[herbIdx];
    const nextInv = state.inventory
      .map((e, idx) => (idx === herbIdx ? { ...e, quantity: e.quantity - 1 } : e))
      .filter((e) => e.quantity > 0);

    const pool = ELIXIRS.filter((e) => e.tier === tier);
    const brewed = pickRandom(pool.length > 0 ? pool : ELIXIRS, rng);
    const existingElIdx = nextInv.findIndex(
      (i) => i.catalogId === brewed.id && i.category === 'elixir'
    );
    if (existingElIdx >= 0) {
      nextInv[existingElIdx] = {
        ...nextInv[existingElIdx],
        quantity: nextInv[existingElIdx].quantity + 1,
      };
    } else {
      nextInv.push(createInventoryItem(brewed, 'elixir', `${state.age}_${nextInv.length + 1}`));
    }
    const msg = `Khai lò luyện hóa [${herb.name}] -> Thành phẩm [${brewed.name}]!`;
    return {
      ok: true,
      nextState: {
        ...state,
        actionPoints: state.actionPoints - 1,
        inventory: nextInv,
        ngoTinh: state.ngoTinh + 1,
        codexUnlocked: unlockCodexIds(state.codexUnlocked, [brewed.id]),
        logs: appendLog(state.logs, state.age, msg, 'good'),
      },
      message: msg,
    };
  }

  if (mode === 'forge') {
    const artIdx = state.inventory.findIndex(
      (i) =>
        (i.category === 'artifact' || i.category === 'relic') &&
        (!targetUid || i.uid === targetUid)
    );
    if (artIdx < 0) {
      return { ok: false, nextState: state, message: 'Chưa có Pháp bảo để tôi luyện cường hóa!' };
    }
    const target = state.inventory[artIdx];
    const cost = Math.max(40, target.level * 60);
    if (state.linhThach < cost) {
      return { ok: false, nextState: state, message: `Cần ${cost} linh thạch để rèn cường hóa.` };
    }
    const nextInv = state.inventory.map((e, i) =>
      i === artIdx
        ? { ...e, level: e.level + 1, powerBonus: Math.round(e.powerBonus * 1.32) }
        : e
    );
    const msg = `Tôi luyện [${target.name}] lên tầng +${target.level + 1}!`;
    return {
      ok: true,
      nextState: {
        ...state,
        actionPoints: state.actionPoints - 1,
        linhThach: state.linhThach - cost,
        inventory: nextInv,
        logs: appendLog(state.logs, state.age, msg, 'good'),
      },
      message: msg,
    };
  }

  // mode === 'array'
  const fee = Math.max(60, Math.round(120 * state.inflationMultiplier));
  if (state.linhThach < fee) {
    return { ok: false, nextState: state, message: `Cần ${fee} linh thạch để khắc Trận bàn.` };
  }
  const arrayPool = ARRAYS.filter((a) => a.tier === tier);
  const crafted = pickRandom(arrayPool.length > 0 ? arrayPool : ARRAYS, rng);
  const item = createInventoryItem(crafted, 'array', `${state.age}_${state.inventory.length + 1}`);
  const msg = `Khắc thành công Trận pháp [${crafted.name}]!`;
  return {
    ok: true,
    nextState: {
      ...state,
      actionPoints: state.actionPoints - 1,
      linhThach: state.linhThach - fee,
      inventory: [...state.inventory, item],
      codexUnlocked: unlockCodexIds(state.codexUnlocked, [crafted.id]),
      logs: appendLog(state.logs, state.age, msg, 'good'),
    },
    message: msg,
  };
}
