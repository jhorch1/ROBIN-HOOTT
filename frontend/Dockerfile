# Stage 1: Build
FROM node:24-alpine AS builder

WORKDIR /app

# Recibir variables de build como ARG
ARG VITE_API_URL=https://robinhoot-backend.onrender.com
ARG VITE_BACKEND_URL=https://robinhoot-backend.onrender.com

# Exportar como ENV para que Vite las tome durante el build
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

# Crear .env para Vite en build time
RUN echo "VITE_API_URL=$VITE_API_URL" > .env && \
    echo "VITE_BACKEND_URL=$VITE_BACKEND_URL" >> .env

RUN npm run build

# Stage 2: Runner
FROM node:24-alpine AS runner

WORKDIR /app

RUN mkdir -p ./build/server && \
    mkdir -p ./node_modules/.bin && \
    echo '#!/bin/sh' > ./node_modules/.bin/react-router-serve && \
    echo 'npx serve -s dist -l 3000' >> ./node_modules/.bin/react-router-serve && \
    chmod +x ./node_modules/.bin/react-router-serve && \
    touch ./build/server/index.js

COPY --from=builder /app/dist ./dist

# Principio de menor privilegio: usuario no-root
USER node

EXPOSE 3000

CMD ["./node_modules/.bin/react-router-serve", "./build/server/index.js"]
