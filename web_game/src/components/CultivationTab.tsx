import { useState } from 'react';
import { BookOpen, Compass, Flame, ShieldCheck, Sparkles, Zap } from 'lucide-react';
import { ABILITIES, ANCIENT_TEXTS, TECHNIQUES, getRealmByIndex } from '../data/catalog';
import { LAW_LABELS } from '../engine/endgame';
import type { BreakthroughTactic, PlayerLaws, PlayerState } from '../types/game';

interface CultivationTabProps {
  state: PlayerState;
  onMeditate: () => void;
  onPurify: () => void;
  onBreakthrough: (tactic: BreakthroughTactic) => void;
  onComprehendLaw: (lawKey: keyof PlayerLaws) => void;
  onDecipherAncient: (ancientId: string) => void;
}

export function CultivationTab({
  state,
  onMeditate,
  onPurify,
  onBreakthrough,
  onComprehendLaw,
  onDecipherAncient,
}: CultivationTabProps) {
  const [innerDemon, setInnerDemon] = useState<BreakthroughTactic['innerDemon']>('ngung_than');
  const [useDoKiepDan, setUseDoKiepDan] = useState(true);
  const [useArrayDefense, setUseArrayDefense] = useState(true);
  const [selectedAncientId, setSelectedAncientId] = useState(ANCIENT_TEXTS[0]?.id ?? 'ancient_001');

  const currentRealm = getRealmByIndex(state.realmIndex);
  const nextRealm = state.realmIndex < 30 ? getRealmByIndex(state.realmIndex + 1) : null;
  const readyBreakthrough = Boolean(nextRealm && state.tuVi >= state.tuViCap);
  const elixirCount = state.inventory.filter((i) => i.category === 'elixir').reduce((a, b) => a + b.quantity, 0);

  const learnedTechs = TECHNIQUES.filter((t) => state.learnedTechniqueIds.includes(t.id));
  const learnedAbs = ABILITIES.filter((a) => state.learnedAbilityIds.includes(a.id));

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <div className="grid-2">
        <div className="sub-card">
          <h3 className="section-heading" style={{ fontSize: '1.08rem' }}>
            <Flame size={17} color="#38bdf8" />
            Bế Quan & Đan Độc
          </h3>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
            Linh căn <strong>{state.spiritRoot.name}</strong> (x{state.spiritRoot.speedMultiplier}) • Thể chất{' '}
            <strong>{state.physique.name}</strong> (x{state.physique.tuViMultiplier})
          </p>

          <div style={{ marginBottom: '0.8rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
              <span>Đan Độc Tích Tụ</span>
              <span style={{ color: state.danDoc > 75 ? 'var(--crimson)' : 'var(--emerald)' }}>
                {state.danDoc}%
              </span>
            </div>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{
                  width: `${state.danDoc}%`,
                  background: state.danDoc > 75 ? 'var(--crimson)' : '#10b981',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-primary"
              disabled={state.actionPoints < 1}
              onClick={onMeditate}
            >
              <Sparkles size={15} />
              Bế Quan Thổ Nạp (-1 AP)
            </button>
            <button
              type="button"
              className="btn"
              disabled={state.actionPoints < 1 || state.danDoc === 0}
              onClick={onPurify}
            >
              Bài Trừ Đan Độc (-1 AP)
            </button>
          </div>
        </div>

        <div className="sub-card" style={{ borderColor: readyBreakthrough ? 'var(--border-gold)' : undefined }}>
          <h3 className="section-heading" style={{ fontSize: '1.08rem' }}>
            <Zap size={17} color="#fbbf24" />
            Nghi Thức Đột Phá
          </h3>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '0.65rem' }}>
            Hiện tại: <strong>{currentRealm.name}</strong>
            {nextRealm ? ` -> Tiếp theo: ${nextRealm.name}` : ' (Đỉnh Cao Tuyệt Đối)'}
          </p>

          {nextRealm && (
            <div style={{ display: 'grid', gap: '0.55rem' }}>
              {nextRealm.requiresTamMa && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                    Phương án vượt Tâm Ma Kiếp:
                  </label>
                  <select
                    className="select-field"
                    value={innerDemon}
                    onChange={(e) => setInnerDemon(e.target.value as BreakthroughTactic['innerDemon'])}
                  >
                    <option value="ngung_than">Ngưng thần thủ nhất (Miễn phí)</option>
                    <option value="uong_dan" disabled={elixirCount === 0}>
                      Dùng Đan dược ổn định tâm thần (Còn {elixirCount} viên)
                    </option>
                    <option value="nho_dao_lu" disabled={state.companions.length === 0}>
                      Nhờ Đạo lữ hộ pháp (Hiện có {state.companions.length})
                    </option>
                  </select>
                </div>
              )}

              {nextRealm.requiresLoiKiep && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.82rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={useDoKiepDan && elixirCount > 0}
                      disabled={elixirCount === 0}
                      onChange={(e) => setUseDoKiepDan(e.target.checked)}
                    />
                    Dùng Đan hộ thể ({elixirCount})
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={useArrayDefense && Boolean(state.activeArrayUid)}
                      disabled={!state.activeArrayUid}
                      onChange={(e) => setUseArrayDefense(e.target.checked)}
                    />
                    Kích Trận pháp bảo hộ
                  </label>
                </div>
              )}

              <button
                type="button"
                className="btn btn-gold"
                disabled={!readyBreakthrough}
                onClick={() =>
                  onBreakthrough({
                    innerDemon,
                    useDoKiepDan: useDoKiepDan && elixirCount > 0,
                    useArrayDefense: useArrayDefense && Boolean(state.activeArrayUid),
                  })
                }
              >
                <ShieldCheck size={16} />
                {readyBreakthrough
                  ? `Đột Phá Lên ${nextRealm.name}`
                  : `Cần ${state.tuViCap.toLocaleString('vi-VN')} Tu vi (${Math.min(99, Math.floor((state.tuVi / state.tuViCap) * 100))}%)`}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="sub-card">
        <h3 className="section-heading" style={{ fontSize: '1.08rem' }}>
          <Compass size={17} color="#c084fc" />
          Quy Luật Đại Đạo & Thái Cổ Thần Văn (Giai Đoạn 4 / Hóa Thần+)
        </h3>

        <div className="grid-2" style={{ marginBottom: '0.85rem' }}>
          {(Object.keys(LAW_LABELS) as (keyof PlayerLaws)[]).map((lawKey) => (
            <div key={lawKey} className="stat-tile">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '0.86rem' }}>{LAW_LABELS[lawKey]}</strong>
                <span style={{ color: 'var(--purple)', fontWeight: 700 }}>{state.laws[lawKey]}%</span>
              </div>
              <div className="progress-track" style={{ marginBottom: '0.5rem' }}>
                <div
                  className="progress-fill"
                  style={{ width: `${state.laws[lawKey]}%`, background: 'linear-gradient(90deg, #9333ea, #c084fc)' }}
                />
              </div>
              <button
                type="button"
                className="btn btn-sm"
                disabled={state.actionPoints < 1 || (state.stage < 4 && state.realmIndex < 5)}
                onClick={() => onComprehendLaw(lawKey)}
              >
                Tham Ngộ (-1 AP)
              </button>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', alignItems: 'center' }}>
          <div style={{ flex: '1 1 240px' }}>
            <select
              className="select-field"
              value={selectedAncientId}
              onChange={(e) => setSelectedAncientId(e.target.value)}
            >
              {ANCIENT_TEXTS.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            disabled={state.actionPoints < 1 || state.ngoTinh < 30}
            onClick={() => onDecipherAncient(selectedAncientId)}
          >
            Bóc Tách Cổ Văn ({state.ancientProgress}% • Cần Ngộ tính ≥ 30)
          </button>
        </div>
      </div>

      <div className="grid-2">
        <div className="sub-card">
          <h3 className="section-heading" style={{ fontSize: '1.05rem' }}>
            <BookOpen size={16} color="#38bdf8" />
            Công Pháp Đã Lĩnh Ngộ ({learnedTechs.length})
          </h3>
          {learnedTechs.length === 0 ? (
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
              Chưa học Công pháp nào. Hãy chọn cơ duyên từ Biến cố, Tông môn hoặc Bí cảnh!
            </p>
          ) : (
            <div className="scroll-list">
              {learnedTechs.map((t) => (
                <div key={t.id} className="stat-tile">
                  <div className={`rarity-${t.rarity}`} style={{ fontWeight: 700, fontSize: '0.88rem' }}>
                    {t.name}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t.description}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="sub-card">
          <h3 className="section-heading" style={{ fontSize: '1.05rem' }}>
            <Sparkles size={16} color="#fbbf24" />
            Thần Thông Bản Mệnh ({learnedAbs.length})
          </h3>
          {learnedAbs.length === 0 ? (
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
              Thần thông thức tỉnh từ Bí cảnh thượng cổ hoặc giải mã Thái Cổ Thần Văn.
            </p>
          ) : (
            <div className="scroll-list">
              {learnedAbs.map((ab) => (
                <div key={ab.id} className="stat-tile">
                  <div className={`rarity-${ab.rarity}`} style={{ fontWeight: 700, fontSize: '0.88rem' }}>
                    {ab.name}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{ab.description}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
