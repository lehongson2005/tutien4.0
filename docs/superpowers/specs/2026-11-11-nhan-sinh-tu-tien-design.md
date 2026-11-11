# Tài Liệu Thiết Kế: Nhân Sinh Tu Tiên (Phiên Bản Web RPG 4 Giai Đoạn)

**Ngày:** 2026-11-11  
**Mục tiêu triển khai:** Web Game tĩnh (React + TypeScript + Vite), deploy miễn phí lên GitHub Pages (`https://lehongson2005.github.io/tutien4.0/`).

---

## 1. Mục Đích, Phạm Vi & Ràng Buộc

### 1.1 Ý định & Đối tượng
Biến toàn bộ kho 35 file thế giới tu tiên (`.txt`) và kịch bản biến cố (`0den18.txt`, cùng 3 giai đoạn tiếp nối `18den100.txt`, `100den500.txt`, `500+.txt`) thành một **game nhập vai mô phỏng nhân sinh dạng chọn phương án (Hướng 2)**. Người chơi tự trải nghiệm hoặc chia sẻ qua link web miễn phí để bạn bè/cộng đồng chơi ngay trên trình duyệt.

### 1.2 Mục tiêu (Goals)
- **Lối chơi chọn phương án thực chất:** Mỗi lựa chọn A/B/C có thể yêu cầu điều kiện (chỉ số, cảnh giới, đạo tâm, vật phẩm), tính xác suất thành/bại theo **Khí vận** và chỉ số liên quan, tạo biến động thực sự vào thuộc tính, túi đồ, đồng hành và mạch truyện.
- **Trải nghiệm trọn vẹn cả 4 giai đoạn đời tu sĩ:**
  1. `0–18 tuổi` — *Hồng Trần Khởi Nguyên* (Gacha xuất thân/thể chất/linh căn/khí vận, vượt 200 biến cố nền tảng, chọn đạo tâm & tông môn).
  2. `18–100 tuổi` — *Thiên Kiêu Tranh Phong* (Tu luyện Luyện Khí $\rightarrow$ Trúc Cơ $\rightarrow$ Kim Đan, khảo nghiệm tông môn, leo bảng xếp hạng, bắt linh thú, kết đạo lữ, học nghề phụ; **ràng buộc sinh tử ở tuổi 100 nếu chưa Trúc Cơ**).
  3. `100–500 tuổi` — *Mưu Đồ Vạn Giới* (Kim Đan $\rightarrow$ Nguyên Anh $\rightarrow$ Hóa Thần; làm Trưởng lão/Tông chủ, quản lý mỏ linh thạch & thương hội, đối phó **Lạm phát Linh thạch**, dùng Chí bảo trấn phái diệt môn/chống thiên tai, tùy chọn hắc ám **Cướp Khí Vận** thiên tài mới).
  4. `500+ tuổi` — *Nghịch Thiên Cải Mệnh* (Luyện Hư $\rightarrow$ Tiên Vương $\rightarrow$ Thần Vương $\rightarrow$ Siêu Thoát; tu luyện Quy luật, giải mã Thái Cổ Thần Văn, chống Đại Kiếp Diệt Thế & Vực Ngoại Thiên Ma; khi cạn thọ nguyên mở 3 lựa chọn tuyệt mệnh: **Đoạt xá**, **Luân hồi nghịch chuyển (New Game+)**, hoặc **Xác ướp chiến lược**).
- **Khai thác toàn bộ kho 35 file lore:** Mọi danh sách (pháp bảo, đan dược, công pháp, thần thông, linh thảo, linh thú, đạo lữ, bằng hữu, bí cảnh, tông môn, trận pháp, dị hỏa, lôi kiếp, tâm ma, bảng xếp hạng, thiên tai...) đều được chuyển hóa thành dữ liệu JSON có cấu trúc cho game sử dụng và mở khóa trong *Tàng Kinh Các*.
- **Lưu trữ bền vững không cần backend:** Auto-save vào `localStorage`, kèm xuất/nhập chuỗi Save JSON và lưu di sản luân hồi xuyên kiếp.

### 1.3 Ngoài phạm vi (Non-Goals) & Phản mục tiêu (Anti-Goals)
- **Non-Goals:** Không làm server backend/CSDL online, không làm PvP thời gian thực, không làm đồ họa chiến đấu 2D/3D canvas phức tạp.
- **Anti-Goals:**
  - Tránh tình trạng chỉ bấm qua năm đọc chữ suông không có tương tác chỉ số/vật phẩm.
  - Tránh chết mạch ở tuổi 18 do thiếu dữ liệu các giai đoạn sau.
  - Tránh cấu hình đường dẫn tĩnh sai khiến web trắng trang khi chạy trên subpath `/tutien4.0/` của GitHub Pages.

### 1.4 Ràng buộc kỹ thuật
- **Môi trường Windows PowerShell:** Máy hiện chặn `npm.ps1` qua ExecutionPolicy; mọi lệnh chạy tự động và tài liệu hướng dẫn phải dùng `npm.cmd` (hoặc cài qua `cmd /c npm`), không giả định `npm` chạy trực tiếp trong PS.
- **Bảo toàn dữ liệu gốc:** Toàn bộ 36 file `.txt` tại thư mục gốc giữ nguyên vai trò nguồn dữ liệu (chỉ bổ sung nội dung chuẩn bảng cho 3 file đang trống `18den100.txt`, `100den500.txt`, `500+.txt`, không xóa hay đổi định dạng phá vỡ các file đã có).
- **Tài nguyên sẵn có:** Python `3.11.6`, Node `v24.12.0`, Git `2.52.0`.

---

## 2. Phương Án Kiến Trúc Đã Chọn

### Các phương án đã cân nhắc
1. **Web tĩnh thuần HTML/CSS/JS module (Cách 1):** Không cần bước build, nhưng khi quản lý trạng thái phức tạp của 4 giai đoạn RPG (nhiều tab túi đồ, chế đồ, tông môn, lạm phát, đồ giám) code DOM thuần dễ rối và khó kiểm thử UI.
2. **React + TypeScript + Vite Static SPA + Python Data Pipeline (Cách 2 — ĐÃ CHỌN):** Tách bạch hoàn toàn tầng dữ liệu (Python đọc `.txt` $\rightarrow$ JSON chuẩn), tầng logic game thuần TypeScript (dễ viết unit test Vitest cho mọi công thức tu luyện/đột phá/kinh tế), và tầng giao diện React chia component sạch sẽ. Vẫn build ra 100% file tĩnh đẩy lên GitHub Pages qua GitHub Actions miễn phí.
3. **Backend server hoặc engine truyện nhánh thuần (Twine/Ink):** Bị loại vì backend tốn phí vận hành, còn Twine/Ink không phù hợp cho cơ chế quản lý chỉ số, lạm phát kinh tế, chế đan và túi đồ RPG.

---

## 3. Cấu Trúc Thư Mục Dự Án

```text
d:\HocTap\tutien\
├── *.txt                              # 36 file nguồn gốc (giữ nguyên + hoàn thiện 18den100, 100den500, 500+)
├── .gitignore                         # Bỏ qua node_modules, dist, __pycache__, scratch
├── .github/
│   └── workflows/
│       └── deploy.yml                 # Tự động test, build web_game/ và deploy GitHub Pages
├── docs/
│   └── superpowers/
│       ├── specs/2026-11-11-nhan-sinh-tu-tien-design.md
│       └── plans/2026-11-11-nhan-sinh-tu-tien-plan.md
├── scripts/
│   ├── build_data.py                  # Pipeline chuyển đổi 39 file .txt -> JSON cho game
│   └── test_build_data.py             # Unit test kiểm tra toàn vẹn dữ liệu xuất ra
└── web_game/                          # Ứng dụng React + TypeScript + Vite
    ├── index.html
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts                 # base: '/tutien4.0/' (cấu hình chuẩn GitHub Pages)
    └── src/
        ├── types/game.ts              # Định nghĩa toàn bộ kiểu dữ liệu TypeScript
        ├── data/generated/            # JSON sinh ra từ build_data.py (events, realms, lore...)
        ├── engine/                    # Logic game thuần (pure functions, 100% unit-testable)
        │   ├── rng.ts                 # Bộ sinh số ngẫu nhiên hỗ trợ seed (cho test ổn định)
        │   ├── character.ts           # Gacha nhân vật tuổi 0 + thừa kế Luân hồi
        │   ├── events.ts              # Chọn biến cố theo tuổi/giai đoạn & giải quyết lựa chọn A/B/C
        │   ├── cultivation.ts         # Bế quan, cảnh giới 1-30, đột phá, lôi kiếp, tâm ma
        │   ├── economy.ts             # Linh thạch, thương hội, lạm phát giai đoạn 3, nghề phụ
        │   ├── sect.ts                # Tông môn, thăng cấp đệ tử/trưởng lão, bảng xếp hạng, chiến tranh
        │   ├── endgame.ts             # Quy luật đại đạo, văn tự cổ, đại kiếp diệt thế, 3 lựa chọn thọ nguyên
        │   └── save.ts                # Lưu/tải localStorage, xuất/nhập JSON, di sản Luân hồi
        ├── components/                # Giao diện Dark Tiên Hiệp theo từng tab
        │   ├── StartScreen.tsx        # Màn hình Gacha khởi nguyên & Thừa kế Luân hồi
        │   ├── TopHud.tsx             # Thanh trạng thái Tu sĩ (Tuổi, Thọ nguyên, Cảnh giới, Đạo tâm, Khí vận, Linh thạch)
        │   ├── JourneyTab.tsx         # Biến cố năm hiện tại, 3 nút A/B/C, cảnh báo thiên tai/đại kiếp
        │   ├── CultivationTab.tsx     # Tu luyện, Đột phá, Công pháp, Thần thông, Dị năng, Quy luật
        │   ├── InventoryTab.tsx       # Pháp bảo, Đan dược, Linh thảo, Nghề phụ, Thương hội
        │   ├── WorldTab.tsx           # Tông môn, Bảng xếp hạng, Linh thú, Đạo lữ, Bằng hữu, Bí cảnh
        │   ├── CodexTab.tsx           # Tàng Kinh Các (thống kê & tra cứu kho dữ liệu đã mở khóa)
        │   └── ModalOverlay.tsx       # Popup Đột phá/Lôi kiếp, Đoạt xá/Luân hồi/Xác ướp, Save/Load
        ├── styles/theme.css           # Hệ màu Dark Xianxia Glassmorphism, responsive mobile & desktop
        ├── App.tsx
        └── main.tsx
```

---

## 4. Thiết Kế Hệ Thống & Công Thức Cốt Lõi

### 4.1 Bộ chỉ số nhân vật (`PlayerState`)
| Trường dữ liệu | Ý nghĩa | Khoảng giá trị / Ghi chú |
|---|---|---|
| `age`, `maxAge` | Tuổi hiện tại / Thọ nguyên tối đa | Bắt đầu `0 / 90`, tăng theo `tuoitho.txt` khi đột phá + thể chất/đan dược |
| `stage` | Giai đoạn nhân sinh (`1 \| 2 \| 3 \| 4`) | `1`: 0–18, `2`: 18–100, `3`: 100–500, `4`: 500+ |
| `realmIndex` | Chỉ số cảnh giới (`0..30`) | `0`: Phàm Nhân, `1..10`: Hạ giới, `11..20`: Tiên giới, `21..30`: Thần ma |
| `tuVi`, `tuViCap` | Tu vi tích lũy hiện tại & ngưỡng đột phá | Đủ `tuVi >= tuViCap` mở nút Đột Phá |
| `hp`, `maxHp` | Sinh mệnh / Nguyên khí | Về `0` -> Trọng thương hoặc Chết nếu không có bảo mệnh/đan |
| `nhucThan` | Thể phách (sức chịu đựng) | Giảm sát thương Lôi kiếp, Thiên tai, Chiến đấu |
| `ngoTinh` | Ngộ tính / Thần thức | Tăng tốc tu luyện, mở khóa lựa chọn ẩn & giải mã cổ văn |
| `tamCanh` | Tâm cảnh / Ý chí | Tăng tỷ lệ thắng Tâm ma kiếp & kháng ảo cảnh |
| `khiVan` | Khí vận (`0..100`) | `<20` Đen, `20–39` Trắng, `40–59` Đỏ, `60–79` Vàng, `80+` Tím |
| `congDuc`, `nghiepLuc` | Công đức & Nghiệp lực | Nghiệp lực cao làm Lôi kiếp tăng uy lực; Công đức giúp qua kiếp |
| `linhThach` | Tài sản quy đổi theo Hạ phẩm Linh thạch | Giá cả bị nhân với `inflationMultiplier` ở Giai đoạn 3 |
| `daoAlignment` | `'chua_chon' \| 'thuan_thien' \| 'nghich_thien' \| 'trung_lap'` | Mở khóa ở cuối Giai đoạn 1, ảnh hưởng sự kiện & phe tông môn |
| `laws` | Độ lĩnh ngộ Quy luật (`thoiGian`, `khongGian`, `nhanQua`, `honDon`) | Dùng ở Giai đoạn 4 để đối phó Đại kiếp & Phi thăng |

### 4.2 Khởi tạo Nhân vật (Tuổi 0 Gacha)
- Bốc ngẫu nhiên theo trọng số (tăng tỷ lệ hiếm nếu có **Đạo Quả Luân Hồi** từ kiếp trước):
  - **Xuất thân** (`suatthan.txt`, 100 mẫu): cho bonus chỉ số ban đầu + 1 vật phẩm/bối cảnh khởi đầu.
  - **Thể chất** (`thechat.txt`, 200 mẫu): chia bậc Phàm / Linh / Vương / Thánh / Chí Tôn, cộng hệ số nhân Tu vi hoặc Nhục thân.
  - **Linh căn**: Phế Linh Căn (`x0.6` tu vi, mở mạch Nghịch tập), Tạp Linh Căn (`x0.9`), Chân Linh Căn (`x1.2`), Thiên Linh Căn (`x1.6`), Biến Dị Linh Căn (`x1.8`).
  - **Khí vận & Mệnh cách** (`khivan.txt`, 15 + 15 mẫu): định hình màu Khí vận khởi đầu và passive đặc biệt (VD: *Thọ Tinh* +40% Thọ nguyên, *Thiên Đạo Sủng Nhi* giảm độ khó Lôi kiếp).

### 4.3 Cơ chế Biến cố & Lựa chọn A/B/C
- **Bước tiến thời gian:**
  - Giai đoạn 1 (`0–18`): bấm **"Sống tiếp 1 năm"** -> rút 1 biến cố theo đúng phân đoạn tuổi (`0-3`, `4-10`, `11-15`, `16-18`) không trùng lặp trong cùng kiếp.
  - Giai đoạn 2 (`18–100`): mỗi lượt bước **2 năm** (hoặc **5 năm** tùy người chơi chọn tốc độ), kích hoạt biến cố Giai đoạn 2 + sự kiện thời tiết/tông môn định kỳ.
  - Giai đoạn 3 (`100–500`): mỗi lượt bước **10 năm**, kết hợp biến cố Giai đoạn 3 + biến động **Lạm phát Linh thạch** và chiến tranh thế lực.
  - Giai đoạn 4 (`500+`): mỗi lượt bước **25–50 năm**, kết hợp biến cố Giai đoạn 4 + đếm ngược **Chu kỳ Đại Kiếp Diệt Thế**.
- **Giải quyết một lựa chọn A/B/C:**
  1. Kiểm tra `requirement` (nếu là lựa chọn yêu cầu chỉ số/vật phẩm/đạo tâm): hiển thị rõ trạng thái Đủ / Chưa đủ ngay trên nút. Luôn đảm bảo tối thiểu 2 lựa chọn mỗi sự kiện có thể bấm tự do để không bao giờ kẹt game.
  2. Tính `successChance = clamp(baseRate + (khiVan - 45)*0.004 + statBonus, 0.15, 0.98)`.
  3. Roll kết quả -> áp dụng `statDelta`, có xác suất rớt vật phẩm/công pháp/linh thú/đạo lữ đúng bậc giai đoạn từ kho JSON, cập nhật `codexUnlocked`, ghi vào Nhật ký nhân sinh.

### 4.4 Rủi ro Sinh tử & Đột phá theo từng Giai đoạn
- **Đột phá Cảnh giới:** Khi đủ `tuVi >= tuViCap`, người chơi mở nghi thức Đột phá:
  - Chịu **Tâm Ma Kiếp** (`tammavaaocanh.txt`) từ Trúc Cơ trở lên — có thể chọn *Ngưng thần chống đỡ*, *Uống Tâm Ma Đan*, hoặc *Nhờ Đạo lữ hộ pháp*.
  - Chịu **Lôi Kiếp** (`loikiep.txt`) từ Kim Đan trở lên — sát thương giảm bởi `nhucThan`, `Độ Kiếp Đan`, `Trận pháp` hộ thân; tăng nếu `nghiepLuc` cao.
  - Thất bại: tụt HP/Tu vi hoặc bị thương kinh mạch; Thành công: lên cảnh giới mới, cập nhật `maxAge` theo bảng `tuoitho.txt`!
- **Cửa ải Tuổi 100 (Giai đoạn 2):** Đến tuổi 100, nếu `realmIndex < 2` (chưa đạt **Trúc Cơ**), thọ nguyên chạm giới hạn phàm nhân/Luyện khí (trừ khi đã uống Thọ nguyên đan đẩy `maxAge > 100`) -> kết thúc kiếp sống với kết cục *"Mục nát nơi phàm trần trước ngưỡng Trúc Cơ"*.
- **Khủng hoảng Giai đoạn 3 (100–500):**
  - **Lạm phát Linh thạch:** Chu kỳ 50–100 năm xảy ra lạm phát (`inflationMultiplier` tăng `1.5x` đến `4x`), làm giá thương hội vọt lên; người chơi quản lý mỏ linh thạch của tông môn để tự chủ nguồn thu hoặc kích hoạt **Cướp Khí Vận** của thiên tài trẻ (`+khiVan`, `+linhThach`, `+tuVi`, nhưng tăng mạnh `nghiepLuc`).
  - **Chiến tranh Tông môn & Thiên tai:** Dùng **Chí Bảo Trấn Phái** (`chibaochanphai.txt`) để thủ tông hoặc diệt môn đối địch chiếm tài nguyên.
- **Tuyệt lộ Cạn Thọ Nguyên ở Giai đoạn 4 (500+):**
  Khi `age >= maxAge - 25` mà chưa đạt cảnh giới Phi Thăng / Thần Vương, hiện bảng lựa chọn sinh tồn:
  1. **Đoạt Xá:** Tìm thân xác thiên tài trẻ (kiểm tra `tamCanh` & `ngoTinh`): thành công thì `age` lùi về `18`, giữ ký ức & công pháp/quy luật, nhưng `realmIndex` lùi 2 bậc và bị *Trấn Thế Minh* truy lùng; thất bại thì thần hồn câu diệt.
  2. **Luân Hồi Nghịch Chuyển:** Tự giải thể tu vi chuyển kiếp làm lại từ tuổi 0 với **+10 Điểm Đạo Quả Luân Hồi** (tăng tỷ lệ bốc Thể chất/Khí vận hiếm và giữ lại 1 Công pháp tâm đắc sang kiếp mới).
  3. **Xác Ướp Chiến Lược:** Tự phong ấn vào hòm băng trong hậu sơn tông môn, đóng băng tiêu hao thọ nguyên trong `500 năm` để tích tụ lực lượng/chờ biến cố tông môn gọi tỉnh dậy tiếp tục tu hành.

---

## 5. Pipeline Dữ Liệu (`scripts/build_data.py`)

### 5.1 Chuẩn hóa 4 file biến cố
- [0den18.txt](file:///d:/HocTap/tutien/0den18.txt): Giữ nguyên 200 dòng (4 phân đoạn 0–3, 4–10, 11–15, 16–18), sửa sạch lỗi gõ sót ở vài chuỗi hiển thị khi parser nạp vào JSON (không phá vỡ bảng TSV).
- Bổ sung đầy đủ kịch bản TSV đồng bộ cho:
  - [18den100.txt](file:///d:/HocTap/tutien/18den100.txt): 60+ biến cố (Luyện Khí $\rightarrow$ Trúc Cơ $\rightarrow$ Kim Đan, tỷ thí tông môn, Tiềm Long Bảng, bí cảnh, bắt linh thú, gặp đạo lữ, tâm ma sơ cấp).
  - [100den500.txt](file:///d:/HocTap/tutien/100den500.txt): 60+ biến cố (Kim Đan $\rightarrow$ Nguyên Anh $\rightarrow$ Hóa Thần, chính trị Tiên triều, quản lý mỏ & thương hội, lạm phát linh thạch, diệt môn dùng chí bảo, bão linh khí vĩ mô, cướp khí vận).
  - [500+.txt](file:///d:/HocTap/tutien/500+.txt): 50+ biến cố (Luyện Hư $\rightarrow$ Tiên Vương $\rightarrow$ Thần Vương, tu luyện Quy luật Thời/Không/Nhân quả, bóc tách Thái Cổ Thần Văn, Đại Kiếp Diệt Thế, Vực Ngoại Thiên Ma, chuẩn bị Phi Thăng).

### 5.2 Chuyển hóa 35 file Lore `.txt` $\rightarrow$ JSON
`scripts/build_data.py` hỗ trợ 3 mẫu parser để bao phủ toàn bộ 35 file mà không bỏ sót mục nào:
1. **Mẫu A (Multi-line `Tên: Mô tả`):** Dùng cho `suatthan.txt`, `thechat.txt`, `congphap.txt`, `danduoc.txt`, `phapbao.txt`, `linhthao.txt`, `linhthu.txt`, `tranphap.txt`, `daolu.txt`, `banbe.txt`, `bicanh.txt`, `thelucbandia.txt`, `daogiao.txt`, `dinang.txt`, `dietthe.txt`, `tammavaaocanh.txt`, `chibaochanphai.txt`, `phuongthucvanhanh.txt`, `phuongtien.txt`, `quyluatgiaodich.txt`, `thelucthudichcathegioi.txt`, `thienphucungloai.txt`, `truyenthua.txt`, `canhgioi.txt`.
2. **Mẫu B (Single-line dính chữ):** Tách thông minh bằng regex biên câu/ngoặc + cụm tiêu đề viết hoa trước dấu `:` cho `khihau.txt`, `khivan.txt`, `loikiep.txt`, `nghephu.txt`, `thanthong.txt`, `tuoitho.txt`.
3. **Mẫu C (Multi-line khối/cấp bậc):** Đọc theo nhóm đề mục cho `detu.txt`, `truonglao.txt`, `bãngehang.txt`, `khuvuc.txt`, `theluc.txt`, `tientai.txt`.

### 5.3 Sinh thuộc tính cho từng lựa chọn A/B/C
- Dùng **bảng ghi đè trực tiếp (`CURATED_EVENTS`)** cho các biến cố cột mốc (ID `001`, `002`, `008`, `041`, `050`, `099`, `152`, `155`, `160`, `200`, cùng các biến cố cột mốc của Stage 2–4).
- Các biến cố còn lại đi qua bộ phân loại từ khóa tiếng Việt + quy tắc cân bằng theo bậc giai đoạn để gán `statDelta`, `successRateBase`, `daoShift`, và `rewardCategory` một cách tất định (deterministic).
- Kèm bộ test `scripts/test_build_data.py` kiểm tra số lượng mục trích xuất từ từng file (VD: đủ 200 sự kiện 0–18, đủ 30 cảnh giới, đủ 100 xuất thân, đủ 200 pháp bảo/đan dược/linh thảo/công pháp/linh thú/trận pháp...).

---

## 6. Giao Diện & Trải Nghiệm Người Dùng

- **Thẩm mỹ:** Dark Xianxia Glassmorphism (nền mực đêm `#0b1120`, ánh ngọc lam `#38bdf8`, vàng kim đan `#f59e0b`, tím hỗn độn `#a855f7`, đỏ huyết sát `#ef4444`), font chữ dễ đọc trên cả desktop và điện thoại.
- **Bố cục:**
  - **Top HUD cố định:** Tên, Tuổi/Thọ nguyên (có thanh tiến trình + cảnh báo đỏ khi sắp đại hạn), Cảnh giới + Thanh Tu Vi, Đạo tâm, Khí vận (đổi màu theo cấp Đen/Trắng/Đỏ/Vàng/Tím), Linh thạch (kèm chỉ số lạm phát ở Giai đoạn 3), Tông môn & Cấp bậc.
  - **Thanh điều hướng 5 Tab:** `Hành Trình` | `Tu Luyện` | `Túi & Chợ` | `Thế Giới` | `Tàng Kinh Các`.
  - **Sidebar / Bottom Drawer Nhật Ký:** Lịch sử các quyết định và biến cố vừa xảy ra + nút Lưu / Xuất Save / Chơi lại.

---

## 7. Cấu Hình GitHub & Triển Khai (Deploy)

- Khởi tạo Git tại `d:\HocTap\tutien\`, nối remote `origin` tới `https://github.com/lehongson2005/tutien4.0.git`, fetch và merge giữ nguyên lịch sử `README.md` ban đầu trên `main`.
- Cấu hình `vite.config.ts` với `base: '/tutien4.0/'` để mọi file JS/CSS tải đúng đường dẫn trên `https://lehongson2005.github.io/tutien4.0/`.
- Tạo `.github/workflows/deploy.yml` chạy tự động mỗi khi push lên `main`: cài dependencies (`npm ci` trong `web_game/`), chạy `npm test` + `npm run build`, dùng `actions/upload-pages-artifact` và `actions/deploy-pages` xuất bản trang web.


---

## 8. Các Quyết Định Thiết Kế Bổ Sung (Đã Chốt Qua Rà Soát Kỹ Thuật)

### 8.1 Quy tắc chuyển Giai đoạn, Bước Thời Gian & Thắng Cuộc
- **Chuyển giai đoạn:**
  - `Stage 1 (0–18)`: `age < 18`. Đạt `18` tuổi chuyển sang `Stage 2`.
  - `Stage 2 (18–100)`: `18 <= age < 100`. Tại mốc `age >= 100`: nếu `realmIndex < 2` (chưa đạt **Trúc Cơ**) và `age >= maxAge` thì **Chết già (Game Over)**; nếu đạt `Trúc Cơ` (hoặc có thọ nguyên vượt 100), tiến vào `Stage 3`.
  - `Stage 3 (100–500)`: `100 <= age < 500`. Đạt `500` tuổi chuyển sang `Stage 4`.
  - `Stage 4 (500+)`: `age >= 500` trở đi.
- **Bước thời gian thích ứng & Nén nhịp chơi:**
  - `Stage 1`: `+1 năm/lượt`. `Stage 2`: chọn `+2` hoặc `+5 năm/lượt`. `Stage 3`: `+15 năm/lượt`.
  - `Stage 4`: Bước thời gian tự giãn theo bậc cảnh giới (`Hóa Thần/Luyện Hư`: `+150 năm/lượt`; `Hợp Thể/Độ Kiếp/Đại Thừa`: `+1.500 năm/lượt`; `Tiên Nhân 11..20`: `+50.000 năm/lượt`; `Thần Cảnh 21..30`: `+1.000.000 năm/lượt`) để người chơi chạm tới Đại Kiếp và ngưỡng Thọ nguyên `tuoitho.txt` một cách kịch tính mà không phải bấm hàng nghìn lần.
  - **Cơ chế Cận Hạn Thọ Nguyên:** Khi `age >= maxAge - Math.max(25, stepYears)` ở bất kỳ giai đoạn nào từ `Stage 2` trở đi, mở lựa chọn sinh tồn (`Luân hồi nghịch chuyển`, `Đoạt xá` từ Trúc Cơ+, `Xác ướp chiến lược` từ Kim Đan+).
- **Điều kiện Thắng (2 cấp):**
  - **Thắng Cốt Truyện Hạ Giới (Phi Thăng):** Đạt `Nhân Tiên` (`realmIndex = 11`) -> mở bảng Vinh Danh Phi Thăng và cho phép chọn **Tiếp tục tu luyện** lên Tiên Giới / Thần Giới.
  - **Đỉnh Phong Chung Cuộc (Siêu Thoát):** Đạt `Siêu Thoát Cảnh` (`realmIndex = 30`) hoặc sống sót chinh phục Đại Kiếp tối cao *Vũ Trụ Giả Lập Sụp Đổ* -> mở True Ending và tặng thưởng lớn Đạo Quả Luân Hồi.

### 8.2 Kinh tế Hành động (`actionPoints`)
- Mỗi lần bấm nút tiến thời gian ở `Hành Trình`, nhân vật nhận tối đa **`2 Điểm Hành Động` (`actionPoints = 2`)**.
- **Hành động miễn phí (không tốn điểm):** Trang bị/tháo Pháp bảo, đọc/chọn Công pháp, uống Đan dược (bị kiểm soát bởi chỉ số **Đan Độc `danDoc`**, giảm dần theo năm hoặc bằng Tẩy Tủy Đan), mua bán Thương hội, bấm Đột phá khi đủ Tu vi.
- **Hành động tốn `1 Điểm Hành Động`:** *Bế Quan Tu Luyện*, *Thám Hiểm Bí Cảnh*, *Luyện Đan / Chế Tạo Nghề Phụ*, *Khảo Nghiệm Tông Môn / Khiêu Chiến Bảng Xếp Hạng*, *Di Chuyển Khu Vực*, *Quản Lý Mỏ / Cướp Khí Vận* (Stage 3), *Lĩnh Ngộ Quy Luật / Giải Mã Cổ Văn* (Stage 4).

### 8.3 Chiến đấu & Giao tranh Chiến thuật Gọn
- Chiến đấu (Bí cảnh, Khảo nghiệm, Leo Bảng Xếp Hạng, Chiến tranh Tông môn, Đại Kiếp) sử dụng hệ thống **Encounter Chiến Thuật 1–3 Hiệp**: tính `combatPower` tổng hợp từ `realmIndex`, `nhucThan`, `ngoTinh`, Pháp bảo đang đeo, Công pháp, Thần thông, Trận pháp, Linh thú, Đạo lữ; người chơi chọn chiến thuật (*Dùng Pháp Bảo/Thần Thông*, *Kích Trận Pháp/Chí Bảo*, *Hợp Kích Đồng Hành*, hoặc *Rút Lui Bảo Toàn*) trong popup gọn.

### 8.4 Cơ chế mở rộng từ Lore (Nghề phụ, Tiền tệ, Bản đồ, Tán Tu)
- **Nghề phụ & Chế tạo:** Chọn tối đa 2 nghề trong 30 nghề `nghephu.txt` để thăng phẩm (`Nhất phẩm -> Thần cấp`), đi kèm 3 xưởng chế tác trực tiếp: *Luyện Đan* (`linhthao -> danduoc`), *Luyện Khí* (cường hóa `phapbao`), *Lập Trận* (`tranphap`).
- **Tiền tệ thống nhất hiển thị đa tầng:** Lưu 1 trường `linhThach` làm lõi tính toán, UI tự quy đổi hiển thị sang *Trung/Thượng/Cực phẩm Linh thạch* và *Tiên thạch / Thần thạch* ở Tiên Giới / Thần Giới (`tientai.txt`).
- **Bản đồ Ngũ Đại Vực (`khuvuc.txt`, `theluc.txt`):** Theo dõi `region` hiện tại (Đông/Tây/Nam/Bắc/Trung) theo tầng thế giới (Hạ/Tiên/Thần), ảnh hưởng trực tiếp tới xác suất biến cố, loại linh thảo/linh thú và giá Thương hội.
- **Tuyến chơi Tán Tu (`sect === null`):** Người chơi chọn *Tán Tu* ở tuổi 18 vẫn chơi trọn vẹn cả 4 giai đoạn nhờ hệ thống **Tán Tu Liên Minh / Động Phủ Cá Nhân** (nơi đặt Trận pháp hộ phủ, khai phá linh mạch bí mật thay mỏ tông môn ở Stage 3, và mật thất băng phong cho `Xác Ướp Chiến Lược` ở Stage 4), đồng thời luôn có tùy chọn xin gia nhập Tông môn muộn hoặc **Tự Khai Tông Lập Phái** từ Kim Đan trở lên.

### 8.5 Theo dõi Tiến Độ Trực Tuyến (Live Roadmap Badge)
- Gắn module nhỏ `RoadmapModal` trên góc trên giao diện web hiển thị rõ phiên bản hiện tại (v0.1 -> v1.0) và checklist các giai đoạn đã mở khóa, giúp chủ sở hữu mở link web bất cứ lúc nào cũng thấy tiến độ hoàn thiện thực tế.
