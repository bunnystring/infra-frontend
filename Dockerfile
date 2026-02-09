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

# Etapa final: usa Nginx para servir archivos estáticos
FROM nginx:alpine

# Copia el build generado al directorio público de Nginx
COPY --from=build /app/dist/infragest-frontend/browser /usr/share/nginx/html

# Copia configuración de nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expone el puerto 80 para servir la aplicación
EXPOSE 80

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Comando por defecto para arrancar Nginx
CMD ["nginx", "-g", "daemon off;"]
