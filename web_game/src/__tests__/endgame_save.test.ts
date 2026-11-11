import { describe, it, expect, beforeEach } from 'vitest';
import { createSeededRng } from '../engine/rng';
import { createEmptyLegacy, rollCharacter } from '../engine/character';
import { ANCIENT_TEXTS, CALAMITIES } from '../data/catalog';
import {
  comprehendLaw,
  decipherAncientScript,
  faceCosmicCalamity,
  triggerBodyPossession,
  triggerCryoHibernation,
  triggerReincarnation,
} from '../engine/endgame';
import {
  exportSaveString,
  importSaveString,
  loadFromLocalStorage,
  saveToLocalStorage,
} from '../engine/save';

describe('Task 8: Stage 4 Endgame, Laws, Survival Options & Save System', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('comprehends cosmic laws, deciphers ancient scripts, and faces calamities', () => {
    const rng = createSeededRng(1001);
    let state = {
      ...rollCharacter('Thái Cổ Đại Lão', createEmptyLegacy(), rng),
      stage: 4 as const,
      age: 1200,
      maxAge: 5000,
      realmIndex: 6, // Luyện Hư
      ngoTinh: 140,
      hp: 8000,
      maxHp: 8000,
      actionPoints: 2,
    };

    const lawRes = comprehendLaw(state, 'thoiGian', rng);
    expect(lawRes.ok).toBe(true);
    expect(lawRes.nextState.laws.thoiGian).toBeGreaterThan(0);

    const scriptRes = decipherAncientScript(lawRes.nextState, ANCIENT_TEXTS[0].id, rng);
    expect(scriptRes.ok).toBe(true);
    expect(scriptRes.nextState.ancientProgress).toBeGreaterThan(0);

    const calRes = faceCosmicCalamity(
      { ...scriptRes.nextState, actionPoints: 1 },
      CALAMITIES[0].id,
      'tran_phap',
      rng
    );
    expect(calRes.ok).toBe(true);
  });

  it('enforces 1x Đoạt Xá, Cryo-hibernation shifting maxAge+500, and Reincarnation Đạo Quả legacy', () => {
    const rng = createSeededRng(1002);
    const base = {
      ...rollCharacter('Lão Tổ', createEmptyLegacy(), rng),
      stage: 4 as const,
      age: 1490,
      maxAge: 1500,
      realmIndex: 5, // Hóa Thần
      tamCanh: 95,
      ngoTinh: 95,
      survivalCrisisActive: true,
      learnedTechniqueIds: ['tech_001'],
      actionPoints: 2,
    };

    // Cryo-hibernation shifts age +500 AND maxAge +500 without losing lifespan margin
    const cryo = triggerCryoHibernation(base);
    expect(cryo.ok).toBe(true);
    expect(cryo.nextState.age).toBe(1990);
    expect(cryo.nextState.maxAge).toBe(2000);
    expect(cryo.nextState.survivalCrisisActive).toBe(false);

    // Đoạt xá succeeds once, resets age to 18, drops 2 realms, sets wanted flag, forbids 2nd attempt
    const doatXa1 = triggerBodyPossession(base, rng);
    expect(doatXa1.ok).toBe(true);
    if (doatXa1.success) {
      expect(doatXa1.nextState.age).toBe(18);
      expect(doatXa1.nextState.realmIndex).toBe(3);
      expect(doatXa1.nextState.hasUsedDoatXa).toBe(true);
      expect(doatXa1.nextState.wantedByTranTheMinh).toBe(true);

      const doatXa2 = triggerBodyPossession(doatXa1.nextState, rng);
      expect(doatXa2.ok).toBe(false);
    }

    // Luân hồi grants Đạo Quả >= 10 + realm bonus and preserves 1 technique
    const legacy = triggerReincarnation(base, createEmptyLegacy(), 'tech_001');
    expect(legacy.rebirthCount).toBe(1);
    expect(legacy.daoQuaPoints).toBeGreaterThanOrEqual(10);
    expect(legacy.inheritedTechniqueIds).toContain('tech_001');
  });

  it('saves, exports, imports cleanly and rejects corrupted JSON safely', () => {
    const rng = createSeededRng(1003);
    const char = rollCharacter('Lưu Trữ', createEmptyLegacy(), rng);
    const legacy = createEmptyLegacy();

    saveToLocalStorage(char, legacy);
    const loaded = loadFromLocalStorage();
    expect(loaded.state?.name).toBe('Lưu Trữ');

    const exported = exportSaveString(char, legacy);
    const importedOk = importSaveString(exported);
    expect(importedOk.ok).toBe(true);
    expect(importedOk.state?.name).toBe('Lưu Trữ');

    const corrupted = importSaveString('{not valid json!!!');
    expect(corrupted.ok).toBe(false);

    const incomplete = importSaveString('{"version":1,"foo":"bar"}');
    expect(incomplete.ok).toBe(false);

    localStorage.setItem('nhan_sinh_tu_tien_save_v1', 'CORRUPTED_DATA');
    const safeLoad = loadFromLocalStorage();
    expect(safeLoad.state).toBeNull();
  });
});
