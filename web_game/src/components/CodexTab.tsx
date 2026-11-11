import { useMemo, useState } from 'react';
import { BookOpenCheck, Lock, Search, Unlock } from 'lucide-react';
import { CODEX_CATEGORIES, CODEX_META } from '../data/catalog';
import type { PlayerState, ReincarnationLegacy } from '../types/game';

interface CodexTabProps {
  state: PlayerState;
  legacy: ReincarnationLegacy;
}

export function CodexTab({ state, legacy }: CodexTabProps) {
  const [activeCatKey, setActiveCatKey] = useState<string>(CODEX_CATEGORIES[0].key);
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyUnlocked, setOnlyUnlocked] = useState(false);
  const [showAllInCategory, setShowAllInCategory] = useState(false);

  const unlockedSet = useMemo(() => {
    return new Set([...legacy.unlockedCodexIds, ...state.codexUnlocked]);
  }, [legacy.unlockedCodexIds, state.codexUnlocked]);

  const activeCategory =
    CODEX_CATEGORIES.find((c) => c.key === activeCatKey) ?? CODEX_CATEGORIES[0];

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredItems = useMemo(() => {
    return activeCategory.items.filter((item) => {
      if (onlyUnlocked && !unlockedSet.has(item.id)) return false;
      if (!normalizedQuery) return true;
      return (
        item.name.toLowerCase().includes(normalizedQuery) ||
        item.description.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [activeCategory, normalizedQuery, onlyUnlocked, unlockedSet]);

  const visibleItems =
    normalizedQuery || showAllInCategory ? filteredItems : filteredItems.slice(0, 36);

  const totalPct = Math.min(
    100,
    Math.round((unlockedSet.size / Math.max(1, CODEX_META.totalLoreEntries)) * 100)
  );

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <div className="sub-card">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.6rem',
            marginBottom: '0.6rem',
          }}
        >
          <h3 className="section-heading" style={{ fontSize: '1.12rem', marginBottom: 0 }}>
            <BookOpenCheck size={18} color="#38bdf8" />
            Tàng Kinh Các — Bách Khoa Tu Chân ({unlockedSet.size} / {CODEX_META.totalLoreEntries} tư liệu)
          </h3>
          <span className="badge badge-wip">Hoàn thiện sưu tầm: {totalPct}%</span>
        </div>

        <div className="progress-track" style={{ marginBottom: '0.85rem' }}>
          <div
            className="progress-fill"
            style={{
              width: `${totalPct}%`,
              background: 'linear-gradient(90deg, #38bdf8, #c084fc, #fbbf24)',
            }}
          />
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.55rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 260px' }}>
            <Search
              size={15}
              color="#94a3b8"
              style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              className="input-field"
              style={{ paddingLeft: '2.2rem' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm trong Tàng Kinh Các..."
            />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.84rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={onlyUnlocked}
              onChange={(e) => setOnlyUnlocked(e.target.checked)}
            />
            Chỉ xem mục đã mở khóa
          </label>
        </div>
      </div>

      {/* Category Pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
        {CODEX_CATEGORIES.map((cat) => {
          const unlockedInCat = cat.items.filter((i) => unlockedSet.has(i.id)).length;
          return (
            <button
              key={cat.key}
              type="button"
              className={`btn btn-sm ${activeCatKey === cat.key ? 'btn-primary' : ''}`}
              onClick={() => {
                setActiveCatKey(cat.key);
                setShowAllInCategory(false);
              }}
            >
              {cat.label} ({unlockedInCat}/{cat.items.length})
            </button>
          );
        })}
      </div>

      {/* Items Grid */}
      <div className="sub-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <strong style={{ color: 'var(--jade)' }}>
            {activeCategory.label} — Hiển thị {visibleItems.length} / {filteredItems.length} mục
          </strong>
          {filteredItems.length > 36 && !normalizedQuery && (
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => setShowAllInCategory((s) => !s)}
            >
              {showAllInCategory ? 'Thu gọn danh sách' : `Xem toàn bộ ${filteredItems.length} mục`}
            </button>
          )}
        </div>

        {visibleItems.length === 0 ? (
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Không có mục nào khớp với bộ lọc hiện tại.
          </p>
        ) : (
          <div className="grid-3">
            {visibleItems.map((item) => {
              const isUnlocked = unlockedSet.has(item.id);
              return (
                <div
                  key={item.id}
                  className={`stat-tile ${isUnlocked ? `rarity-card-${item.rarity}` : ''}`}
                  style={{ opacity: isUnlocked ? 1 : 0.72 }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.4rem' }}>
                    <strong className={isUnlocked ? `rarity-${item.rarity}` : ''} style={{ fontSize: '0.88rem' }}>
                      {item.name}
                    </strong>
                    {isUnlocked ? (
                      <Unlock size={14} color="#34d399" />
                    ) : (
                      <Lock size={14} color="#64748b" />
                    )}
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                    {item.description}
                  </p>
                  <div style={{ marginTop: '0.45rem', display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                    <span className="badge">{item.rarity.toUpperCase()}</span>
                    <span className="badge">
                      {item.tier === 'than_gioi' ? 'Thần Giới' : item.tier === 'tien_gioi' ? 'Tiên Giới' : 'Hạ Giới'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
