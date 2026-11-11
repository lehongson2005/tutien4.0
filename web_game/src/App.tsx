import { useState } from 'react';
import { Compass, Dices, ScrollText, Sparkles } from 'lucide-react';
import { PROJECT_MILESTONES, RoadmapModal, getCompletionPercent } from './components/RoadmapModal';

interface SampleCharacter {
  origin: string;
  originDesc: string;
  physique: string;
  physiqueDesc: string;
  spiritRoot: string;
  luckLabel: string;
  luckColor: string;
  openingNote: string;
}

const SAMPLE_ORIGINS = [
  { name: 'Thiếu Gia Thế Gia', desc: 'Sinh ra trong gia tộc tu chân có truyền thừa sơ cấp và chút linh thạch.' },
  { name: 'Phế Vật Gia Tộc', desc: 'Tư chất bị coi thường thuở nhỏ, mang mối nhục từ hôn chờ ngày quật khởi.' },
  { name: 'Cô Nhi Nghĩa Địa', desc: 'Lớn lên giữa tử khí lạnh lẽo, tâm chí kiên định khác người thường.' },
  { name: 'Người Trùng Sinh', desc: 'Mang mảnh ký ức kiếp trước quay về thuở hồng trần chưa dứt.' },
  { name: 'Đệ Tử Thợ Rèn Núi Sâu', desc: 'Thể phách dẻo dai nhờ rèn sắt bên lò lửa suốt thời thơ ấu.' },
];

const SAMPLE_PHYSIQUES = [
  { name: 'Phàm Thể', desc: 'Thân thể bình thường, cần lấy cần cù bù thiên tư.' },
  { name: 'Hoang Cổ Thánh Thể', desc: 'Khí huyết như rồng, sức chịu đựng Lôi kiếp vượt xa đồng cấp.' },
  { name: 'Bất Diệt Kiếm Thể', desc: 'Trời sinh thân hòa kiếm ý, tu kiếm đạo nhanh gấp bội.' },
  { name: 'Hỗn Độn Đạo Thai', desc: 'Thân cận vạn đạo quy luật, thuận lợi cho cả bế quan lẫn ngộ đạo.' },
  { name: 'Vạn Ách Độc Thể', desc: 'Kháng bách độc, có thể luyện hóa độc thảo thành linh lực.' },
];

const SAMPLE_ROOTS = [
  'Ngũ Hành Tạp Linh Căn',
  'Tam Hệ Chân Linh Căn',
  'Đơn Hệ Thiên Linh Căn',
  'Biến Dị Lôi Linh Căn',
  'Phế Linh Căn (Mạch Nghịch Thiên)',
];

const SAMPLE_LUCKS = [
  { label: 'Đen (Đại Hung)', color: '#9ca3af' },
  { label: 'Trắng (Phàm Nhân)', color: '#e2e8f0' },
  { label: 'Đỏ (Hữu Duyên)', color: '#f87171' },
  { label: 'Vàng (Thiên Mệnh)', color: '#fbbf24' },
  { label: 'Tím (Hồng Mông Tử Khí)', color: '#c084fc' },
];

const STAGES = [
  {
    name: 'Giai Đoạn 1: 0 — 18 Tuổi (Hồng Trần Khởi Nguyên)',
    detail: '200 biến cố nền tảng, khảo nghiệm linh căn, chọn Thuận Thiên / Nghịch Thiên / Tán Tu.',
  },
  {
    name: 'Giai Đoạn 2: 18 — 100 Tuổi (Thiên Kiêu Tranh Phong)',
    detail: 'Luyện Khí -> Trúc Cơ -> Kim Đan, leo Tiềm Long Bảng, bắt 200 loài linh thú, tìm đạo lữ.',
  },
  {
    name: 'Giai Đoạn 3: 100 — 500 Tuổi (Mưu Đồ Vạn Giới)',
    detail: 'Trưởng lão/Tông chủ, quản lý mỏ & thương hội, lạm phát linh thạch, Chí bảo trấn phái.',
  },
  {
    name: 'Giai Đoạn 4: 500+ Tuổi (Nghịch Thiên Cải Mệnh)',
    detail: 'Tu Quy luật, giải mã Thái Cổ Thần Văn, Đại kiếp diệt thế, Đoạt xá / Luân hồi / Xác ướp.',
  },
];

function rollSampleCharacter(): SampleCharacter {
  const origin = SAMPLE_ORIGINS[Math.floor(Math.random() * SAMPLE_ORIGINS.length)];
  const physique = SAMPLE_PHYSIQUES[Math.floor(Math.random() * SAMPLE_PHYSIQUES.length)];
  const spiritRoot = SAMPLE_ROOTS[Math.floor(Math.random() * SAMPLE_ROOTS.length)];
  const luck = SAMPLE_LUCKS[Math.floor(Math.random() * SAMPLE_LUCKS.length)];

  return {
    origin: origin.name,
    originDesc: origin.desc,
    physique: physique.name,
    physiqueDesc: physique.desc,
    spiritRoot,
    luckLabel: luck.label,
    luckColor: luck.color,
    openingNote: `Năm 0 tuổi: Sinh ra với xuất thân ${origin.name}, mang ${physique.name}.`,
  };
}

export default function App() {
  const [roadmapOpen, setRoadmapOpen] = useState(false);
  const [previewChar, setPreviewChar] = useState<SampleCharacter | null>(null);
  const completionPercent = getCompletionPercent();
  const activeStep = PROJECT_MILESTONES.find((m) => m.status === 'in_progress') ?? PROJECT_MILESTONES[0];

  return (
    <div className="app-shell">
      <header className="glass-panel top-bar">
        <div className="brand-meta">
          <span className="live-dot" aria-hidden="true" />
          <span>Trực tuyến • Bản dựng khởi đầu (Đang phát triển tự động)</span>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setRoadmapOpen(true)}
        >
          <ScrollText size={16} />
          Tiến Độ Dự Án ({completionPercent}%)
        </button>
      </header>

      <main>
        <section className="glass-panel hero-card">
          <h1 className="hero-title">Nhân Sinh Tu Tiên</h1>
          <p className="hero-subtitle">
            Game nhập vai mô phỏng đời tu sĩ chọn phương án A/B/C qua 4 giai đoạn (0 đến 500+ tuổi),
            khai thác toàn bộ 36 kho tư liệu thế giới tu chân và hơn 370 biến cố cốt truyện.
          </p>

          <div className="hero-actions">
            <button
              type="button"
              className="btn btn-gold"
              onClick={() => setPreviewChar(rollSampleCharacter())}
            >
              <Dices size={18} />
              {previewChar ? 'Đổ Lại Xí Ngầu Tuổi 0' : 'Thử Đổ Xí Ngầu Khởi Nguyên'}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => setRoadmapOpen(true)}
            >
              <Compass size={18} />
              Xem Chi Tiết Các Mốc Hoàn Thiện
            </button>
          </div>

          <div className="progress-strip">
            <div className="progress-strip-head">
              <strong>Tiến độ xây dựng: {completionPercent}%</strong>
              <span style={{ color: 'var(--jade)' }}>Đang làm: {activeStep.title}</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${completionPercent}%` }} />
            </div>
          </div>
        </section>

        <div className="grid-2">
          <section className="glass-panel card-box">
            <h2 className="section-heading">
              <Sparkles size={18} color="#38bdf8" />
              4 Giai Đoạn Đời Tu Sĩ
            </h2>
            <div className="stage-list">
              {STAGES.map((stage) => (
                <div key={stage.name} className="stage-item">
                  <div className="stage-item-title">{stage.name}</div>
                  <div className="stage-item-desc">{stage.detail}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="glass-panel card-box">
            <h2 className="section-heading">
              <Dices size={18} color="#f59e0b" />
              Thử Nghiệm Mệnh Cách Tuổi 0
            </h2>
            {previewChar ? (
              <>
                <div className="preview-stats">
                  <div className="stat-tile">
                    <div className="stat-tile-label">Xuất Thân</div>
                    <div className="stat-tile-value" style={{ color: '#38bdf8' }}>
                      {previewChar.origin}
                    </div>
                    <div className="stat-tile-desc">{previewChar.originDesc}</div>
                  </div>
                  <div className="stat-tile">
                    <div className="stat-tile-label">Thể Chất</div>
                    <div className="stat-tile-value" style={{ color: '#c084fc' }}>
                      {previewChar.physique}
                    </div>
                    <div className="stat-tile-desc">{previewChar.physiqueDesc}</div>
                  </div>
                  <div className="stat-tile">
                    <div className="stat-tile-label">Linh Căn</div>
                    <div className="stat-tile-value" style={{ color: '#f59e0b' }}>
                      {previewChar.spiritRoot}
                    </div>
                  </div>
                  <div className="stat-tile">
                    <div className="stat-tile-label">Khí Vận</div>
                    <div className="stat-tile-value" style={{ color: previewChar.luckColor }}>
                      {previewChar.luckLabel}
                    </div>
                  </div>
                </div>
                <p style={{ marginTop: '0.9rem', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                  {previewChar.openingNote} Bản đầy đủ sẽ nạp 100+ xuất thân, 200 thể chất và 370+ biến cố có
                  chọn A/B/C thực thụ.
                </p>
              </>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
                Nhấn nút <strong>Thử Đổ Xí Ngầu Khởi Nguyên</strong> phía trên để kiểm tra nhân vật ngẫu nhiên
                khi hệ thống đang tiếp tục biên dịch toàn bộ dữ liệu `.txt` và logic RPG 4 giai đoạn.
              </p>
            )}
          </section>
        </div>
      </main>

      <RoadmapModal open={roadmapOpen} onClose={() => setRoadmapOpen(false)} />
    </div>
  );
}
