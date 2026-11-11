import { useState } from 'react';
import { Dices, Play, RotateCcw, ScrollText, Sparkles, Upload } from 'lucide-react';
import { REALMS, TECHNIQUES } from '../data/catalog';
import { PROJECT_MILESTONES, getCompletionPercent } from './RoadmapModal';
import type { PlayerState, ReincarnationLegacy } from '../types/game';

interface StartScreenProps {
  legacy: ReincarnationLegacy;
  hasSavedRun: boolean;
  savedRunName?: string;
  draftChar: PlayerState | null;
  playerName: string;
  inheritedTechId: string;
  onNameChange: (val: string) => void;
  onInheritedTechChange: (id: string) => void;
  onRollDraft: () => void;
  onConfirmStart: () => void;
  onResumeSaved: () => void;
  onOpenSaveModal: () => void;
  onOpenRoadmap: () => void;
}

const STAGES = [
  {
    title: '0 — 18 Tuổi: Hồng Trần Khởi Nguyên',
    desc: 'Gacha 100 thân thế & 200 căn cốt, vượt 200 biến cố tuổi thơ, chọn Đạo tâm Thuận Thiên / Nghịch Thiên / Tán Tu.',
  },
  {
    title: '18 — 100 Tuổi: Thiên Kiêu Tranh Phong',
    desc: 'Tu luyện Luyện Khí -> Trúc Cơ -> Kim Đan, leo Bảng Xếp Hạng, bắt 200 Linh thú, tìm Đạo lữ. Rủi ro: Chết già nếu < Trúc Cơ ở tuổi 100.',
  },
  {
    title: '100 — 500 Tuổi: Mưu Đồ Vạn Giới',
    desc: 'Trưởng lão / Chưởng môn / Tán Tu Động phủ, điều hành Mỏ linh thạch, chống Lạm phát Linh thạch, Chí bảo Trấn phái & Cướp Khí vận.',
  },
  {
    title: '500+ Tuổi: Nghịch Thiên Cải Mệnh',
    desc: 'Tu Quy luật Thời/Không/Nhân quả/Hỗn độn, giải mã Thái Cổ Thần Văn, chống Đại Kiếp & 3 tuyệt kỹ Đoạt Xá / Luân Hồi / Xác Ướp.',
  },
];

export function StartScreen({
  legacy,
  hasSavedRun,
  savedRunName,
  draftChar,
  playerName,
  inheritedTechId,
  onNameChange,
  onInheritedTechChange,
  onRollDraft,
  onConfirmStart,
  onResumeSaved,
  onOpenSaveModal,
  onOpenRoadmap,
}: StartScreenProps) {
  const [showStages, setShowStages] = useState(true);
  const percent = getCompletionPercent();
  const activeStep =
    PROJECT_MILESTONES.find((m) => m.status === 'in_progress') ??
    PROJECT_MILESTONES[PROJECT_MILESTONES.length - 1];

  const inheritedOptions = legacy.inheritedTechniqueIds
    .map((id) => TECHNIQUES.find((t) => t.id === id))
    .filter((t): t is NonNullable<typeof t> => Boolean(t));

  return (
    <div className="app-shell">
      <header className="glass-panel top-bar">
        <div className="brand-meta">
          <span className="live-dot" aria-hidden="true" />
          <span>Nhân Sinh Tu Tiên • Kho 36 Tư Liệu & 370 Biến Cố</span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-sm" onClick={onOpenSaveModal}>
            <Upload size={15} />
            Nhập / Xuất Save
          </button>
          <button type="button" className="btn btn-primary btn-sm" onClick={onOpenRoadmap}>
            <ScrollText size={15} />
            Tiến Độ Dự Án ({percent}%)
          </button>
        </div>
      </header>

      <section className="glass-panel hero-card">
        <h1 className="hero-title">Nhân Sinh Tu Tiên</h1>
        <p className="hero-subtitle">
          Từ phàm nhân bước vào tiên lộ: mọi quyết định A/B/C đều định đoạt công đức, nghiệp lực,
          cảnh giới, cơ duyên và cái kết xuyên suốt 4 giai đoạn cuộc đời.
        </p>

        <div
          className="sub-card"
          style={{ maxWidth: '640px', margin: '0 auto 1.2rem', textAlign: 'left' }}
        >
          <div className="grid-2" style={{ alignItems: 'end' }}>
            <div>
              <label
                htmlFor="cultivator-name"
                style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}
              >
                Đạo hiệu tu sĩ
              </label>
              <input
                id="cultivator-name"
                type="text"
                className="input-field"
                value={playerName}
                onChange={(e) => onNameChange(e.target.value)}
                placeholder="VD: Hàn Lập, Diệp Phàm, Tiêu Viêm..."
              />
            </div>

            {inheritedOptions.length > 0 && (
              <div>
                <label
                  htmlFor="inherited-tech"
                  style={{ display: 'block', fontSize: '0.82rem', color: 'var(--gold)', marginBottom: '0.35rem' }}
                >
                  Công pháp truyền kiếp (Di sản)
                </label>
                <select
                  id="inherited-tech"
                  className="select-field"
                  value={inheritedTechId}
                  onChange={(e) => onInheritedTechChange(e.target.value)}
                >
                  {inheritedOptions.map((tech) => (
                    <option key={tech.id} value={tech.id}>
                      {tech.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.65rem',
              marginTop: '1rem',
              justifyContent: 'center',
            }}
          >
            {hasSavedRun && (
              <button type="button" className="btn btn-emerald" onClick={onResumeSaved}>
                <Play size={16} />
                Chơi Tiếp ({savedRunName})
              </button>
            )}

            <button type="button" className="btn btn-gold" onClick={onRollDraft}>
              <Dices size={17} />
              {draftChar ? 'Đổ Lại Xí Ngầu Mệnh Cách' : 'Đổ Xí Ngầu Khởi Nguyên'}
            </button>

            {draftChar && (
              <button type="button" className="btn btn-primary" onClick={onConfirmStart}>
                <Sparkles size={17} />
                Bước Vào Tu Chân Giới
              </button>
            )}
          </div>
        </div>

        {draftChar && (
          <div className="sub-card" style={{ textAlign: 'left', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <strong style={{ fontSize: '1.05rem', color: 'var(--jade)' }}>
                Mệnh Cách Tuổi 0: {draftChar.name}
              </strong>
              <span className="badge badge-wip">
                Thọ nguyên khởi đầu: {draftChar.maxAge} năm • Linh thạch: {draftChar.linhThach}
              </span>
            </div>

            <div className="preview-stats">
              <div className="stat-tile">
                <div className="stat-tile-label">Xuất Thân ({draftChar.origin.rarity.toUpperCase()})</div>
                <div className={`stat-tile-value rarity-${draftChar.origin.rarity}`}>
                  {draftChar.origin.name}
                </div>
                <div className="stat-tile-desc">{draftChar.origin.description}</div>
              </div>

              <div className="stat-tile">
                <div className="stat-tile-label">Thể Chất ({draftChar.physique.rarity.toUpperCase()})</div>
                <div className={`stat-tile-value rarity-${draftChar.physique.rarity}`}>
                  {draftChar.physique.name}
                </div>
                <div className="stat-tile-desc">{draftChar.physique.description}</div>
              </div>

              <div className="stat-tile">
                <div className="stat-tile-label">Linh Căn (Tư Chất)</div>
                <div className={`stat-tile-value rarity-${draftChar.spiritRoot.rarity}`}>
                  {draftChar.spiritRoot.name} (x{draftChar.spiritRoot.speedMultiplier})
                </div>
                <div className="stat-tile-desc">{draftChar.spiritRoot.description}</div>
              </div>

              <div className="stat-tile">
                <div className="stat-tile-label">Khí Vận & Mệnh Cách</div>
                <div className="stat-tile-value" style={{ color: draftChar.luck.colorHex }}>
                  {draftChar.luck.name} ({draftChar.khiVan})
                </div>
                <div className="stat-tile-desc">
                  <strong>{draftChar.fate.name}:</strong> {draftChar.fate.description}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="sub-card" style={{ textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.88rem' }}>
            <span>
              <strong>Di Sản Luân Hồi:</strong> {legacy.rebirthCount} kiếp •{' '}
              <span style={{ color: 'var(--gold)' }}>{legacy.daoQuaPoints} Đạo Quả</span> • Đỉnh cao:{' '}
              {REALMS[legacy.bestRealmIndex]?.name ?? 'Phàm Nhân'}
            </span>
            <span style={{ color: 'var(--jade)' }}>
              Tiến độ web: {percent}% ({activeStep.title})
            </span>
          </div>
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{
                width: `${percent}%`,
                background: 'linear-gradient(90deg, #38bdf8, #34d399)',
              }}
            />
          </div>
        </div>
      </section>

      <section className="glass-panel workspace-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
          <h2 className="section-heading" style={{ marginBottom: 0 }}>
            <RotateCcw size={18} color="#38bdf8" />
            4 Giai Đoạn Đời Tu Sĩ
          </h2>
          <button type="button" className="btn btn-sm" onClick={() => setShowStages((s) => !s)}>
            {showStages ? 'Thu gọn' : 'Mở rộng'}
          </button>
        </div>

        {showStages && (
          <div className="grid-2">
            {STAGES.map((st) => (
              <div key={st.title} className="sub-card">
                <div style={{ fontWeight: 700, color: 'var(--jade)', fontSize: '0.94rem' }}>
                  {st.title}
                </div>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                  {st.desc}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
