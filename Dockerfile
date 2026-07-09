# ---------- Etapa 1: build ----------
FROM node:20-alpine AS build
WORKDIR /app

# Instalar dependencias (usa el lockfile para builds reproducibles)
COPY package.json package-lock.json ./
RUN npm ci

# Copiar el resto del código y compilar
COPY . .
RUN npm run build

# ---------- Etapa 2: runtime ----------
FROM nginx:1.27-alpine AS runtime

# Config personalizada de nginx (SPA-friendly, healthcheck, etc.)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar únicamente el resultado del build (carpeta dist)
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -qO- http://127.0.0.1:8080/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
