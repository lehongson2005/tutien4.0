import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Award,
  Check,
  Copy,
  RefreshCw,
  ShieldAlert,
  Snowflake,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { TECHNIQUES, getRealmByIndex } from '../data/catalog';
import { exportSaveString } from '../engine/save';
import type { PlayerState, ReincarnationLegacy } from '../types/game';

interface ModalOverlayProps {
  modalType: 'crisis' | 'ending' | 'save' | null;
  state: PlayerState | null;
  legacy: ReincarnationLegacy;
  onClose: () => void;
  onDoatXa: () => void;
  onCryoSleep: () => void;
  onReincarnate: (inheritedTechniqueId?: string) => void;
  onImportSave: (jsonStr: string) => { ok: boolean; error?: string };
  onClearLocalSave: () => void;
}

export function ModalOverlay({
  modalType,
  state,
  legacy,
  onClose,
  onDoatXa,
  onCryoSleep,
  onReincarnate,
  onImportSave,
  onClearLocalSave,
}: ModalOverlayProps) {
  const [selectedTechId, setSelectedTechId] = useState<string>('');
  const [importInput, setImportInput] = useState('');
  const [importFeedback, setImportFeedback] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    if (state && state.learnedTechniqueIds.length > 0) {
      setSelectedTechId(state.learnedTechniqueIds[0]);
    } else {
      setSelectedTechId('');
    }
    setImportFeedback(null);
    setCopied(false);
    setConfirmClear(false);
  }, [modalType, state]);

  if (!modalType) return null;

  const learnedTechOptions = state
    ? state.learnedTechniqueIds
        .map((id) => TECHNIQUES.find((t) => t.id === id))
        .filter((t): t is NonNullable<typeof t> => Boolean(t))
    : [];

  if (modalType === 'crisis' && state) {
    return (
      <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Bảng Sinh Tồn Cận Tử">
        <div className="glass-panel modal-card">
          <div className="modal-header">
            <div>
              <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1.35rem', color: 'var(--crimson)' }}>
                <ShieldAlert size={20} style={{ verticalAlign: 'text-bottom', marginRight: '0.4rem' }} />
                Thọ Nguyên Cận Kề ({state.age} / {state.maxAge} năm)
              </h2>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                Đại hạn sắp điểm! Hãy chọn một trong 3 phương án nghịch thiên để kéo dài cơ duyên hoặc luân hồi.
              </p>
            </div>
            <button type="button" className="btn btn-sm" onClick={onClose} aria-label="Đóng bảng sinh tồn">
              <X size={16} />
            </button>
          </div>

          <div style={{ display: 'grid', gap: '0.85rem' }}>
            <div className="sub-card">
              <strong style={{ color: 'var(--gold)' }}>1. Đoạt Xá Trọng Sinh (Chỉ 1 lần mỗi kiếp)</strong>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0.35rem 0 0.6rem' }}>
                Yêu cầu Trúc Cơ+. Chiếm đoạt nhục thân thiên tài 18 tuổi, giữ lại công pháp và quy luật, cảnh giới tụt 2 bậc và bị Trấn Thế Minh truy xét.
              </p>
              <button
                type="button"
                className="btn btn-gold btn-sm"
                disabled={state.hasUsedDoatXa || state.realmIndex < 2}
                onClick={onDoatXa}
              >
                <AlertTriangle size={14} />
                {state.hasUsedDoatXa
                  ? 'Đã hết lượt Đoạt Xá trong đời này'
                  : state.realmIndex < 2
                    ? 'Cần Trúc Cơ Cảnh trở lên'
                    : 'Thi Triển Bí Thuật Đoạt Xá'}
              </button>
            </div>

            <div className="sub-card">
              <strong style={{ color: 'var(--jade)' }}>2. Xác Ướp Chiến Lược (Đóng Băng +500 Năm)</strong>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0.35rem 0 0.6rem' }}>
                Yêu cầu Kim Đan+ hoặc có Động Phủ hộ trận. Ngủ đông trong Băng Quan 500 năm để bảo tồn thọ nguyên và hồi phục thương thế.
              </p>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                disabled={state.realmIndex < 3 && state.dongPhuLevel < 1}
                onClick={onCryoSleep}
              >
                <Snowflake size={14} />
                Tự Phong Băng Quan 500 Năm
              </button>
            </div>

            <div className="sub-card">
              <strong style={{ color: 'var(--purple)' }}>3. Luân Hồi Nghịch Chuyển (Kiếp Mới + Đạo Quả)</strong>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0.35rem 0 0.6rem' }}>
                Bảo lưu tiến độ Tàng Kinh Các, nhận điểm Đạo Quả vĩnh viễn tăng xác suất Mệnh Cách & giữ lại 1 Công pháp truyền kiếp.
              </p>

              {learnedTechOptions.length > 0 && (
                <select
                  className="select-field"
                  style={{ marginBottom: '0.6rem' }}
                  value={selectedTechId}
                  onChange={(e) => setSelectedTechId(e.target.value)}
                >
                  {learnedTechOptions.map((tech) => (
                    <option key={tech.id} value={tech.id}>
                      Truyền thừa: {tech.name}
                    </option>
                  ))}
                </select>
              )}

              <button
                type="button"
                className="btn btn-emerald btn-sm"
                onClick={() => onReincarnate(selectedTechId || undefined)}
              >
                <RefreshCw size={14} />
                Nhập Luân Hồi Chuyển Thế
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (modalType === 'ending' && state?.ending) {
    const end = state.ending;
    const realm = getRealmByIndex(state.realmIndex);
    const badgeColor =
      end.type === 'victory'
        ? 'var(--gold)'
        : end.type === 'ascension'
          ? 'var(--jade)'
          : 'var(--crimson)';

    return (
      <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Kết Cục Nhân Sinh">
        <div className="glass-panel modal-card">
          <div className="modal-header">
            <div>
              <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1.45rem', color: badgeColor }}>
                <Award size={22} style={{ verticalAlign: 'text-bottom', marginRight: '0.45rem' }} />
                {end.title}
              </h2>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                Cảnh giới cuối đời: {realm.name} • Hưởng thọ {state.age.toLocaleString('vi-VN')} năm
              </p>
            </div>
            <button type="button" className="btn btn-sm" onClick={onClose} aria-label="Đóng bảng kết cục">
              <X size={16} />
            </button>
          </div>

          <div className="sub-card" style={{ marginBottom: '1rem' }}>
            <p style={{ lineHeight: 1.6 }}>{end.summary}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' }}>
              <span className="badge badge-warn">
                Đạo Quả kết cục: +{end.daoQuaAwarded} (Kèm thưởng cảnh giới +{10 + state.realmIndex * 5})
              </span>
              <span className="badge badge-wip">
                Đã mở khóa Tàng Kinh Các: {state.codexUnlocked.length} mục
              </span>
            </div>
          </div>

          {learnedTechOptions.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <label
                htmlFor="reincarnate-tech-select"
                style={{ display: 'block', fontSize: '0.83rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}
              >
                Chọn 1 Công Pháp mang theo vào kiếp Luân Hồi tiếp theo:
              </label>
              <select
                id="reincarnate-tech-select"
                className="select-field"
                value={selectedTechId}
                onChange={(e) => setSelectedTechId(e.target.value)}
              >
                {learnedTechOptions.map((tech) => (
                  <option key={tech.id} value={tech.id}>
                    {tech.name} ({tech.rarity.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <button type="button" className="btn" onClick={onClose}>
              Xem Lại Nhật Ký
            </button>
            <button
              type="button"
              className="btn btn-gold"
              onClick={() => onReincarnate(selectedTechId || undefined)}
            >
              <RefreshCw size={16} />
              Luân Hồi Kiếp Mới (Nhận Đạo Quả)
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Save / Export Modal
  const serializedSave = exportSaveString(state, legacy);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(serializedSave);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Lưu và Xuất Dữ Liệu">
      <div className="glass-panel modal-card">
        <div className="modal-header">
          <div>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1.35rem' }}>
              Lưu Trữ, Sao Lưu & Nhập Dữ Liệu JSON
            </h2>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
              Tiến trình được tự động lưu vào trình duyệt (localStorage). Bạn có thể sao chép chuỗi JSON để chuyển máy.
            </p>
          </div>
          <button type="button" className="btn btn-sm" onClick={onClose} aria-label="Đóng bảng lưu trữ">
            <X size={16} />
          </button>
        </div>

        <div style={{ display: 'grid', gap: '1rem' }}>
          <div className="sub-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
              <strong style={{ fontSize: '0.9rem' }}>Chuỗi Save JSON hiện tại</strong>
              <button type="button" className="btn btn-primary btn-sm" onClick={handleCopy}>
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Đã sao chép!' : 'Sao chép Save'}
              </button>
            </div>
            <textarea
              className="textarea-field"
              rows={5}
              readOnly
              value={serializedSave}
              aria-label="Chuỗi Save JSON xuất ra"
            />
          </div>

          <div className="sub-card">
            <strong style={{ fontSize: '0.9rem', display: 'block', marginBottom: '0.45rem' }}>
              Nhập chuỗi Save JSON để khôi phục
            </strong>
            <textarea
              className="textarea-field"
              rows={4}
              value={importInput}
              onChange={(e) => setImportInput(e.target.value)}
              placeholder="Dán chuỗi Save JSON vào đây..."
              aria-label="Ô dán chuỗi Save JSON"
            />
            {importFeedback && (
              <p style={{ fontSize: '0.82rem', color: 'var(--crimson)', marginTop: '0.4rem' }}>
                {importFeedback}
              </p>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.65rem' }}>
              <button
                type="button"
                className="btn btn-emerald btn-sm"
                disabled={!importInput.trim()}
                onClick={() => {
                  const res = onImportSave(importInput);
                  if (!res.ok) {
                    setImportFeedback(res.error ?? 'Dữ liệu Save không hợp lệ.');
                  }
                }}
              >
                <Upload size={14} />
                Nạp Dữ Liệu Save
              </button>

              {!confirmClear ? (
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => setConfirmClear(true)}
                >
                  <Trash2 size={14} />
                  Xóa Save Đang Chơi
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => {
                    onClearLocalSave();
                    setConfirmClear(false);
                  }}
                >
                  <Trash2 size={14} />
                  Xác Nhận Xóa Vĩnh Viễn Kiếp Này
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
