import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import LandingPage from '../LandingPage';
import { useAuth } from '../../hooks/useAuth';

// Mock del hook useAuth
vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

const mockNavigate = vi.fn();
// Mock de useNavigate
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('LandingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza correctamente para usuarios NO autenticados', () => {
    (useAuth as Mock).mockReturnValue({ usuario: null });

    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );

    expect(screen.getAllByText(/Robin HOOT/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/¡EMPIEZA GRATIS!/i)).toBeInTheDocument();
  });

  it('redirige a /dashboard si el usuario YA está autenticado', () => {
    (useAuth as Mock).mockReturnValue({ usuario: { name: 'Test User' } });

    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('abre y cierra el demo modal', () => {
    (useAuth as Mock).mockReturnValue({ usuario: null });

    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );

    // Abrir modal
    fireEvent.click(screen.getByText(/PROBAR DEMO RÁPIDA/i));
    expect(screen.getByText(/¡Demo de Robin HOOT!/i)).toBeInTheDocument();

    // El mock no está renderizando el interior exacto o el GameDemo es un componente real?
    // GameDemo es un componente real que tiene un botón "✕" para cerrar
    const closeBtn = screen.getByText('✕');
    fireEvent.click(closeBtn);

    expect(screen.queryByText(/¡Demo de Robin HOOT!/i)).not.toBeInTheDocument();
  });
});
