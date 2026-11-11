# Nhân Sinh Tu Tiên — Game Nhập Vai Mô Phỏng Tu Chân 4 Giai Đoạn

Trò chơi mô phỏng đời tu sĩ dạng chọn phương án **A / B / C** xuyên suốt 4 giai đoạn (`0–18`, `18–100`, `100–500`, `500+ tuổi`), chuyển hóa toàn bộ 36 kho tư liệu thế giới tu tiên (`*.txt`) và hơn 370 sự kiện cốt truyện thành Web RPG tĩnh viết bằng **React + TypeScript + Vite**.

- **Chơi trực tuyến (GitHub Pages):** https://lehongson2005.github.io/tutien4.0/
- **Xem hướng dẫn chạy chi tiết:** [remal.md](remal.md)

## Chạy nhanh trên máy (Windows PowerShell)

```powershell
cd web_game
npm.cmd install
npm.cmd run dev
```

Mở trình duyệt tại đường dẫn hiển thị trên terminal (thường là `http://localhost:5173/tutien4.0/`).

## Kiểm thử & Biên dịch dữ liệu

```powershell
# Biên dịch lại dữ liệu JSON nếu bạn chỉnh sửa các file .txt
python scripts/build_data.py
python -m unittest scripts/test_build_data.py

# Kiểm thử Engine & Giao diện + TypeScript + Build
cd web_game
npm.cmd test
npx.cmd tsc --noEmit
npm.cmd run build
```
