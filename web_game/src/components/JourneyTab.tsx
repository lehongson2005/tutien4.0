import { AlertCircle, FastForward, Flame, ShieldAlert, Sparkles } from 'lucide-react';
import { canSelectChoice, computeChoiceSuccessChance, getStepYears } from '../engine/events';
import type { ChoiceOption, GameEvent, PlayerState } from '../types/game';

interface JourneyTabProps {
  state: PlayerState;
  lastOutcome: string | null;
  onSelectChoice: (event: GameEvent, key: 'A' | 'B' | 'C') => void;
  onAdvanceTime: () => void;
  onSetStage2Step: (step: 2 | 5) => void;
  onQuickMeditate: () => void;
  onOpenCrisis: () => void;
  onOpenEnding: () => void;
}

export function JourneyTab({
  state,
  lastOutcome,
  onSelectChoice,
  onAdvanceTime,
  onSetStage2Step,
  onQuickMeditate,
  onOpenCrisis,
  onOpenEnding,
}: JourneyTabProps) {
  const stepYears = getStepYears(state);
  const ev = state.currentEvent;

  const renderChoice = (choice: ChoiceOption) => {
    const allowed = canSelectChoice(state, choice);
    const chancePct = Math.round(computeChoiceSuccessChance(state, choice) * 100);
    return (
      <button
        key={choice.key}
        type="button"
        data-testid="event-choice-btn"
        className="choice-btn"
        disabled={!allowed || Boolean(state.ending)}
        onClick={() => ev && onSelectChoice(ev, choice.key)}
      >
        <div>
          <span className="choice-key">{choice.key}</span>
          <span>{choice.label}</span>
          {choice.requirement && (
            <div
              style={{
                fontSize: '0.77rem',
                marginTop: '0.32rem',
                color: allowed ? 'var(--emerald)' : 'var(--crimson)',
              }}
            >
              {allowed ? 'Đủ điều kiện:' : 'Thiếu điều kiện:'} {choice.requirement.label}
            </div>
          )}
        </div>
        <span className="badge" style={{ flexShrink: 0 }}>
          {chancePct}%
        </span>
      </button>
    );
  };

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      {state.ending && (
        <div
          className="sub-card"
          style={{
            borderColor: 'var(--border-gold)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '0.75rem',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <strong style={{ color: 'var(--gold)' }}>{state.ending.title}</strong>
            <div style={{ fontSize: '0.83rem', color: 'var(--text-muted)' }}>
              {state.ending.summary}
            </div>
          </div>
          <button type="button" className="btn btn-gold btn-sm" onClick={onOpenEnding}>
            Mở Kết Cục & Luân Hồi
          </button>
        </div>
      )}

      {state.survivalCrisisActive && !state.ending && (
        <div className="sub-card crisis-alert" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--crimson)' }}>
            <ShieldAlert size={18} />
            <strong>
              Thọ nguyên chỉ còn {Math.max(0, state.maxAge - state.age)} năm! Chọn Đoạt Xá, Luân Hồi hoặc Xác Ướp ngay.
            </strong>
          </div>
          <button type="button" className="btn btn-danger btn-sm" onClick={onOpenCrisis}>
            Mở Bảng Sinh Tồn
          </button>
        </div>
      )}

      {ev ? (
        <div className="event-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <span className="badge badge-wip">
              Biến cố #{ev.numId} • Phân đoạn {ev.subStage} tuổi
            </span>
            {ev.oneTime && <span className="badge badge-warn">Cột Mốc Quan Trọng</span>}
          </div>

          <p className="event-prompt">{ev.title}</p>

          <div className="choice-list">{ev.choices.map(renderChoice)}</div>
        </div>
      ) : (
        <div className="sub-card" style={{ borderColor: 'var(--border-jade)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--jade)', fontWeight: 700, marginBottom: '0.45rem' }}>
            <Sparkles size={17} />
            Kết Quả Biến Cố Vừa Qua
          </div>
          <p style={{ marginBottom: '1rem', lineHeight: 1.6 }}>
            {lastOutcome ?? 'Nhân sinh tĩnh lặng trôi qua. Hãy chọn tu luyện hoặc tiếp tục tiến bước thời gian.'}
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-primary"
              disabled={Boolean(state.ending)}
              onClick={onAdvanceTime}
            >
              <FastForward size={16} />
              Sống tiếp {stepYears.toLocaleString('vi-VN')} năm (+{state.maxActionPoints} AP)
            </button>

            <button
              type="button"
              className="btn btn-gold"
              disabled={state.actionPoints < 1 || Boolean(state.ending)}
              onClick={onQuickMeditate}
            >
              <Flame size={16} />
              Bế Quan Nhanh (-1 AP)
            </button>

            {state.stage === 2 && (
              <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', marginLeft: 'auto' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Nhịp năm GĐ2:</span>
                <button
                  type="button"
                  className={`btn btn-sm ${state.stage2StepYears === 2 ? 'btn-primary' : ''}`}
                  onClick={() => onSetStage2Step(2)}
                >
                  2 năm
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${state.stage2StepYears === 5 ? 'btn-primary' : ''}`}
                  onClick={() => onSetStage2Step(5)}
                >
                  5 năm
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {state.stage === 2 && state.realmIndex < 2 && (
        <div className="sub-card" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.84rem', color: 'var(--gold)' }}>
          <AlertCircle size={16} />
          Lưu ý Giai đoạn 2: Trước 100 tuổi phải đột phá lên Trúc Cơ (hoặc uống Thọ Nguyên Đan), nếu không sẽ kết thúc kiếp sống vì già chết!
        </div>
      )}
    </div>
  );
}
