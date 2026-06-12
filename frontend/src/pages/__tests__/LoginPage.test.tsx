import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from '../LoginPage';
import { useAuth } from '../../hooks/useAuth';

vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('LoginPage', () => {
  const mockLogin = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as Mock).mockReturnValue({ login: mockLogin });
  });

  it('renderiza el formulario de inicio de sesión correctamente', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    expect(screen.getByPlaceholderText(/tu@uniputumayo.edu.co/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/••••••••/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /INGRESAR/i })).toBeInTheDocument();
  });

  it('muestra errores de validación si los campos están vacíos', async () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    const submitBtn = screen.getByRole('button', { name: /INGRESAR/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/El email es requerido/i)).toBeInTheDocument();
      expect(screen.getByText(/La contraseña es requerida/i)).toBeInTheDocument();
    });
  });

  it('llama a login y redirige si las credenciales son correctas', async () => {
    mockLogin.mockResolvedValueOnce(undefined); // Login exitoso

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/tu@uniputumayo.edu.co/i), {
      target: { value: 'test@uniputumayo.edu.co' },
    });
    fireEvent.change(screen.getByPlaceholderText(/••••••••/i), {
      target: { value: '123456' },
    });

    fireEvent.click(screen.getByRole('button', { name: /INGRESAR/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@uniputumayo.edu.co', '123456');
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('muestra error de API si las credenciales son incorrectas', async () => {
    mockLogin.mockRejectedValueOnce(new Error('Credenciales inválidas'));

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/tu@uniputumayo.edu.co/i), {
      target: { value: 'mal@uniputumayo.edu.co' },
    });
    fireEvent.change(screen.getByPlaceholderText(/••••••••/i), {
      target: { value: '123456' },
    });

    fireEvent.click(screen.getByRole('button', { name: /INGRESAR/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalled();
      expect(screen.getByText(/Credenciales inválidas/i)).toBeInTheDocument();
    });
  });
  it('muestra error genérico si el rechazo no es un Error instance', async () => {
    mockLogin.mockRejectedValueOnce('Error raro');

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/tu@uniputumayo.edu.co/i), { target: { value: 'mal@uniputumayo.edu.co' } });
    fireEvent.change(screen.getByPlaceholderText(/••••••••/i), { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: /INGRESAR/i }));

    await waitFor(() => {
      expect(screen.getByText(/Credenciales incorrectas/i)).toBeInTheDocument();
    });
  });
});
