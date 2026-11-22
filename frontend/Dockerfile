# ========================================================
# React Frontend Production Dockerfile (Multi-stage Nginx)
# ========================================================
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci || npm install

COPY . .

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

ARG VITE_STRIPE_PUBLISHABLE_KEY
ENV VITE_STRIPE_PUBLISHABLE_KEY=$VITE_STRIPE_PUBLISHABLE_KEY

RUN npm run build

# Nginx Production Stage
FROM nginx:alpine

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy built frontend assets
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom production nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy runtime environment variable generator into official Nginx entrypoint.d
COPY docker-entrypoint.sh /docker-entrypoint.d/40-generate-env-config.sh
RUN sed -i 's/\r$//' /docker-entrypoint.d/40-generate-env-config.sh && chmod +x /docker-entrypoint.d/40-generate-env-config.sh

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
