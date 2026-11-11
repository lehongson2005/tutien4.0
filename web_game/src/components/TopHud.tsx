import { AlertTriangle, Home, Save, ScrollText, Swords } from 'lucide-react';
import { REGIONS, SECT_RANKS, getRealmByIndex } from '../data/catalog';
import {
  calculateCombatPower,
  formatSpiritStones,
  getLuckTier,
} from '../engine/character';
import type { PlayerState } from '../types/game';

interface TopHudProps {
  state: PlayerState;
  onOpenSave: () => void;
  onOpenRoadmap: () => void;
  onBackToStart: () => void;
  onOpenCrisis: () => void;
}

const STAGE_LABELS = {
  1: 'GĐ 1: Hồng Trần Khởi Nguyên',
  2: 'GĐ 2: Thiên Kiêu Tranh Phong',
  3: 'GĐ 3: Mưu Đồ Vạn Giới',
  4: 'GĐ 4: Nghịch Thiên Cải Mệnh',
} as const;

const DAO_LABELS = {
  chua_chon: 'Chưa định Đạo Tâm',
  thuan_thien: 'Thuận Thiên',
  nghich_thien: 'Nghịch Thiên',
  trung_lap: 'Tự Tại Trung Lập',
} as const;

export function TopHud({
  state,
  onOpenSave,
  onOpenRoadmap,
  onBackToStart,
  onOpenCrisis,
}: TopHudProps) {
  const realm = getRealmByIndex(state.realmIndex);
  const power = calculateCombatPower(state);
  const luckInfo = getLuckTier(state.khiVan);
  const region = REGIONS.find((r) => r.id === state.regionId);
  const rankName = state.sectId
    ? SECT_RANKS.find((r) => r.rankOrder === state.sectRankOrder)?.name ?? 'Đệ tử'
    : 'Tán Tu Tự Do';

  const hpPct = Math.min(100, Math.max(0, Math.round((state.hp / Math.max(1, state.maxHp)) * 100)));
  const tuViPct = Math.min(
    100,
    Math.max(0, Math.round((state.tuVi / Math.max(1, state.tuViCap)) * 100))
  );
  const infiniteLife = state.maxAge >= 9_000_000_000_000;
  const nearLifespan = !infiniteLife && state.age >= state.maxAge - 30;

  return (
    <header className={`glass-panel hud-panel ${state.survivalCrisisActive ? 'crisis-alert' : ''}`}>
      <div className="hud-top-row">
        <div className="hud-identity">
          <span className="hud-name" data-testid="hud-name">
            {state.name}
          </span>
          <span className="badge badge-wip">{STAGE_LABELS[state.stage]}</span>
          <span className="badge rarity-chi_ton">{realm.name}</span>
          <span className="badge">
            <Swords size={13} color="#fbbf24" />
            Lực chiến: {power.toLocaleString('vi-VN')}
          </span>
          <span className="badge">{DAO_LABELS[state.daoAlignment]}</span>
          {state.wantedByTranTheMinh && (
            <span className="badge badge-danger">Bị Trấn Thế Minh Truy Lùng</span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
          {state.survivalCrisisActive && (
            <button type="button" className="btn btn-danger btn-sm" onClick={onOpenCrisis}>
              <AlertTriangle size={14} />
              Thọ Nguyên Cận Kề!
            </button>
          )}
          <button type="button" className="btn btn-sm" onClick={onOpenSave}>
            <Save size={14} />
            Lưu / Xuất Save
          </button>
          <button type="button" className="btn btn-primary btn-sm" onClick={onOpenRoadmap}>
            <ScrollText size={14} />
            Tiến Độ Dự Án
          </button>
          <button type="button" className="btn btn-sm" onClick={onBackToStart} aria-label="Về màn hình chính">
            <Home size={14} />
          </button>
        </div>
      </div>

      <div className="hud-metrics">
        <div className="hud-stat">
          <div className="hud-stat-label">Tuổi / Thọ Nguyên</div>
          <div
            className="hud-stat-val"
            data-testid="hud-age"
            style={{ color: nearLifespan ? 'var(--crimson)' : 'var(--text-main)' }}
          >
            {state.age.toLocaleString('vi-VN')} /{' '}
            {infiniteLife ? 'Vĩnh Hằng' : `${state.maxAge.toLocaleString('vi-VN')} năm`}
          </div>
          <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>
            {region?.name.split('(')[0] ?? 'Hạ Giới'}
          </div>
        </div>

        <div className="hud-stat">
          <div className="hud-stat-label">Sinh Mệnh (HP)</div>
          <div className="hud-stat-val">
            {state.hp.toLocaleString('vi-VN')} / {state.maxHp.toLocaleString('vi-VN')}
          </div>
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${hpPct}%`, background: 'linear-gradient(90deg, #ef4444, #f87171)' }}
            />
          </div>
        </div>

        <div className="hud-stat">
          <div className="hud-stat-label">Tu Vi Cảnh Giới</div>
          <div className="hud-stat-val">
            {state.tuVi.toLocaleString('vi-VN')} / {state.tuViCap.toLocaleString('vi-VN')}
          </div>
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${tuViPct}%`, background: 'linear-gradient(90deg, #0ea5e9, #38bdf8)' }}
            />
          </div>
        </div>

        <div className="hud-stat">
          <div className="hud-stat-label">Khí Vận & Nhân Quả</div>
          <div className="hud-stat-val" style={{ color: luckInfo.hex }}>
            {luckInfo.label} ({state.khiVan})
          </div>
          <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>
            Công đức: {state.congDuc} • Nghiệp: {state.nghiepLuc}
          </div>
        </div>

        <div className="hud-stat">
          <div className="hud-stat-label">Tài Sản & Lạm Phát</div>
          <div className="hud-stat-val" style={{ color: 'var(--gold)' }}>
            {formatSpiritStones(state.linhThach, state.realmIndex)}
          </div>
          <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>
            {state.stage === 3 ? `Lạm phát: x${state.inflationMultiplier}` : `Thể chất: ${state.physique.name}`}
          </div>
        </div>

        <div className="hud-stat">
          <div className="hud-stat-label">Hành Động & Tông Môn</div>
          <div className="hud-stat-val" style={{ color: 'var(--emerald)' }}>
            AP: {state.actionPoints} / {state.maxActionPoints}
          </div>
          <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>
            {state.sectName ? `${state.sectName} (${rankName})` : `Tán Tu • Động phủ Lv.${state.dongPhuLevel}`}
          </div>
        </div>
      </div>
    </header>
  );
}
