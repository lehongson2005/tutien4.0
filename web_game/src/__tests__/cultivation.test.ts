import { describe, it, expect } from 'vitest';
import { createSeededRng } from '../engine/rng';
import { createEmptyLegacy, createInventoryItem, rollCharacter } from '../engine/character';
import { ELIXIRS, ARRAYS, COMPANIONS } from '../data/catalog';
import {
  attemptBreakthrough,
  consumeElixir,
  meditate,
  purifyDanDoc,
} from '../engine/cultivation';

describe('Task 6: Cultivation, Elixirs, Inner Demons & Tribulations', () => {
  it('costs 1 AP to meditate and increases tuVi according to multipliers', () => {
    const rng = createSeededRng(700);
    const char = rollCharacter('Tu Sĩ', createEmptyLegacy(), rng);
    expect(char.actionPoints).toBe(2);

    const res1 = meditate(char, rng);
    expect(res1.ok).toBe(true);
    expect(res1.nextState.actionPoints).toBe(1);
    expect(res1.nextState.tuVi).toBeGreaterThan(char.tuVi);

    const res2 = meditate({ ...res1.nextState, actionPoints: 0 }, rng);
    expect(res2.ok).toBe(false);
    expect(res2.nextState.tuVi).toBe(res1.nextState.tuVi);
  });

  it('tracks danDoc toxicity on elixir consumption and purifies cleanly', () => {
    const rng = createSeededRng(701);
    const base = rollCharacter('Đan Đạo', createEmptyLegacy(), rng);
    const normalElixir = createInventoryItem(ELIXIRS[0], 'elixir', 'e1');
    normalElixir.quantity = 6;
    let state = { ...base, inventory: [normalElixir], danDoc: 78 };

    const overRes = consumeElixir(state, normalElixir.uid);
    expect(overRes.ok).toBe(true);
    expect(overRes.nextState.danDoc).toBeGreaterThan(85);
    expect(overRes.nextState.danDoc).toBeLessThanOrEqual(100);
    // Overdose toxicity deals backlash damage
    expect(overRes.nextState.hp).toBeLessThan(base.maxHp);

    const purified = purifyDanDoc({ ...overRes.nextState, actionPoints: 1 });
    expect(purified.ok).toBe(true);
    expect(purified.nextState.danDoc).toBeLessThan(overRes.nextState.danDoc);
    expect(purified.nextState.actionPoints).toBe(0);
  });

  it('handles Kim Đan breakthrough: higher nghiepLuc deals harsher tribulation than high congDuc + array', () => {
    const rngA = createSeededRng(888);
    const rngB = createSeededRng(888);
    const base = rollCharacter('Độ Kiếp', createEmptyLegacy(), createSeededRng(10));
    const arr = createInventoryItem(ARRAYS[0], 'array', 'arr1');

    const readyBase = {
      ...base,
      realmIndex: 2, // Trúc Cơ -> targeting Kết Đan (index 3, Tâm Ma + Lôi Kiếp)
      tuVi: 700,
      tuViCap: 650,
      nhucThan: 60,
      tamCanh: 70,
      hp: 600,
      maxHp: 600,
      inventory: [arr],
      activeArrayUid: arr.uid,
      companions: [COMPANIONS[0]],
    };

    const sinful = { ...readyBase, nghiepLuc: 180, congDuc: 0 };
    const virtuous = { ...readyBase, nghiepLuc: 0, congDuc: 180 };

    const resSin = attemptBreakthrough(
      sinful,
      { innerDemon: 'nho_dao_lu', useDoKiepDan: false, useArrayDefense: true },
      rngA
    );
    const resVirt = attemptBreakthrough(
      virtuous,
      { innerDemon: 'nho_dao_lu', useDoKiepDan: false, useArrayDefense: true },
      rngB
    );

    expect(resVirt.tribulationDamage).toBeLessThan(resSin.tribulationDamage);
    if (resVirt.success) {
      expect(resVirt.nextState.realmIndex).toBe(3);
      expect(resVirt.nextState.maxAge).toBeGreaterThanOrEqual(800);
    }
  });
});
