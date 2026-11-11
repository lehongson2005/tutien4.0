# Nhân Sinh Tu Tiên (Web RPG 4 Giai Đoạn) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xây dựng hoàn chỉnh web game mô phỏng tu tiên chọn phương án A/B/C qua 4 giai đoạn (`0–18`, `18–100`, `100–500`, `500+`) khai thác toàn bộ kho 36+4 file `.txt`, kết nối GitHub `https://github.com/lehongson2005/tutien4.0.git` và tự động triển khai lên GitHub Pages.

**Architecture:** Tách 3 lớp rõ ràng: (1) Kho `.txt` gốc + script Python `scripts/build_data.py` chuyển hóa thành JSON có kiểu dữ liệu chặt chẽ trong `web_game/src/data/generated/`, (2) Game Engine thuần TypeScript trong `web_game/src/engine/` được kiểm thử TDD bằng Vitest với seeded RNG, và (3) Giao diện React 19 + TypeScript + Vite trong `web_game/src/` deploy tĩnh qua GitHub Actions lên `/tutien4.0/`.

**Tech Stack:** Python 3.11 (data pipeline + `unittest`), Node v24 (`npm.cmd`), React, TypeScript, Vite, Vitest, Testing Library, Lucide Icons, GitHub Actions Pages.

**Spec:** [2026-11-11-nhan-sinh-tu-tien-design.md](../../specs/2026-11-11-nhan-sinh-tu-tien-design.md)

## Global Constraints
- Mọi lệnh npm trên Windows PowerShell phải gọi qua `npm.cmd` (do `ExecutionPolicy` chặn `npm.ps1`).
- Không xóa hoặc phá cấu trúc 36 file `.txt` hiện có tại thư mục gốc; chỉ bổ sung nội dung TSV chuẩn cho `18den100.txt`, `100den500.txt`, `500+.txt`.
- `vite.config.ts` phải đặt `base: '/tutien4.0/'` để chạy đúng subpath GitHub Pages.
- Toàn bộ logic ngẫu nhiên trong engine phải nhận `RngFn` có thể truyền seed khi test để đảm bảo kiểm thử tất định.
- Ngôn ngữ hiển thị giao diện và nhật ký game hoàn toàn bằng tiếng Việt có dấu, rõ ràng.

## Review Focus
- **Nhảy tuổi vượt quá ngưỡng Thọ nguyên (`age` jump > `maxAge`):** Khi bước thời gian Giai đoạn 3–4 tăng `+15` hoặc `+50.000` năm làm `age` nhảy qua `maxAge - 25`, game phải chặn tại ngưỡng Sinh Tồn / Đại Hạn thay vì nhảy thẳng tới chết không cho người chơi chọn Đoạt Xá / Luân Hồi / Xác Ướp.
- **Ràng buộc tuổi 100 ở Giai đoạn 2:** Người chơi ở `age = 98` bước `+5` năm lên `103` mà chưa đạt Trúc Cơ (`realmIndex < 2`) và `maxAge <= 105`: phải xử lý đúng ngưỡng tuổi 100 (chết già nếu `maxAge <= 100` và `realmIndex < 2`, hoặc sống tiếp nếu đã uống Thọ Nguyên Đan đẩy `maxAge > 103`).
- **Cạn kho biến cố khi sống lâu / đóng băng Xác Ướp:** Khi người chơi rút hết biến cố trong 1 giai đoạn (`usedEventIds`), engine phải tự tái sử dụng pool biến cố lặp lại được (loại bỏ các biến cố one-time cột mốc như `001`, `002`, `041`, `152`, `200`) để không bao giờ trả `undefined` hoặc crash UI.
- **Lạm phát Giai đoạn 3 & Giá âm / NaN:** Công thức `inflationMultiplier` và `linhThach` luôn bị chặn dưới `>= 0` (số nguyên), giá mua vật phẩm không bao giờ thành số âm hoặc `NaN`, và đan dược tăng `danDoc` luôn bị giới hạn an toàn `0..100`.
- **Save hỏng / phiên bản cũ từ `localStorage` hoặc Import JSON:** Hàm `loadSaveState()` và `importSaveJson()` phải kiểm tra schema cơ bản, fallback an toàn khi JSON lỗi hoặc thiếu trường mà không làm trắng trang.

---

### Task 1: Khởi tạo Git, Scaffold React + Vite (`web_game/`), Live Roadmap & Deploy Pipeline v0.1

**Files:**
- Create: `.gitignore`
- Create: `.github/workflows/deploy.yml`
- Create: `web_game/package.json`
- Create: `web_game/tsconfig.json`
- Create: `web_game/vite.config.ts`
- Create: `web_game/vitest.config.ts`
- Create: `web_game/index.html` (nâng cấp từ bản HTML đơn sang Vite entry)
- Create: `web_game/src/main.tsx`
- Create: `web_game/src/App.tsx`
- Create: `web_game/src/components/RoadmapModal.tsx`
- Create: `web_game/src/styles/theme.css`
- Test: `web_game/src/__tests__/smoke.test.tsx`

**Interfaces:**
- Produces: Git repo kết nối `origin` -> `https://github.com/lehongson2005/tutien4.0.git` (giữ commit gốc `9df0331`), Vite build script `npm.cmd run build`, test runner `npm.cmd test`, và trang v0.1 live có Bảng Tiến Độ trực tuyến.

- [ ] **Step 1:** Khởi tạo git trong `d:\HocTap\tutien`, thêm `origin` = `https://github.com/lehongson2005/tutien4.0.git`, fetch `origin/main` và checkout/merge lịch sử `README.md` sạch sẽ.
- [ ] **Step 2:** Tạo `.gitignore`, `web_game/package.json` (React 19, TypeScript, Vite 6, Vitest, `@testing-library/react`, `lucide-react`, `jsdom`), chạy `npm.cmd install`.
- [ ] **Step 3:** Tạo test `web_game/src/__tests__/smoke.test.tsx` kiểm tra `App` render tiêu đề `"Nhân Sinh Tu Tiên"` và nút `"Tiến Độ Dự Án"`, chạy `npm.cmd test` thấy FAIL trước khi viết component.
- [ ] **Step 4:** Viết `web_game/vite.config.ts` (`base: '/tutien4.0/'`), `src/styles/theme.css`, `src/components/RoadmapModal.tsx` (hiển thị 4 mốc tiến độ v0.1 -> v1.0), `src/App.tsx` (v0.1 khung Dark Tiên Hiệp + nút chơi thử Gacha sơ bộ + Bảng Tiến Độ), và `.github/workflows/deploy.yml`.
- [ ] **Step 5:** Chạy `npm.cmd test` (PASS), `npx.cmd tsc --noEmit` (PASS), `npm.cmd run build` (PASS), commit và push v0.1 lên `origin main` để người dùng theo dõi trực tuyến ngay.

---

### Task 2: Soạn Kho Biến Cố Đầy Đủ cho 3 Giai Đoạn Sau (`18den100.txt`, `100den500.txt`, `500+.txt`)

**Files:**
- Modify: `18den100.txt` (60+ biến cố TSV 3 lựa chọn A/B/C)
- Modify: `100den500.txt` (60+ biến cố TSV 3 lựa chọn A/B/C)
- Modify: `500+.txt` (50+ biến cố TSV 3 lựa chọn A/B/C)

**Interfaces:**
- Produces: Định dạng TSV 5 cột giống hệt `0den18.txt` (`ID \t Tình huống \t Lựa chọn A \t Lựa chọn B \t Lựa chọn C`), đánh số `201..265` (Stage 2), `301..365` (Stage 3), `401..455` (Stage 4), chia phân đoạn rõ ràng, bám sát toàn bộ lore từ `bicanh.txt`, `bãngehang.txt`, `linhthu.txt`, `daolu.txt`, `truonglao.txt`, `chibaochanphai.txt`, `dietthe.txt`, `truyenthua.txt`, `thelucthudichcathegioi.txt`.

- [ ] **Step 1:** Viết `18den100.txt` với 60 biến cố (2 phân đoạn: `18–50 tuổi` Sơ Xuất Giang Hồ & `51–100 tuổi` Trúc Cơ - Kết Đan Chi Tranh).
- [ ] **Step 2:** Viết `100den500.txt` với 60 biến cố (2 phân đoạn: `100–250 tuổi` Chưởng Sự & Thương Hội Lạm Phát & `251–500 tuổi` Chiến Tranh Thế Lực - Nguyên Anh Hóa Thần).
- [ ] **Step 3:** Viết `500+.txt` với 50 biến cố (2 phân đoạn: `500–5000 tuổi` Luyện Hư Hợp Đạo & Thái Cổ Thần Văn & `5000+ tuổi` Đại Kiếp Diệt Thế - Phi Thăng - Vực Ngoại).
- [ ] **Step 4:** Chạy kiểm tra nhanh bằng Python xác nhận tất cả dòng dữ liệu đều đủ 5 cột tab, không trùng ID.

---

### Task 3: Xây dựng Python Data Pipeline (`scripts/build_data.py` & `scripts/test_build_data.py`)

**Files:**
- Create: `scripts/build_data.py`
- Create: `scripts/test_build_data.py`
- Create: `web_game/src/data/generated/*.json` (`realms.json`, `origins.json`, `physiques.json`, `lucks.json`, `fates.json`, `daos.json`, `sects.json`, `techniques.json`, `abilities.json`, `artifacts.json`, `elixirs.json`, `herbs.json`, `beasts.json`, `arrays.json`, `companions.json`, `friends.json`, `secret_realms.json`, `professions.json`, `weather.json`, `tribulations.json`, `inner_demons.json`, `rankings.json`, `calamities.json`, `sect_relics.json`, `guilds.json`, `outer_enemies.json`, `events_stage1.json`, `events_stage2.json`, `events_stage3.json`, `events_stage4.json`, `codex_meta.json`)

**Interfaces:**
- Produces: File JSON hợp lệ UTF-8 có trường `id`, `name`, `description`, `tier`/`realmMin`, `category`, `powerBonus`/`effects` cho toàn bộ 36 file lore + cấu trúc đầy đủ `GameEvent` cho 370+ sự kiện.

- [ ] **Step 1:** Viết `scripts/test_build_data.py` kiểm tra số lượng trích xuất kỳ vọng: `realms == 30`, `origins >= 100`, `physiques == 200`, `techniques == 200`, `elixirs == 200`, `artifacts == 200`, `herbs == 200`, `beasts == 200`, `arrays == 200`, `companions == 50`, `friends == 100`, `secret_realms == 100`, `sects == 100`, `events_stage1 == 200`, `events_stage2 >= 60`, `events_stage3 >= 60`, `events_stage4 >= 50`, mọi choice đều có `statDelta` và `successRateBase` hợp lệ.
- [ ] **Step 2:** Chạy `python -m unittest scripts/test_build_data.py` xác nhận FAIL trước khi viết `build_data.py`.
- [ ] **Step 3:** Viết `scripts/build_data.py` hỗ trợ cả 3 mẫu parser (Multi-line, Single-line regex boundary, Block hierarchy), sửa sạch các mảnh chữ sót từ `0den18.txt` khi export JSON, áp dụng `CURATED_EVENTS` + bộ phân loại từ khóa tất định để gắn tác động thuộc tính cho mọi lựa chọn A/B/C.
- [ ] **Step 4:** Chạy `python scripts/build_data.py` và `python -m unittest scripts/test_build_data.py` đến khi PASS 100%.

---

### Task 4: TypeScript Types & Core RNG / Character Gacha (`types/game.ts`, `engine/rng.ts`, `engine/character.ts`)

**Files:**
- Create: `web_game/src/types/game.ts`
- Create: `web_game/src/engine/rng.ts`
- Create: `web_game/src/engine/character.ts`
- Test: `web_game/src/__tests__/character.test.ts`

**Interfaces:**
- Produces: `PlayerState`, `GameEvent`, `ChoiceOutcome`, `LoreEntry`, `createSeededRng(seed)`, `rollCharacter(legacy: ReincarnationLegacy, rng)`, `calculateCombatPower(state)`, `formatSpiritStones(amount, realmIndex)`.

- [ ] **Step 1:** Viết test trong `character.test.ts` cho Gacha tuổi 0, trọng số tăng bởi `reincarnationPoints`, mapping màu Khí vận (`Đen/Trắng/Đỏ/Vàng/Tím`), và công thức `formatSpiritStones`.
- [ ] **Step 2:** Chạy `npm.cmd test` xác nhận FAIL.
- [ ] **Step 3:** Cài đặt `types/game.ts`, `engine/rng.ts`, `engine/character.ts`.
- [ ] **Step 4:** Chạy `npm.cmd test` xác nhận PASS.

---

### Task 5: Event Engine & Giai đoạn 1–4 Time Loop (`engine/events.ts`)

**Files:**
- Create: `web_game/src/engine/events.ts`
- Test: `web_game/src/__tests__/events.test.ts`

**Interfaces:**
- Produces: `getStepYears(state)`, `advanceTimeStep(state, rng)`, `pickEventForState(state, rng)`, `canSelectChoice(state, choice)`, `resolveChoice(state, event, choiceIndex, rng)`.

- [ ] **Step 1:** Viết unit test bao phủ Review Focus:
  - Phân đoạn 0–3, 4–10, 11–15, 16–18 chọn đúng biến cố theo tuổi.
  - Tự động chọn lại pool lặp được khi đã dùng hết sự kiện giai đoạn (không crash).
  - Kiểm tra điều kiện chỉ số của choice và áp dụng `onSuccess` / `onFail` theo `khiVan`.
  - Cửa ải sinh tử tuổi 100 (chết nếu `realmIndex < 2 && maxAge <= 100`; qua Stage 3 nếu Trúc Cơ+).
  - Chặn bước nhảy thời gian ở ngưỡng Cận Hạn Thọ Nguyên (`age >= maxAge - Math.max(25, step)`).
- [ ] **Step 2:** Chạy test thấy FAIL.
- [ ] **Step 3:** Cài đặt `engine/events.ts`.
- [ ] **Step 4:** Chạy test thấy PASS.

---

### Task 6: Cultivation, Breakthroughs, Tribulations & Inner Demons (`engine/cultivation.ts`)

**Files:**
- Create: `web_game/src/engine/cultivation.ts`
- Test: `web_game/src/__tests__/cultivation.test.ts`

**Interfaces:**
- Produces: `meditate(state, rng)` (tốn 1 AP, tăng Tu vi theo Linh căn + Công pháp + Động phủ/Tông môn + Dị hỏa), `consumeElixir(state, elixirId)` (tăng `danDoc`, cảnh báo hoặc trừ HP nếu quá tải), `attemptBreakthrough(state, tactic, rng)` (xử lý Tâm ma + Lôi kiếp + tăng `maxAge` theo bảng 30 cảnh giới), `purifyDanDoc(state)`.

- [ ] **Step 1:** Viết test kiểm tra bế quan tốn 1 AP, bùng nổ Đan độc khi cắn đan quá liều, Lôi kiếp tăng sát thương khi `nghiepLuc` cao và giảm khi `congDuc` cao / có Trận pháp hoặc Độ Kiếp Đan, cập nhật `maxAge` khi lên Trúc Cơ / Kim Đan / Nguyên Anh / Nhân Tiên.
- [ ] **Step 2:** Chạy test thấy FAIL.
- [ ] **Step 3:** Cài đặt `engine/cultivation.ts`.
- [ ] **Step 4:** Chạy test thấy PASS.

---

### Task 7: Economy, Professions, Sects, Tán Tu & Companions (`engine/economy.ts`, `engine/sect.ts`)

**Files:**
- Create: `web_game/src/engine/economy.ts`
- Create: `web_game/src/engine/sect.ts`
- Test: `web_game/src/__tests__/economy_sect.test.ts`

**Interfaces:**
- Produces: `updateInflation(state, rng)`, `getShopCatalog(state)`, `buyShopItem(state, item)`, `sellInventoryItem(state, itemId)`, `craftAction(state, mode, rng)`, `trainProfession(state, professionId)`, `joinSect(state, sectId)`, `foundOwnSect(state, name)`, `promoteSectRank(state, rng)`, `challengeRanking(state, rankingId, tactic, rng)`, `exploreSecretRealm(state, realmId, tactic, rng)`, `manageSectMine(state, rng)`, `stealProdigyLuck(state, rng)`, `travelRegion(state, regionId)`.

- [ ] **Step 1:** Viết test cho Lạm phát Giai đoạn 3 (giá không bao giờ NaN/âm), chế tạo Đan/Khí/Trận từ nguyên liệu, nhánh Tán Tu lập phái hoặc quản lý Động phủ, thăng cấp Tông môn & cướp Khí vận tăng Nghiệp lực.
- [ ] **Step 2:** Chạy test thấy FAIL.
- [ ] **Step 3:** Cài đặt `engine/economy.ts` và `engine/sect.ts`.
- [ ] **Step 4:** Chạy test thấy PASS.

---

### Task 8: Stage 4 Endgame, Laws, Cosmic Calamities & Save System (`engine/endgame.ts`, `engine/save.ts`)

**Files:**
- Create: `web_game/src/engine/endgame.ts`
- Create: `web_game/src/engine/save.ts`
- Test: `web_game/src/__tests__/endgame_save.test.ts`

**Interfaces:**
- Produces: `comprehendLaw(state, lawKey, rng)`, `decipherAncientScript(state, scriptId, rng)`, `faceCosmicCalamity(state, calamity, tactic, rng)`, `triggerBodyPossession(state, rng)` (Đoạt xá), `triggerReincarnation(state)` (Luân hồi giữ Đạo quả & 1 Công pháp), `triggerCryoHibernation(state)` (Xác ướp chiến lược đóng băng 500 năm), `saveToLocalStorage(state, legacy)`, `loadFromLocalStorage()`, `exportSaveString(state)`, `importSaveString(jsonStr)`.

- [ ] **Step 1:** Viết test kiểm tra Đoạt Xá (1 lần duy nhất trong đời theo `quyluatgiaodich.txt`), Luân Hồi tính Đạo Quả chính xác, Xác Ướp đóng băng tiến năm không tụt thọ nguyên, và `importSaveString` không crash với JSON sai định dạng.
- [ ] **Step 2:** Chạy test thấy FAIL.
- [ ] **Step 3:** Cài đặt `engine/endgame.ts` và `engine/save.ts`.
- [ ] **Step 4:** Chạy test thấy PASS.

---

### Task 9: Giao Diện React Đầy Đủ 5 Tab, Encounter Modal, Tàng Kinh Các & Kiểm Thử UI

**Files:**
- Modify: `web_game/src/App.tsx`
- Modify: `web_game/src/styles/theme.css`
- Modify: `web_game/src/components/RoadmapModal.tsx` (cập nhật trạng thái hoàn thiện theo từng mốc)
- Create: `web_game/src/components/StartScreen.tsx`
- Create: `web_game/src/components/TopHud.tsx`
- Create: `web_game/src/components/JourneyTab.tsx`
- Create: `web_game/src/components/CultivationTab.tsx`
- Create: `web_game/src/components/InventoryTab.tsx`
- Create: `web_game/src/components/WorldTab.tsx`
- Create: `web_game/src/components/CodexTab.tsx`
- Create: `web_game/src/components/ModalOverlay.tsx`
- Test: `web_game/src/__tests__/ui_flow.test.tsx`

**Interfaces:**
- Produces: Toàn bộ giao diện 5 tab responsive, gacha tuổi 0, chọn phương án A/B/C hiển thị tỷ lệ/điều kiện, popup Đột phá / Bí cảnh / Tuyệt lộ Thọ nguyên / Xuất nhập Save, Tàng Kinh Các tìm kiếm lọc theo loại.

- [ ] **Step 1:** Viết test UI tích hợp trong `ui_flow.test.tsx` (render `StartScreen` -> đổ xí ngầu vào game -> chọn phương án A/B/C qua nhiều năm -> chuyển tab Tu luyện / Túi & Chợ / Thế giới / Tàng Kinh Các).
- [ ] **Step 2:** Cài đặt toàn bộ components và styles Dark Xianxia Glassmorphism.
- [ ] **Step 3:** Chạy `npm.cmd test`, `npx.cmd tsc --noEmit`, `npm.cmd run build` đều PASS.

---

### Task 10: Kiểm Thử Chạy Thật Trên Trình Duyệt, Cập Nhật Tiến Độ Live & Đẩy Lên GitHub Pages

**Files:**
- Modify: `web_game/src/components/RoadmapModal.tsx` (đánh dấu v1.0 Hoàn thiện 100%)
- Create/Update: `README.md` (hướng dẫn chơi, link GitHub Pages, hướng dẫn tự sửa `.txt` và chạy lại `build_data.py`)

**Interfaces:**
- Produces: Bản build cuối cùng kiểm thử chạy thật trên preview server (`vite preview`), 0 console errors, đẩy sạch sẽ lên `https://github.com/lehongson2005/tutien4.0.git`.

- [ ] **Step 1:** Chạy `python -m unittest scripts/test_build_data.py`, `npm.cmd test`, `npx.cmd tsc --noEmit`, `npm.cmd run build`.
- [ ] **Step 2:** Khởi động `vite preview` tại cổng local, dùng trình duyệt headless / script kiểm tra trang load 200 OK, tài sản tĩnh dưới `/tutien4.0/` tải đúng, thao tác gacha + chọn A/B/C chạy thật không lỗi console.
- [ ] **Step 3:** Commit toàn bộ các bước còn lại và push lên `origin main`, kiểm tra `git status` sạch và xác nhận trạng thái triển khai GitHub Pages.
