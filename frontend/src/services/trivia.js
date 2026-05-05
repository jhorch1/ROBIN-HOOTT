const parseJsonOrThrow = async (response) => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data.error || data.message || `Error HTTP ${response.status}`;
    throw new Error(message);
  }
  return data;
};

export const obtenerCategoriasTrivia = async () => {
  const response = await fetch("/trivia/categorias", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  return parseJsonOrThrow(response);
};

export const obtenerPreguntasTrivia = async ({ cantidad = 10, categoria, dificultad } = {}) => {
  const params = new URLSearchParams();
  params.set("cantidad", String(cantidad));

  if (categoria) params.set("categoria", String(categoria));
  if (dificultad) params.set("dificultad", dificultad);

  const response = await fetch(`/trivia/preguntas?${params.toString()}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  return parseJsonOrThrow(response);
};

export const importarPreguntasTrivia = async ({ juegoId, token, preguntas }) => {
  const response = await fetch("/trivia/importar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ juegoId, token, preguntas }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok && response.status !== 207) {
    const message = data.error || data.message || `Error HTTP ${response.status}`;
    throw new Error(message);
  }

  return {
    status: response.status,
    ...data,
  };
};

export const obtenerJuegosTrivia = async () => {
  const response = await fetch("/api/juegos", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  return parseJsonOrThrow(response);
};