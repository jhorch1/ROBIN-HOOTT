import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from '../Dashboard';
import { useAuth } from '../../hooks/useAuth';
import * as api from '../../services/api';

vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../services/api', () => ({
  getBackendData: vi.fn(),
  obtenerRankingMaraton: vi.fn(),
  actualizarPerfilUsuario: vi.fn(),
}));

vi.mock('../../socket', () => ({
  default: {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
  },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, 'alert').mockImplementation(() => {});
    (useAuth as Mock).mockReturnValue({
      usuario: { _id: '1', nombre: 'Test User', role: 'ESTUDIANTE', email: 'test@test.com' },
      logout: vi.fn(),
    });
    (api.getBackendData as Mock).mockResolvedValue([
      { usuarioId: '1', nombre: 'Test User', puntaje: 100 },
    ]);
    (api.obtenerRankingMaraton as Mock).mockResolvedValue([]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renderiza el saludo inicial con el nombre del usuario', async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Hola, Test User!/i)).toBeInTheDocument();
    });
  });

  it('carga y muestra la puntuación del ranking', async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('10')).toBeInTheDocument();
    });
  });

  it('abre y cierra el modal de editar perfil', async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    const editBtn = await screen.findByRole('button', { name: /Editar Perfil/i });
    fireEvent.click(editBtn);

    expect(screen.getByRole('heading', { name: /Editar Perfil/i, level: 2 })).toBeInTheDocument();

    const cancelBtn = screen.getByRole('button', { name: /CANCELAR/i });
    fireEvent.click(cancelBtn);

    expect(screen.queryByRole('heading', { name: /Editar Perfil/i, level: 2 })).not.toBeInTheDocument();
  });

  it('permite guardar el perfil y llama al API', async () => {
    // Mock the reload to avoid breaking test runner
    const originalReload = window.location.reload;
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { reload: vi.fn() }
    });

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    fireEvent.click(await screen.findByRole('button', { name: /Editar Perfil/i }));

    const inputs = screen.getAllByDisplayValue('Test User') as HTMLInputElement[];
    const input = inputs.find(el => el.placeholder !== 'Tu nickname en el juego') || inputs[inputs.length - 1];
    fireEvent.change(input, { target: { value: 'New Name' } });

    fireEvent.click(screen.getByRole('button', { name: /GUARDAR CAMBIOS/i }));

    await waitFor(() => {
      expect(api.actualizarPerfilUsuario).toHaveBeenCalledWith('1', { nombre: 'New Name' });
    });

    window.location.reload = originalReload;
  });

  it('abre el modal de duelo, inicia búsqueda, muestra timeout y cancela', async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    fireEvent.click(await screen.findByRole('button', { name: /BUSCAR RIVAL/i }));
    
    expect(screen.getByText(/Buscando a un rival digno/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /CANCELAR BÚSQUEDA/i }));
    
    expect(screen.queryByText(/Buscando a un rival digno/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Buscando a un rival digno/i)).not.toBeInTheDocument();
  });

  it('muestra timeout si el duelo tarda demasiado y maneja error de carga de ranking con string', async () => {
    (api.getBackendData as Mock).mockRejectedValueOnce('Error raro de string');
    
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    const button = screen.getByRole('button', { name: /BUSCAR RIVAL/i });
    
    vi.useFakeTimers();
    fireEvent.click(button);
    
    // Activar timeout
    act(() => {
      vi.advanceTimersByTime(7500);
    });
    
    expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('tardó demasiado'));
  });

  it('maneja error al actualizar perfil devolviendo un string', async () => {
    (api.actualizarPerfilUsuario as Mock).mockRejectedValueOnce('Error de red raro');
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    fireEvent.click(await screen.findByRole('button', { name: /Editar Perfil/i }));
    const inputs = screen.getAllByDisplayValue('Test User') as HTMLInputElement[];
    const input = inputs.find(el => el.placeholder !== 'Tu nickname en el juego') || inputs[inputs.length - 1];
    fireEvent.change(input, { target: { value: 'New Name' } });
    
    fireEvent.click(screen.getByRole('button', { name: /GUARDAR CAMBIOS/i }));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Error al actualizar perfil');
    });
  });




  it('renderiza el top de maratón cuando hay datos', async () => {
    (api.obtenerRankingMaraton as Mock).mockResolvedValue([
      { usuarioId: '1', nombre: 'Test User', puntaje: 500, aciertos: 5, totalPreguntas: 50, partidas: 1 },
      { usuarioId: '2', nombre: 'Otro User', puntaje: 300, aciertos: 3, totalPreguntas: 50, partidas: 1 },
    ]);

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Tu posición en la maratón: #1/i)).toBeInTheDocument();
      expect(screen.getByText(/Otro User/i)).toBeInTheDocument();
    });
  });

  it('hace scroll al hacer clic en el desafío clásico', async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    const playClassicBtn = await screen.findByRole('button', { name: /¡JUGAR YA!/i });
    
    // Mock scrollIntoView
    const scrollIntoViewMock = vi.fn();
    window.HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;

    fireEvent.click(playClassicBtn);

    expect(scrollIntoViewMock).toHaveBeenCalled();
  });

  it('cierra el modal de editar perfil al darle cancelar o en el overlay', async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    fireEvent.click(await screen.findByRole('button', { name: /Editar Perfil/i }));
    
    const cancelBtn = screen.getByRole('button', { name: /CANCELAR/i });
    fireEvent.click(cancelBtn);

    expect(screen.queryByRole('heading', { name: /Editar Perfil/i, level: 2 })).not.toBeInTheDocument();
  });

  it('maneja eventos de sockets correctamente', async () => {
    // Necesitamos obtener los callbacks registrados
    const socketOn = (await import('../../socket')).default.on as Mock;
    
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    // Obtener los callbacks
    const duelFoundCall = socketOn.mock.calls.find(c => c[0] === 'duel_found');
    const duelErrorCall = socketOn.mock.calls.find(c => c[0] === 'duel_error');
    const marathonReadyCall = socketOn.mock.calls.find(c => c[0] === 'marathon_ready');
    const marathonErrorCall = socketOn.mock.calls.find(c => c[0] === 'marathon_error');

    if (duelFoundCall) {
      duelFoundCall[1]({ pin: '1234' });
    }
    if (duelErrorCall) {
      duelErrorCall[1]({ message: 'Error duel' });
    }
    if (marathonReadyCall) {
      marathonReadyCall[1]({ pin: '5678' });
    }
    if (marathonErrorCall) {
      marathonErrorCall[1]({ message: 'Error marathon' });
    }
  });

  it('abre el modal de maratón sin romperse y lo cierra', async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    const marathonBtns = await screen.findAllByRole('button', { name: /EMPEZAR|ABRIR MARATÓN/i });
    fireEvent.click(marathonBtns[0]);

    // Estamos en el intro, hacer click en COMENZAR MARATÓN
    const comenzarBtn = await screen.findByRole('button', { name: /COMENZAR MARATÓN/i });
    fireEvent.click(comenzarBtn);

    // Ahora estamos en step='question'. Hacer click en SALIR
    const salirBtn = await screen.findByRole('button', { name: /SALIR/i });
    fireEvent.click(salirBtn);
  });
});
