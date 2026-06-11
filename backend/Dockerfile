# ── Imagen base Node 24 Alpine (requerimiento rubric: node:24-alpine) ──────────
FROM node:24-alpine

# Directorio de trabajo
WORKDIR /app

# Copiar package files primero (mejor uso del cache de Docker)
COPY package.json package-lock.json ./

# Instalar solo dependencias de producción
RUN npm ci --omit=dev

# Copiar el resto del código fuente
COPY . .

# Principio de menor privilegio: transferir control al usuario seguro "node"
# node:alpine ya incluye el usuario "node" (uid 1000), solo ajustamos permisos
RUN chown -R node:node /app
USER node

# Exponer puerto de la aplicación
EXPOSE 5001
ENV PORT=5001

# Comando para arrancar
CMD ["node", "server.js"]
