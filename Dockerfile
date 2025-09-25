# Etapa de build: usa Node.js para construir la app
FROM node:20 AS build

WORKDIR /app

# Copia solo los archivos de dependencias y luego instala
COPY package*.json ./
RUN npm install

# Copia el resto del código fuente y construye la app
COPY . .
RUN npm run build --output-path=dist

# Etapa final: usa Nginx para servir archivos estáticos
FROM nginx:alpine

# Copia el build generado al directorio público de Nginx
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

# Comando por defecto para arrancar Nginx
CMD ["nginx", "-g", "daemon off;"]
