FROM node:22-alpine AS build

WORKDIR /app

ARG VITE_AMAP_KEY
ARG VITE_AMAP_SECURITY_CODE

ENV VITE_AMAP_KEY=$VITE_AMAP_KEY
ENV VITE_AMAP_SECURITY_CODE=$VITE_AMAP_SECURITY_CODE

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 5200
