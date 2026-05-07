FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VITE_SITE_URL=http://localhost
ARG VITE_COVER_FALLBACK_BASE_URL=
ENV VITE_SITE_URL=$VITE_SITE_URL
ENV VITE_COVER_FALLBACK_BASE_URL=$VITE_COVER_FALLBACK_BASE_URL

RUN npm run build

FROM nginx:1.27-alpine

COPY deploy/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=15s --timeout=5s --retries=5 CMD wget -q -O - http://127.0.0.1/healthz || exit 1
