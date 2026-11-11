import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';

describe('Task 9: Full UI 5-Tab Gameplay Integration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('rolls character, enters game, plays event choice A/B/C, advances year, and switches all 5 tabs', () => {
    render(<App />);

    // Enter name & roll destiny
    const nameInput = screen.getByLabelText(/Đạo hiệu tu sĩ/i);
    fireEvent.change(nameInput, { target: { value: 'Diệp Phàm' } });

    const rollBtn = screen.getByRole('button', { name: /Đổ Xí Ngầu Khởi Nguyên/i });
    fireEvent.click(rollBtn);

    expect(screen.getByText(/^Xuất Thân \(/i)).toBeInTheDocument();
    expect(screen.getByText(/^Thể Chất \(/i)).toBeInTheDocument();

    const startBtn = screen.getByRole('button', { name: /Bước Vào Tu Chân Giới/i });
    fireEvent.click(startBtn);

    // Top HUD visible with character name and Age 0
    expect(screen.getByTestId('hud-name')).toHaveTextContent('Diệp Phàm');

    // JourneyTab: pick first enabled choice button (A/B/C)
    const choiceBtns = screen.getAllByTestId('event-choice-btn');
    expect(choiceBtns.length).toBe(3);
    fireEvent.click(choiceBtns[0]);

    // Outcome shown, Advance Year button visible
    const advanceBtn = screen.getByRole('button', { name: /Sống tiếp/i });
    fireEvent.click(advanceBtn);
    expect(screen.getByTestId('hud-age')).toHaveTextContent(/1\s*\//);

    // Switch to Tab 2: Tu Luyện and trigger meditation (-1 AP)
    fireEvent.click(screen.getByRole('tab', { name: /Tu Luyện/i }));
    const meditateBtn = screen.getByRole('button', { name: /Bế Quan Thổ Nạp/i });
    expect(meditateBtn).toBeInTheDocument();
    fireEvent.click(meditateBtn);
    expect(screen.getByText(/AP: 1 \/ 2/i)).toBeInTheDocument();

    // Switch to Tab 3: Túi & Chợ
    fireEvent.click(screen.getByRole('tab', { name: /Túi & Chợ/i }));
    expect(screen.getByRole('heading', { name: /Vạn Bảo Các/i })).toBeInTheDocument();

    // Switch to Tab 4: Thế Giới
    fireEvent.click(screen.getByRole('tab', { name: /Thế Giới/i }));
    expect(screen.getByRole('heading', { name: /Bản Đồ Ngũ Đại Vực/i })).toBeInTheDocument();

    // Switch to Tab 5: Tàng Kinh Các and test live search
    fireEvent.click(screen.getByRole('tab', { name: /Tàng Kinh Các/i }));
    const searchInput = screen.getByPlaceholderText(/Tìm kiếm trong Tàng Kinh Các/i);
    expect(searchInput).toBeInTheDocument();
    fireEvent.change(searchInput, { target: { value: 'Hoang Cổ' } });
    expect(screen.getAllByText(/Hoang Cổ Thánh Thể/i).length).toBeGreaterThan(0);

    // Open Save / Export Modal and verify JSON textarea & invalid import handling
    fireEvent.click(screen.getByRole('button', { name: /Lưu \/ Xuất Save/i }));
    const exportBox = screen.getByLabelText(/Chuỗi Save JSON xuất ra/i) as HTMLTextAreaElement;
    expect(exportBox.value).toContain('Diệp Phàm');

    const importBox = screen.getByLabelText(/Ô dán chuỗi Save JSON/i);
    fireEvent.change(importBox, { target: { value: '{broken json' } });
    fireEvent.click(screen.getByRole('button', { name: /Nạp Dữ Liệu Save/i }));
    expect(screen.getByText(/lỗi cú pháp/i)).toBeInTheDocument();

    // Close save modal, go back to start screen and resume saved run
    fireEvent.click(screen.getByRole('button', { name: /Đóng bảng lưu trữ/i }));
    fireEvent.click(screen.getByRole('button', { name: /Về màn hình chính/i }));
    const resumeBtn = screen.getByRole('button', { name: /Chơi Tiếp/i });
    fireEvent.click(resumeBtn);
    expect(screen.getByTestId('hud-name')).toHaveTextContent('Diệp Phàm');
  });
});
