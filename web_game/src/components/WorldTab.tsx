import { useState } from 'react';
import {
  Building2,
  Compass,
  Crown,
  Flame,
  Globe,
  HeartHandshake,
  Pickaxe,
  ShieldAlert,
  Skull,
  Swords,
  Trophy,
} from 'lucide-react';
import {
  CALAMITIES,
  OUTER_ENEMIES,
  RANKINGS,
  REGIONS,
  SECRET_REALMS,
  SECTS,
  SECT_RANKS,
} from '../data/catalog';
import type { CombatTactic, PlayerState } from '../types/game';

interface WorldTabProps {
  state: PlayerState;
  onJoinSect: (sectId: string) => void;
  onChooseTanTu: () => void;
  onFoundOwnSect: (name: string) => void;
  onPromoteSect: () => void;
  onManageMine: () => void;
  onStealLuck: () => void;
  onTravelRegion: (regionId: string) => void;
  onExploreSecretRealm: (realmId: string, tactic: CombatTactic) => void;
  onChallengeRanking: (rankingId: string, tactic: CombatTactic) => void;
  onFaceCalamity: (targetId: string, tactic: CombatTactic) => void;
}

const FACTION_LABELS: Record<string, string> = {
  all: 'Tất cả phe',
  chinh_dao: 'Chính Đạo',
  ma_dao: 'Ma Đạo',
  trung_lap: 'Trung Lập / Thương Hội',
};

const TACTIC_OPTIONS: { key: CombatTactic; label: string; hint: string }[] = [
  { key: 'phap_bao', label: 'Đấu Pháp Bảo', hint: '+35% sức mạnh nếu đã trang bị Pháp Bảo' },
  { key: 'tran_phap', label: 'Bố Trận Phòng Thủ', hint: '+35% sức mạnh khi kích hoạt Trận Pháp' },
  { key: 'hop_kich', label: 'Hợp Kích (Đạo Lữ/Linh Thú)', hint: '+40% sức mạnh khi có Đạo Lữ hoặc Linh Thú' },
  { key: 'rut_lui', label: 'Rút Lui Bảo Toàn', hint: 'An toàn né đòn, thu hoạch nhẹ không mất máu' },
];

export function WorldTab({
  state,
  onJoinSect,
  onChooseTanTu,
  onFoundOwnSect,
  onPromoteSect,
  onManageMine,
  onStealLuck,
  onTravelRegion,
  onExploreSecretRealm,
  onChallengeRanking,
  onFaceCalamity,
}: WorldTabProps) {
  const [factionFilter, setFactionFilter] = useState<'all' | 'chinh_dao' | 'ma_dao' | 'trung_lap'>('all');
  const [selectedSectId, setSelectedSectId] = useState(SECTS[0]?.id ?? 'sect_001');
  const [customSectName, setCustomSectName] = useState('');
  const [tactic, setTactic] = useState<CombatTactic>('phap_bao');
  const [selectedSecretId, setSelectedSecretId] = useState(SECRET_REALMS[0]?.id ?? 'bicanh_001');
  const [selectedRankId, setSelectedRankId] = useState(RANKINGS[0]?.id ?? 'rank_01');
  const [selectedCalamityId, setSelectedCalamityId] = useState(CALAMITIES[0]?.id ?? 'cal_001');

  const filteredSects = SECTS.filter(
    (s) => factionFilter === 'all' || s.faction === factionFilter
  );
  const effectiveSectId = filteredSects.some((s) => s.id === selectedSectId)
    ? selectedSectId
    : filteredSects[0]?.id ?? SECTS[0]?.id ?? '';
  const selectedSect = SECTS.find((s) => s.id === effectiveSectId);

  const currentRankName = state.sectId
    ? SECT_RANKS.find((r) => r.rankOrder === state.sectRankOrder)?.name ?? 'Đệ tử'
    : 'Tán Tu Tự Do';
  const nextRank = state.sectId
    ? SECT_RANKS.find((r) => r.rankOrder === state.sectRankOrder + 1)
    : null;

  const selectedSecret = SECRET_REALMS.find((r) => r.id === selectedSecretId) ?? SECRET_REALMS[0];
  const selectedRank = RANKINGS.find((r) => r.id === selectedRankId) ?? RANKINGS[0];
  const allEndgameFoes = [...CALAMITIES, ...OUTER_ENEMIES];
  const selectedFoe = allEndgameFoes.find((f) => f.id === selectedCalamityId) ?? allEndgameFoes[0];

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      {/* Sects, Tan Tu & Stage 3 Power Play */}
      <div className="sub-card">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.6rem',
            marginBottom: '0.75rem',
          }}
        >
          <h3 className="section-heading" style={{ fontSize: '1.1rem', marginBottom: 0 }}>
            <Building2 size={18} color="#38bdf8" />
            Tông Môn, Tán Tu & Quyền Lực Mỏ Linh Thạch
          </h3>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            <span className="badge badge-wip">
              {state.sectName ? `${state.sectName} (${currentRankName})` : 'Tán Tu Tự Do'}
            </span>
            <span className="badge">Cống hiến: {state.sectContribution}</span>
            <span className="badge">Động phủ Lv.{state.dongPhuLevel}</span>
            <span className="badge">Mỏ Lv.{state.mineLevel}</span>
          </div>
        </div>

        <div className="grid-2">
          <div className="stat-tile">
            <div className="stat-tile-label">Gia Nhập Thế Lực Bản Địa (100 Tông Môn)</div>
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', margin: '0.45rem 0' }}>
              {(['all', 'chinh_dao', 'ma_dao', 'trung_lap'] as const).map((fac) => (
                <button
                  key={fac}
                  type="button"
                  className={`btn btn-sm ${factionFilter === fac ? 'btn-primary' : ''}`}
                  onClick={() => setFactionFilter(fac)}
                >
                  {FACTION_LABELS[fac]}
                </button>
              ))}
            </div>

            <select
              className="select-field"
              value={effectiveSectId}
              onChange={(e) => setSelectedSectId(e.target.value)}
              aria-label="Chọn tông môn gia nhập"
            >
              {filteredSects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.tier === 'than_gioi' ? 'Thần Giới' : s.tier === 'tien_gioi' ? 'Tiên Giới' : 'Hạ Giới'})
                </option>
              ))}
            </select>

            {selectedSect && (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.45rem 0 0.65rem' }}>
                {selectedSect.description}
              </p>
            )}

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                disabled={Boolean(state.ending)}
                onClick={() => onJoinSect(effectiveSectId)}
              >
                Bái Nhập Tông Môn
              </button>
              <button
                type="button"
                className="btn btn-gold btn-sm"
                disabled={!state.sectId || !nextRank || Boolean(state.ending)}
                onClick={onPromoteSect}
              >
                <Crown size={14} />
                {nextRank ? `Thăng: ${nextRank.name}` : 'Chức Vị Tối Cao'}
              </button>
            </div>
          </div>

          <div className="stat-tile" style={{ display: 'grid', gap: '0.6rem' }}>
            <div>
              <div className="stat-tile-label">Tán Tu Động Phủ & Khai Thác Mỏ</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', marginTop: '0.45rem' }}>
                <button
                  type="button"
                  className="btn btn-emerald btn-sm"
                  disabled={Boolean(state.ending)}
                  onClick={onChooseTanTu}
                >
                  {state.dongPhuLevel === 0 ? 'Vào Tán Tu & Mở Động Phủ' : `Nâng Động Phủ Lv.${state.dongPhuLevel + 1}`}
                </button>
                <button
                  type="button"
                  className="btn btn-gold btn-sm"
                  disabled={state.actionPoints < 1 || Boolean(state.ending)}
                  onClick={onManageMine}
                >
                  <Pickaxe size={14} />
                  Khai Thác Mỏ Linh Thạch (-1 AP)
                </button>
              </div>
            </div>

            <div>
              <div className="stat-tile-label">Khai Tông Lập Phái (Cần Kim Đan+ & 2,000 LT)</div>
              <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.35rem' }}>
                <input
                  type="text"
                  className="input-field"
                  value={customSectName}
                  onChange={(e) => setCustomSectName(e.target.value)}
                  placeholder="Tên Tông Môn của bạn..."
                />
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  style={{ whiteSpace: 'nowrap' }}
                  disabled={state.realmIndex < 3 || state.linhThach < 2000 || Boolean(state.ending)}
                  onClick={() => {
                    onFoundOwnSect(customSectName);
                    setCustomSectName('');
                  }}
                >
                  Lập Phái
                </button>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                disabled={state.actionPoints < 1 || (state.realmIndex < 2 && state.stage < 3) || Boolean(state.ending)}
                onClick={onStealLuck}
              >
                <Skull size={14} />
                Hắc Ám Mưu Đồ: Tước Đoạt Khí Vận Thiên Tài (-1 AP)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Ban Do Ngu Dai Vuc */}
      <div className="sub-card">
        <h3 className="section-heading" style={{ fontSize: '1.1rem' }}>
          <Globe size={18} color="#34d399" />
          Bản Đồ Ngũ Đại Vực, Tiên Giới & Thần Giới
        </h3>
        <div className="grid-3">
          {REGIONS.map((region) => {
            const isHere = region.id === state.regionId;
            const locked =
              (region.tier === 'tien_gioi' && state.realmIndex < 11) ||
              (region.tier === 'than_gioi' && state.realmIndex < 21);

            return (
              <div
                key={region.id}
                className="stat-tile"
                style={{
                  borderColor: isHere ? 'var(--jade)' : undefined,
                  opacity: locked ? 0.65 : 1,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.35rem' }}>
                  <strong style={{ fontSize: '0.88rem', color: isHere ? 'var(--jade)' : 'var(--text-main)' }}>
                    {region.name}
                  </strong>
                  {isHere && <span className="badge badge-done">Hiện tại</span>}
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.35rem 0 0.55rem' }}>
                  {region.description}
                </p>
                <button
                  type="button"
                  className="btn btn-sm"
                  disabled={isHere || locked || state.actionPoints < 1 || Boolean(state.ending)}
                  onClick={() => onTravelRegion(region.id)}
                >
                  {locked
                    ? region.tier === 'than_gioi'
                      ? 'Cần Hạ Vị Thần'
                      : 'Cần Phi Thăng Nhân Tiên'
                    : isHere
                      ? 'Đang đóng quân'
                      : 'Ngự Bảo Di Chuyển (-1 AP)'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Combat Tactic + Secret Realms + Rankings */}
      <div className="sub-card">
        <h3 className="section-heading" style={{ fontSize: '1.1rem' }}>
          <Swords size={18} color="#fbbf24" />
          Chiến Thuật, Bí Cảnh & Bảng Xếp Hạng
        </h3>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', marginBottom: '0.85rem' }}>
          {TACTIC_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              className={`btn btn-sm ${tactic === opt.key ? 'btn-gold' : ''}`}
              title={opt.hint}
              onClick={() => setTactic(opt.key)}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="grid-2">
          <div className="stat-tile">
            <div className="stat-tile-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Compass size={14} color="#38bdf8" />
              100 Bí Cảnh & Cổ Mộ
            </div>
            <select
              className="select-field"
              style={{ marginTop: '0.4rem' }}
              value={selectedSecretId}
              onChange={(e) => setSelectedSecretId(e.target.value)}
              aria-label="Chọn bí cảnh"
            >
              {SECRET_REALMS.map((sr) => (
                <option key={sr.id} value={sr.id}>
                  {sr.name} ({sr.tier === 'than_gioi' ? 'Thần Giới' : sr.tier === 'tien_gioi' ? 'Tiên Giới' : 'Hạ Giới'})
                </option>
              ))}
            </select>
            {selectedSecret && (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.4rem 0 0.65rem' }}>
                {selectedSecret.description}
              </p>
            )}
            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={state.actionPoints < 1 || Boolean(state.ending)}
              onClick={() => onExploreSecretRealm(selectedSecretId, tactic)}
            >
              Thám Hiểm Bí Cảnh (-1 AP)
            </button>
          </div>

          <div className="stat-tile">
            <div className="stat-tile-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Trophy size={14} color="#fbbf24" />
              10 Bảng Xếp Hạng Thiên Kiêu
            </div>
            <select
              className="select-field"
              style={{ marginTop: '0.4rem' }}
              value={selectedRankId}
              onChange={(e) => setSelectedRankId(e.target.value)}
              aria-label="Chọn bảng xếp hạng"
            >
              {RANKINGS.map((rk) => (
                <option key={rk.id} value={rk.id}>
                  {rk.name} (Khuyến nghị cảnh giới ≥ {rk.minRealm})
                </option>
              ))}
            </select>
            {selectedRank && (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.4rem 0 0.65rem' }}>
                {selectedRank.description}
              </p>
            )}
            <button
              type="button"
              className="btn btn-gold btn-sm"
              disabled={state.actionPoints < 1 || Boolean(state.ending)}
              onClick={() => onChallengeRanking(selectedRankId, tactic)}
            >
              Khiêu Chiến Lôi Đài (-1 AP)
            </button>
          </div>
        </div>
      </div>

      {/* Stage 4 Calamities & Companions */}
      <div className="grid-2">
        <div className="sub-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
            <h3 className="section-heading" style={{ fontSize: '1.06rem', marginBottom: 0 }}>
              <Flame size={17} color="#f87171" />
              Đại Kiếp & Vực Ngoại (GĐ 4)
            </h3>
            <span className="badge badge-danger">
              Chu kỳ kiếp: {state.calamityCountdown} lượt
            </span>
          </div>

          <select
            className="select-field"
            value={selectedCalamityId}
            onChange={(e) => setSelectedCalamityId(e.target.value)}
            aria-label="Chọn Đại Kiếp hoặc Kẻ Địch Vực Ngoại"
          >
            {allEndgameFoes.map((foe) => (
              <option key={foe.id} value={foe.id}>
                {foe.name}
              </option>
            ))}
          </select>

          {selectedFoe && (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.45rem 0 0.65rem' }}>
              {selectedFoe.description}
            </p>
          )}

          <button
            type="button"
            className="btn btn-danger btn-sm"
            disabled={state.actionPoints < 1 || Boolean(state.ending)}
            onClick={() => onFaceCalamity(selectedCalamityId, tactic)}
          >
            <ShieldAlert size={14} />
            Nghênh Chiến Kiếp Nạn (-1 AP)
          </button>
        </div>

        <div className="sub-card">
          <h3 className="section-heading" style={{ fontSize: '1.06rem' }}>
            <HeartHandshake size={17} color="#c084fc" />
            Đạo Lữ ({state.companions.length}) & Bằng Hữu ({state.friends.length})
          </h3>
          {state.companions.length === 0 && state.friends.length === 0 ? (
            <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)' }}>
              Chưa kết giao Đạo lữ hay Bằng hữu nào. Đạo lữ giúp tăng tốc Bế quan +15% và hộ pháp vượt Tâm ma!
            </p>
          ) : (
            <div className="scroll-list" style={{ maxHeight: '220px' }}>
              {state.companions.map((comp) => (
                <div key={comp.id} className="stat-tile">
                  <strong style={{ color: 'var(--purple)', fontSize: '0.88rem' }}>
                    Đạo Lữ: {comp.name}
                  </strong>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{comp.description}</div>
                </div>
              ))}
              {state.friends.map((fr) => (
                <div key={fr.id} className="stat-tile">
                  <strong style={{ color: 'var(--jade)', fontSize: '0.88rem' }}>
                    Bằng Hữu: {fr.name}
                  </strong>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{fr.description}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
