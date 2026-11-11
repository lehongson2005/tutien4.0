import { CheckCircle2, Clock, Loader2, X } from 'lucide-react';

export type MilestoneStatus = 'done' | 'in_progress' | 'pending';

export interface RoadmapMilestone {
  version: string;
  title: string;
  summary: string;
  status: MilestoneStatus;
}

export const PROJECT_MILESTONES: RoadmapMilestone[] = [
  {
    version: 'v0.1',
    title: 'Khởi tạo Web, GitHub Actions & Bảng Tiến Độ',
    summary:
      'Kết nối repo tutien4.0, dựng khung React + Vite + TypeScript, Gacha thử nghiệm và xuất bản trực tuyến.',
    status: 'done',
  },
  {
    version: 'v0.2',
    title: 'Pipeline Dữ Liệu 36 File Lore & 370+ Biến Cố Có Chỉ Số',
    summary:
      'Chuyển hóa 30 cảnh giới, 100 xuất thân, 200 thể chất/công pháp/pháp bảo/linh thú... cùng 370 biến cố 4 giai đoạn thành JSON chuẩn.',
    status: 'done',
  },
  {
    version: 'v0.3',
    title: 'Game Engine 4 Giai Đoạn (TDD)',
    summary:
      'Tu luyện, Đột phá/Tâm ma/Lôi kiếp, Lạm phát Linh thạch, Nghề phụ, Tông môn/Tán tu, Quy luật Giai đoạn 4, Đoạt xá / Luân hồi / Xác ướp.',
    status: 'done',
  },
  {
    version: 'v0.4',
    title: 'Giao Diện 5 Tab Đầy Đủ & Tàng Kinh Các',
    summary:
      'Hoàn thiện Hành Trình A/B/C, Tu Luyện, Túi & Chợ, Thế Giới, Tàng Kinh Các và Lưu/Xuất Save.',
    status: 'done',
  },
  {
    version: 'v1.0',
    title: 'Kiểm Thử Trình Duyệt & Phát Hành Chính Thức',
    summary:
      'Kiểm thử toàn diện mọi nhánh kết cục, chạy thật trên trình duyệt sạch lỗi và chốt bản hoàn chỉnh.',
    status: 'done',
  },
];

export function getCompletionPercent(milestones: RoadmapMilestone[] = PROJECT_MILESTONES): number {
  const score = milestones.reduce((acc, item) => {
    if (item.status === 'done') return acc + 1;
    if (item.status === 'in_progress') return acc + 0.35;
    return acc;
  }, 0);
  return Math.round((score / milestones.length) * 100);
}

interface RoadmapModalProps {
  open: boolean;
  onClose: () => void;
}

export function RoadmapModal({ open, onClose }: RoadmapModalProps) {
  if (!open) return null;

  const percent = getCompletionPercent();

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Bảng tiến độ dự án">
      <div className="glass-panel modal-card">
        <div className="modal-header">
          <div>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1.35rem' }}>
              Lộ Trình Phát Triển
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Tự động cập nhật trực tuyến mỗi khi đẩy bản mới lên GitHub Pages ({percent}%)
            </p>
          </div>
          <button type="button" className="btn" onClick={onClose} aria-label="Đóng bảng tiến độ">
            <X size={16} />
            Đóng
          </button>
        </div>

        <div className="milestone-list">
          {PROJECT_MILESTONES.map((item) => {
            const badgeClass =
              item.status === 'done'
                ? 'badge badge-done'
                : item.status === 'in_progress'
                  ? 'badge badge-wip'
                  : 'badge badge-pending';

            const badgeText =
              item.status === 'done'
                ? 'Hoàn thành'
                : item.status === 'in_progress'
                  ? 'Đang xây dựng'
                  : 'Kế hoạch';

            return (
              <div key={item.version} className="milestone-row">
                <div>
                  <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    {item.status === 'done' && <CheckCircle2 size={16} color="#34d399" />}
                    {item.status === 'in_progress' && <Loader2 size={16} color="#38bdf8" />}
                    {item.status === 'pending' && <Clock size={16} color="#94a3b8" />}
                    <span>
                      {item.version} — {item.title}
                    </span>
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', marginTop: '0.25rem' }}>
                    {item.summary}
                  </p>
                </div>
                <span className={badgeClass}>{badgeText}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
