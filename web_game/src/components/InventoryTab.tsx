import { useState } from 'react';
import {
  Backpack,
  Coins,
  FlaskConical,
  Hammer,
  Shield,
  Sparkles,
  Store,
  Wrench,
} from 'lucide-react';
import { PROFESSIONS } from '../data/catalog';
import { formatSpiritStones } from '../engine/character';
import { getActiveGuildInfo, getShopCatalog, getShopPrice } from '../engine/economy';
import type { ItemCategory, LoreEntry, PlayerState } from '../types/game';

interface InventoryTabProps {
  state: PlayerState;
  onUseElixir: (uid: string) => void;
  onEquipItem: (uid: string) => void;
  onSellItem: (uid: string) => void;
  onCraft: (mode: 'alchemy' | 'forge' | 'array', targetUid: string | null) => void;
  onLearnProfession: (professionId: string) => void;
  onTrainProfession: (professionId: string) => void;
  onBuyShopItem: (entry: LoreEntry, category: ItemCategory, basePrice: number) => void;
}

const CATEGORY_LABELS: Record<ItemCategory | 'all', string> = {
  all: 'Tất cả',
  elixir: 'Đan dược',
  herb: 'Linh thảo',
  artifact: 'Pháp bảo',
  array: 'Trận pháp',
  beast: 'Linh thú',
  relic: 'Chí bảo',
};

export function InventoryTab({
  state,
  onUseElixir,
  onEquipItem,
  onSellItem,
  onCraft,
  onLearnProfession,
  onTrainProfession,
  onBuyShopItem,
}: InventoryTabProps) {
  const [filterCat, setFilterCat] = useState<ItemCategory | 'all'>('all');
  const [selectedProfessionId, setSelectedProfessionId] = useState(PROFESSIONS[0]?.id ?? '');

  const guild = getActiveGuildInfo(state);
  const shopItems = getShopCatalog(state);

  const equippedArtifact = state.inventory.find((i) => i.uid === state.equippedArtifactUid);
  const activeArray = state.inventory.find((i) => i.uid === state.activeArrayUid);
  const activeBeast = state.inventory.find((i) => i.uid === state.activeBeastUid);

  const visibleItems = state.inventory.filter(
    (item) => filterCat === 'all' || item.category === filterCat
  );

  const herbCount = state.inventory
    .filter((i) => i.category === 'herb')
    .reduce((acc, item) => acc + item.quantity, 0);
  const forgeTarget =
    equippedArtifact ??
    state.inventory.find((i) => i.category === 'artifact' || i.category === 'relic') ??
    null;
  const forgeCost = forgeTarget ? Math.max(40, forgeTarget.level * 60) : 40;
  const arrayCost = Math.max(60, Math.round(120 * state.inflationMultiplier));

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      {/* Active Loadout Summary */}
      <div className="sub-card">
        <h3 className="section-heading" style={{ fontSize: '1.08rem' }}>
          <Shield size={17} color="#38bdf8" />
          Trang Bị Đang Kích Hoạt
        </h3>
        <div className="grid-3">
          <div className="stat-tile">
            <div className="stat-tile-label">Pháp Bảo / Chí Bảo</div>
            <div
              className={`stat-tile-value ${equippedArtifact ? `rarity-${equippedArtifact.rarity}` : ''}`}
              style={{ fontSize: '0.92rem' }}
            >
              {equippedArtifact
                ? `${equippedArtifact.name} (+${equippedArtifact.level})`
                : 'Chưa trang bị'}
            </div>
            <div className="stat-tile-desc">
              {equippedArtifact
                ? `Lực chiến +${Math.round(equippedArtifact.powerBonus * (1 + (equippedArtifact.level - 1) * 0.35)).toLocaleString('vi-VN')}`
                : 'Tìm từ Bí cảnh hoặc mua tại Vạn Bảo Các.'}
            </div>
          </div>

          <div className="stat-tile">
            <div className="stat-tile-label">Trận Pháp Hộ Thân</div>
            <div
              className={`stat-tile-value ${activeArray ? `rarity-${activeArray.rarity}` : ''}`}
              style={{ fontSize: '0.92rem' }}
            >
              {activeArray ? activeArray.name : 'Chưa bày trận'}
            </div>
            <div className="stat-tile-desc">
              {activeArray
                ? `Hộ pháp Lôi kiếp & giảm 32% sát thương thiên phạt`
                : 'Giúp giảm sát thương khi vượt Lôi kiếp & Đại kiếp.'}
            </div>
          </div>

          <div className="stat-tile">
            <div className="stat-tile-label">Linh Thú Đồng Hành</div>
            <div
              className={`stat-tile-value ${activeBeast ? `rarity-${activeBeast.rarity}` : ''}`}
              style={{ fontSize: '0.92rem' }}
            >
              {activeBeast ? activeBeast.name : 'Chưa triệu hồi'}
            </div>
            <div className="stat-tile-desc">
              {activeBeast
                ? `Hợp kích Bí cảnh (+${Math.round(activeBeast.powerBonus * 0.9).toLocaleString('vi-VN')} lực chiến)`
                : 'Thu phục trong Bí cảnh hoặc đấu giá thương hội.'}
            </div>
          </div>
        </div>
      </div>

      {/* Inventory & Crafting */}
      <div className="grid-2">
        <div className="sub-card">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.5rem',
              marginBottom: '0.75rem',
            }}
          >
            <h3 className="section-heading" style={{ fontSize: '1.08rem', marginBottom: 0 }}>
              <Backpack size={17} color="#fbbf24" />
              Túi Trữ Vật ({state.inventory.length})
            </h3>
            <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
              {(Object.keys(CATEGORY_LABELS) as (ItemCategory | 'all')[]).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`btn btn-sm ${filterCat === cat ? 'btn-primary' : ''}`}
                  onClick={() => setFilterCat(cat)}
                >
                  {CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>
          </div>

          {visibleItems.length === 0 ? (
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
              Khoang chứa trống. Hãy tham gia Biến cố, Thám hiểm Bí cảnh hoặc mua đồ tại Vạn Bảo Các.
            </p>
          ) : (
            <div className="scroll-list">
              {visibleItems.map((item) => {
                const isEquipped =
                  state.equippedArtifactUid === item.uid ||
                  state.activeArrayUid === item.uid ||
                  state.activeBeastUid === item.uid;
                const canEquip =
                  item.category === 'artifact' ||
                  item.category === 'relic' ||
                  item.category === 'array' ||
                  item.category === 'beast';

                return (
                  <div key={item.uid} className={`stat-tile rarity-card-${item.rarity}`}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '0.5rem',
                      }}
                    >
                      <strong className={`rarity-${item.rarity}`} style={{ fontSize: '0.9rem' }}>
                        {item.name} {item.level > 1 ? `(+${item.level})` : ''} x{item.quantity}
                      </strong>
                      <span className="badge">
                        {CATEGORY_LABELS[item.category]} • {item.rarity.toUpperCase()}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.79rem', color: 'var(--text-muted)', margin: '0.3rem 0 0.5rem' }}>
                      {item.description}
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      {item.category === 'elixir' && (
                        <button
                          type="button"
                          className="btn btn-emerald btn-sm"
                          disabled={Boolean(state.ending)}
                          onClick={() => onUseElixir(item.uid)}
                        >
                          Uống Đan
                        </button>
                      )}
                      {canEquip && (
                        <button
                          type="button"
                          className={`btn btn-sm ${isEquipped ? 'btn-gold' : 'btn-primary'}`}
                          disabled={Boolean(state.ending)}
                          onClick={() => onEquipItem(item.uid)}
                        >
                          {isEquipped ? 'Tháo / Thu hồi' : 'Trang bị / Kích hoạt'}
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn btn-sm"
                        disabled={Boolean(state.ending)}
                        onClick={() => onSellItem(item.uid)}
                      >
                        <Coins size={13} />
                        Bán
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Workshop & Professions */}
        <div style={{ display: 'grid', gap: '1rem' }}>
          <div className="sub-card">
            <h3 className="section-heading" style={{ fontSize: '1.08rem' }}>
              <Hammer size={17} color="#c084fc" />
              Xưởng Chế Tác Tiên Gia
            </h3>
            <div style={{ display: 'grid', gap: '0.55rem' }}>
              <button
                type="button"
                className="btn btn-emerald"
                disabled={state.actionPoints < 1 || herbCount === 0 || Boolean(state.ending)}
                onClick={() => onCraft('alchemy', null)}
              >
                <FlaskConical size={16} />
                Luyện Đan Từ Linh Thảo (-1 AP • Hiện có {herbCount} thảo)
              </button>

              <button
                type="button"
                className="btn btn-gold"
                disabled={
                  state.actionPoints < 1 ||
                  !forgeTarget ||
                  state.linhThach < forgeCost ||
                  Boolean(state.ending)
                }
                onClick={() => onCraft('forge', forgeTarget?.uid ?? null)}
              >
                <Hammer size={16} />
                Tôi Luyện {forgeTarget ? forgeTarget.name : 'Pháp Bảo'} (-1 AP • {forgeCost} LT)
              </button>

              <button
                type="button"
                className="btn btn-primary"
                disabled={
                  state.actionPoints < 1 ||
                  state.linhThach < arrayCost ||
                  Boolean(state.ending)
                }
                onClick={() => onCraft('array', null)}
              >
                <Sparkles size={16} />
                Khắc Trận Pháp Hộ Thân (-1 AP • {arrayCost} LT)
              </button>
            </div>
          </div>

          <div className="sub-card">
            <h3 className="section-heading" style={{ fontSize: '1.08rem' }}>
              <Wrench size={17} color="#34d399" />
              Nghề Phụ ({state.professions.length}/2)
            </h3>

            <div style={{ display: 'flex', gap: '0.45rem', marginBottom: '0.75rem' }}>
              <select
                className="select-field"
                value={selectedProfessionId}
                onChange={(e) => setSelectedProfessionId(e.target.value)}
                aria-label="Chọn chức nghiệp phụ"
              >
                {PROFESSIONS.map((prof) => (
                  <option key={prof.id} value={prof.id}>
                    {prof.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                style={{ whiteSpace: 'nowrap' }}
                disabled={state.professions.length >= 2 || Boolean(state.ending)}
                onClick={() => onLearnProfession(selectedProfessionId)}
              >
                Bái Sư
              </button>
            </div>

            {state.professions.length === 0 ? (
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Chọn từ 30 chức nghiệp (Luyện Đan Sư, Luyện Khí Sư, Trận Pháp Sư, Ngự Thú Sư...) để kiếm thêm linh thạch và ngộ tính.
              </p>
            ) : (
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                {state.professions.map((p) => (
                  <div key={p.id} className="stat-tile">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '0.88rem' }}>
                        {p.name} (Phẩm {p.tierLevel})
                      </strong>
                      <button
                        type="button"
                        className="btn btn-sm"
                        disabled={state.actionPoints < 1 || Boolean(state.ending)}
                        onClick={() => onTrainProfession(p.id)}
                      >
                        Rèn Luyện (-1 AP)
                      </button>
                    </div>
                    <div className="progress-track">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${Math.min(100, p.exp)}%`,
                          background: 'linear-gradient(90deg, #10b981, #38bdf8)',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Van Bao Cac Shop */}
      <div className="sub-card">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.6rem',
            marginBottom: '0.85rem',
          }}
        >
          <div>
            <h3 className="section-heading" style={{ fontSize: '1.12rem', marginBottom: '0.2rem' }}>
              <Store size={18} color="#fbbf24" />
              {guild.name.includes('Vạn Bảo Các')
                ? guild.name
                : `Vạn Bảo Các — ${guild.name}`}
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{guild.description}</p>
          </div>
          <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
            <span className={`badge ${state.inflationMultiplier >= 1.8 ? 'badge-warn' : 'badge-wip'}`}>
              Chỉ số Lạm phát: x{state.inflationMultiplier}
            </span>
            <span className="badge">
              Tài sản: {formatSpiritStones(state.linhThach, state.realmIndex)}
            </span>
          </div>
        </div>

        <div className="grid-3">
          {shopItems.map((shopItem) => {
            const finalPrice = getShopPrice(shopItem.basePrice, state);
            const affordable = state.linhThach >= finalPrice;

            return (
              <div
                key={`${shopItem.category}_${shopItem.entry.id}`}
                className={`stat-tile rarity-card-${shopItem.entry.rarity}`}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.4rem' }}>
                  <strong className={`rarity-${shopItem.entry.rarity}`} style={{ fontSize: '0.88rem' }}>
                    {shopItem.entry.name}
                  </strong>
                  <span className="badge">{CATEGORY_LABELS[shopItem.category]}</span>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.35rem 0 0.6rem' }}>
                  {shopItem.entry.description}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: affordable ? 'var(--gold)' : 'var(--crimson)' }}>
                    {finalPrice.toLocaleString('vi-VN')} LT
                  </span>
                  <button
                    type="button"
                    className="btn btn-gold btn-sm"
                    disabled={!affordable || Boolean(state.ending)}
                    onClick={() => onBuyShopItem(shopItem.entry, shopItem.category, shopItem.basePrice)}
                  >
                    Mua
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
