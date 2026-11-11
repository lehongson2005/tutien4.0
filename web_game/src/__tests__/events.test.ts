import { describe, it, expect } from 'vitest';
import { createSeededRng } from '../engine/rng';
import { createEmptyLegacy, rollCharacter } from '../engine/character';
import {
  advanceTimeStep,
  canSelectChoice,
  getStepYears,
  pickEventForState,
  resolveChoice,
} from '../engine/events';
import { EVENTS_BY_STAGE } from '../data/catalog';

describe('Task 5: Event Engine & 4-Stage Loop', () => {
  it('picks subStage-appropriate events in Stage 1 and never exhausts event pool', () => {
    const rng = createSeededRng(101);
    const char = rollCharacter('Hàn Lập', createEmptyLegacy(), rng);

    const evInfant = pickEventForState({ ...char, age: 1, stage: 1 }, rng);
    expect(evInfant.stage).toBe(1);
    expect(evInfant.subStage).toBe('0-3');

    const evYouth = pickEventForState({ ...char, age: 13, stage: 1 }, rng);
    expect(evYouth.subStage).toBe('11-15');

    // Exhaust all Stage 1 IDs: must gracefully reuse non-oneTime events without returning undefined
    const allStage1Ids = EVENTS_BY_STAGE[1].map((e) => e.id);
    const exhaustedState = { ...char, age: 16, stage: 1 as const, usedEventIds: allStage1Ids };
    const fallbackEv = pickEventForState(exhaustedState, rng);
    expect(fallbackEv).toBeDefined();
    expect(fallbackEv.oneTime).toBe(false);
  });

  it('enforces Stage 2 Age-100 mortality gate when realmIndex < Trúc Cơ and maxAge <= 100', () => {
    const rng = createSeededRng(202);
    const base = rollCharacter('Phàm Tu', createEmptyLegacy(), rng);
    const oldMortal = {
      ...base,
      age: 98,
      maxAge: 100,
      stage: 2 as const,
      stage2StepYears: 5 as const,
      realmIndex: 1, // Luyện Khí (< Trúc Cơ 2)
    };

    const next = advanceTimeStep(oldMortal, rng);
    expect(next.ending).not.toBeNull();
    expect(next.ending?.type).toBe('death');
    expect(next.age).toBe(100);
  });

  it('allows passing Age 100 if player reached Trúc Cơ or boosted maxAge > 103 via elixir', () => {
    const rng = createSeededRng(303);
    const base = rollCharacter('Thọ Tinh', createEmptyLegacy(), rng);

    const elixirExtended = {
      ...base,
      age: 98,
      maxAge: 140,
      stage: 2 as const,
      stage2StepYears: 5 as const,
      realmIndex: 1,
    };
    const res1 = advanceTimeStep(elixirExtended, rng);
    expect(res1.ending).toBeNull();
    expect(res1.age).toBe(103);
    expect(res1.stage).toBe(3);

    const trucCo = {
      ...base,
      age: 98,
      maxAge: 300,
      stage: 2 as const,
      stage2StepYears: 5 as const,
      realmIndex: 2, // Trúc Cơ
    };
    const res2 = advanceTimeStep(trucCo, rng);
    expect(res2.ending).toBeNull();
    expect(res2.stage).toBe(3);
  });

  it('clamps huge Stage 4 time jumps at maxAge survival crisis instead of instant death skip', () => {
    const rng = createSeededRng(404);
    const base = rollCharacter('Lão Quái', createEmptyLegacy(), rng);
    const stage4Elder = {
      ...base,
      age: 4950,
      maxAge: 5000,
      stage: 4 as const,
      realmIndex: 6, // Luyện Hư -> stepYears = 150
    };

    expect(getStepYears(stage4Elder)).toBe(150);
    const next = advanceTimeStep(stage4Elder, rng);
    expect(next.ending).toBeNull();
    expect(next.survivalCrisisActive).toBe(true);
    expect(next.age).toBeLessThan(next.maxAge);
  });

  it('checks choice requirements and applies deterministic outcome changes', () => {
    const rng = createSeededRng(505);
    const char = rollCharacter('Kiếm Tu', createEmptyLegacy(), rng);
    const ev = EVENTS_BY_STAGE[1][0];
    const choiceA = ev.choices[0];

    expect(canSelectChoice(char, choiceA)).toBe(true);
    const lockedSample = {
      ...choiceA,
      requirement: { minStat: { ngoTinh: 9999 }, label: 'Cần Ngộ tính ≥ 9999' },
    };
    expect(canSelectChoice(char, lockedSample)).toBe(false);

    const { nextState, outcomeText } = resolveChoice({ ...char, currentEvent: ev }, ev, 'A', rng);
    expect(outcomeText.length).toBeGreaterThan(5);
    expect(nextState.currentEvent).toBeNull();
    expect(nextState.usedEventIds).toContain(ev.id);
  });
});
