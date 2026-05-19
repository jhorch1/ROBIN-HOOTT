# Imagen base Node 20 Alpine
FROM node:20-alpine

# Directorio de trabajo
WORKDIR /app

# Copiar package files primero (mejor uso del cache de Docker)
COPY package.json package-lock.json ./

# Instalar solo dependencias de producción
RUN npm ci --omit=dev

# Copiar el resto del código fuente
COPY . .

# Exponer puerto de la aplicación
EXPOSE 5001
ENV PORT=5001

# Comando para arrancar
CMD ["node", "server.js"]
