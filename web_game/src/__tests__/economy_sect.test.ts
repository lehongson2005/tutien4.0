import { describe, it, expect } from 'vitest';
import type { PlayerState } from '../types/game';
import { createSeededRng } from '../engine/rng';
import { createEmptyLegacy, createInventoryItem, rollCharacter } from '../engine/character';
import { ARTIFACTS, HERBS, PROFESSIONS, RANKINGS, REGIONS, SECRET_REALMS, SECTS } from '../data/catalog';
import {
  buyShopItem,
  craftAction,
  getShopPrice,
  learnProfession,
  sellInventoryItem,
  updateInflation,
} from '../engine/economy';
import {
  challengeRanking,
  chooseTanTuPath,
  exploreSecretRealm,
  foundOwnSect,
  joinSect,
  manageSectMine,
  promoteSectRank,
  stealProdigyLuck,
  travelRegion,
} from '../engine/sect';

describe('Task 7: Economy, Professions, Sects, Tán Tu & Secret Realms', () => {
  it('handles Stage 3 inflation and shop buy/sell safely without negative or NaN values', () => {
    const rng = createSeededRng(901);
    let state: PlayerState = {
      ...rollCharacter('Thương Nhân', createEmptyLegacy(), rng),
      stage: 3,
      realmIndex: 3,
      linhThach: 5000,
    };
    state = updateInflation(state, rng);
    expect(state.inflationMultiplier).toBeGreaterThanOrEqual(0.85);
    expect(Number.isFinite(state.inflationMultiplier)).toBe(true);

    const inflated = { ...state, inflationMultiplier: 2.5 };
    const price = getShopPrice(100, inflated);
    expect(price).toBeGreaterThanOrEqual(200);

    const buyRes = buyShopItem(inflated, ARTIFACTS[0], 'artifact', 100);
    expect(buyRes.ok).toBe(true);
    expect(buyRes.nextState.linhThach).toBe(5000 - price);
    expect(buyRes.nextState.inventory.length).toBe(1);

    const itemUid = buyRes.nextState.inventory[0].uid;
    const sellRes = sellInventoryItem(buyRes.nextState, itemUid);
    expect(sellRes.ok).toBe(true);
    expect(sellRes.nextState.linhThach).toBeGreaterThan(buyRes.nextState.linhThach);
    expect(sellRes.nextState.inventory.length).toBe(0);
  });

  it('crafts pills from herbs and upgrades artifacts cleanly', () => {
    const rng = createSeededRng(902);
    const herb = createInventoryItem(HERBS[0], 'herb', 'h1');
    const artifact = createInventoryItem(ARTIFACTS[0], 'artifact', 'a1');
    let state = {
      ...rollCharacter('Luyện Đan Sư', createEmptyLegacy(), rng),
      linhThach: 1000,
      inventory: [herb, artifact],
      actionPoints: 2,
    };

    const learnRes = learnProfession(state, PROFESSIONS[12].id); // Đan Sư
    expect(learnRes.ok).toBe(true);
    state = learnRes.nextState;

    const brewRes = craftAction(state, 'alchemy', herb.uid, rng);
    expect(brewRes.ok).toBe(true);
    expect(brewRes.nextState.inventory.some((i) => i.category === 'elixir')).toBe(true);

    const forgeRes = craftAction(brewRes.nextState, 'forge', artifact.uid, rng);
    expect(forgeRes.ok).toBe(true);
    const upgraded = forgeRes.nextState.inventory.find((i) => i.uid === artifact.uid);
    expect(upgraded?.level).toBe(2);
  });

  it('supports joining sects, promotions, Tán Tu Động Phủ, self-founded sect, mines, and luck stealing', () => {
    const rng = createSeededRng(903);
    const base = {
      ...rollCharacter('Tông Chủ', createEmptyLegacy(), rng),
      stage: 3 as const,
      realmIndex: 4, // Nguyên Anh
      linhThach: 10000,
      sectContribution: 500,
      actionPoints: 2,
    };

    // Tán Tu path
    const tanTu = chooseTanTuPath(base);
    expect(tanTu.ok).toBe(true);
    expect(tanTu.nextState.isTanTu).toBe(true);
    expect(tanTu.nextState.dongPhuLevel).toBeGreaterThanOrEqual(1);

    // Join existing sect & promote
    const joined = joinSect(tanTu.nextState, SECTS[0].id);
    expect(joined.ok).toBe(true);
    expect(joined.nextState.sectId).toBe(SECTS[0].id);
    const promo = promoteSectRank(joined.nextState);
    expect(promo.ok).toBe(true);
    expect(promo.nextState.sectRankOrder).toBeGreaterThan(joined.nextState.sectRankOrder);

    // Self-founded sect
    const founded = foundOwnSect(base, 'Thái Sơ Kiếm Tông');
    expect(founded.ok).toBe(true);
    expect(founded.nextState.sectName).toBe('Thái Sơ Kiếm Tông');
    expect(founded.nextState.sectRankOrder).toBe(11);

    // Manage mine + Steal prodigy luck
    const mined = manageSectMine(founded.nextState, rng);
    expect(mined.ok).toBe(true);
    expect(mined.nextState.linhThach).toBeGreaterThan(founded.nextState.linhThach);

    const stolen = stealProdigyLuck({ ...mined.nextState, actionPoints: 1 }, rng);
    expect(stolen.ok).toBe(true);
    expect(stolen.nextState.nghiepLuc).toBeGreaterThan(mined.nextState.nghiepLuc);
    expect(stolen.nextState.khiVan).toBeGreaterThanOrEqual(mined.nextState.khiVan);
  });

  it('supports tactical secret realm exploration, rankings, and Ngũ Đại Vực travel', () => {
    const rng = createSeededRng(904);
    const state = {
      ...rollCharacter('Khám Phá', createEmptyLegacy(), rng),
      realmIndex: 4,
      hp: 1500,
      maxHp: 1500,
      actionPoints: 2,
    };

    const realmRes = exploreSecretRealm(state, SECRET_REALMS[0].id, 'phap_bao', rng);
    expect(realmRes.ok).toBe(true);
    expect(realmRes.nextState.actionPoints).toBe(1);

    const rankRes = challengeRanking(realmRes.nextState, RANKINGS[0].id, 'hop_kich', rng);
    expect(rankRes.ok).toBe(true);

    const travelRes = travelRegion({ ...rankRes.nextState, actionPoints: 1 }, REGIONS[2].id);
    expect(travelRes.ok).toBe(true);
    expect(travelRes.nextState.regionId).toBe(REGIONS[2].id);
  });
});
