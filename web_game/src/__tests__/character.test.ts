import { describe, it, expect } from 'vitest';
import { createSeededRng } from '../engine/rng';
import {
  calculateCombatPower,
  createEmptyLegacy,
  formatSpiritStones,
  getLuckTier,
  rollCharacter,
} from '../engine/character';

describe('Task 4: Character Gacha & Stats', () => {
  it('maps khiVan accurately across 5 color tiers', () => {
    expect(getLuckTier(10).label).toContain('Đen');
    expect(getLuckTier(25).label).toContain('Trắng');
    expect(getLuckTier(48).label).toContain('Đỏ');
    expect(getLuckTier(68).label).toContain('Vàng');
    expect(getLuckTier(88).label).toContain('Tím');
  });

  it('formats linhThach across Hạ Giới, Tiên Giới and Thần Giới safely', () => {
    expect(formatSpiritStones(-20, 1)).toBe('0 Hạ phẩm Linh thạch');
    expect(formatSpiritStones(450, 2)).toContain('4 Trung phẩm');
    expect(formatSpiritStones(250000, 11)).toContain('Tiên Thạch');
    expect(formatSpiritStones(500000000, 22)).toContain('Thần Tinh');
  });

  it('rolls valid age-0 character deterministically with legacy points', () => {
    const legacy = {
      ...createEmptyLegacy(),
      rebirthCount: 2,
      daoQuaPoints: 40,
      inheritedTechniqueIds: ['tech_003'],
    };
    const rngA = createSeededRng(12345);
    const rngB = createSeededRng(12345);

    const charA = rollCharacter('Lâm Phong', legacy, rngA, 'tech_003');
    const charB = rollCharacter('Lâm Phong', legacy, rngB, 'tech_003');

    expect(charA.age).toBe(0);
    expect(charA.stage).toBe(1);
    expect(charA.realmIndex).toBe(0);
    expect(charA.origin.id).toBe(charB.origin.id);
    expect(charA.physique.id).toBe(charB.physique.id);
    expect(charA.learnedTechniqueIds).toContain('tech_003');
    expect(charA.maxAge).toBeGreaterThanOrEqual(90);
    expect(calculateCombatPower(charA)).toBeGreaterThan(0);
  });
});
