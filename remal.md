# Nhân Sinh Tu Tiên — Hướng Dẫn Chạy & Giới Thiệu Game (`remal.md`)

> Trò chơi nhập vai mô phỏng đời tu tiên **4 giai đoạn** (`0–18`, `18–100`, `100–500`, `500+ tuổi`) dạng chọn phương án **A / B / C** có điều kiện, xác suất theo Khí vận, 30 cảnh giới, Đột phá / Tâm ma / Lôi kiếp, Lạm phát Linh thạch, Tán Tu / Tông môn, và 2.400+ mục tư liệu thế giới từ toàn bộ 40 file `.txt`.

---

## 1. Chơi trực tuyến trên mạng (GitHub Pages)

- **Địa chỉ web:** https://lehongson2005.github.io/tutien4.0/
- **Cách kích hoạt (chỉ làm 1 lần nếu web chưa sáng):**
  1. Vào GitHub repository: https://github.com/lehongson2005/tutien4.0/settings/pages
  2. Mục **Build and deployment → Source** chọn **GitHub Actions**.
  3. Mỗi khi đẩy code lên nhánh `main`, workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) sẽ tự động chạy kiểm thử, build bản sản phẩm và xuất bản ra link trên.

---

## 2. Cách chạy trực tiếp trên máy cá nhân (Local)

### Yêu cầu môi trường
- **Node.js** `>= 20` (máy hiện tại dùng Node v24 + npm)
- **Python** `>= 3.10` (chỉ cần khi muốn biên dịch lại dữ liệu từ các file `.txt`)

### Bước 1: Cài đặt thư viện (lần đầu)
> **Lưu ý trên Windows PowerShell:** Nếu máy chặn `npm.ps1` do ExecutionPolicy, hãy dùng **`npm.cmd`** và **`npx.cmd`** (hoặc chạy trong Command Prompt `cmd`).

```powershell
cd web_game
npm.cmd install
```

### Bước 2: Chạy chế độ phát triển (Dev Server)
```powershell
cd web_game
npm.cmd run dev
```
Sau đó mở trình duyệt tại địa chỉ hiển thị trên terminal (thường là `http://localhost:5173/tutien4.0/`).

### Bước 3: Build bản production & xem trước (`preview`)
```powershell
cd web_game
npm.cmd run build
npm.cmd run preview
```
Mở trình duyệt tại `http://localhost:4173/tutien4.0/`.

---

## 3. Chạy kiểm thử (Tests)

### Kiểm thử toàn bộ Game Engine & Giao diện (Vitest)
```powershell
cd web_game
npm.cmd test
npx.cmd tsc --noEmit
```

### Kiểm thử Pipeline dữ liệu Python
```powershell
python -m unittest scripts/test_build_data.py
```

---

## 4. Tự thêm sự kiện / vật phẩm vào các file `.txt`

Tất cả kho dữ liệu gốc nằm ở thư mục gốc (`*.txt`). Sau khi chỉnh sửa hoặc bổ sung dòng mới vào bất kỳ file nào (`0den18.txt`, `18den100.txt`, `100den500.txt`, `500+.txt`, `thechat.txt`, `phapbao.txt`, v.v.):

1. Chạy lệnh biên dịch lại dữ liệu JSON cho React:
   ```powershell
   python scripts/build_data.py
   ```
2. Kiểm tra lại bộ test dữ liệu:
   ```powershell
   python -m unittest scripts/test_build_data.py
   ```
3. Build lại hoặc đẩy lên `main` để GitHub Pages tự cập nhật.

---

## 5. Cấu trúc dự án

- `*.txt`: Kho 36 file thế giới tu tiên + 4 file kịch bản biến cố 4 giai đoạn (370 sự kiện).
- `scripts/build_data.py`: Pipeline Python chuyển đổi `.txt` sang JSON chuẩn trong `web_game/src/data/generated/`.
- `web_game/src/engine/`: Toàn bộ logic game thuần TypeScript (`character.ts`, `events.ts`, `cultivation.ts`, `economy.ts`, `sect.ts`, `endgame.ts`, `save.ts`).
- `web_game/src/components/`: Giao diện Dark Tiên Hiệp gồm 5 tab (*Hành Trình*, *Tu Luyện*, *Túi & Chợ*, *Thế Giới*, *Tàng Kinh Các*).
- `.github/workflows/deploy.yml`: Tự động kiểm thử, build và triển khai GitHub Pages.
