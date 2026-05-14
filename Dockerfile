# Etapa de build: usa Node.js para construir la app
FROM node:20-alpine AS build

WORKDIR /app

# Instalar Angular CLI globalmente
RUN npm install -g @angular/cli

# Copia solo los archivos de dependencias y luego instala
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Copia el resto del código fuente y construye la app
COPY . .
RUN npm run build -- --configuration production

# Etapa final: usa Node.js para ejecutar el servidor SSR generado por Angular
FROM node:20-alpine

WORKDIR /app

# Define entorno de producción
ENV NODE_ENV=production

# Define hosts permitidos para SSR
ENV NG_ALLOWED_HOSTS=localhost:4200,127.0.0.1:4200,localhost:4000,127.0.0.1:4000

# Copia archivos de dependencias e instala solo las dependencias necesarias de runtime
COPY package*.json ./
RUN npm ci --omit=dev --legacy-peer-deps

# Copia el build generado por Angular (cliente + servidor)
COPY --from=build /app/dist /app/dist

# Expone el puerto del servidor SSR
EXPOSE 4000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --quiet --header="Host: localhost:4000" --tries=1 --spider http://127.0.0.1:4000/ || exit 1

# Comando por defecto para arrancar el servidor SSR
CMD ["node", "dist/infragest-frontend/server/server.mjs"]
