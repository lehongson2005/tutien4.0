import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';

describe('App v0.1 Live Foundation', () => {
  it('renders game title and live roadmap tracker button', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /Nhân Sinh Tu Tiên/i })).toBeInTheDocument();
    const progressBtn = screen.getByRole('button', { name: /Tiến Độ Dự Án/i });
    expect(progressBtn).toBeInTheDocument();

    fireEvent.click(progressBtn);
    expect(screen.getByText(/Lộ Trình Phát Triển/i)).toBeInTheDocument();
    expect(screen.getByText(/v0\.1/i)).toBeInTheDocument();
  });
});
