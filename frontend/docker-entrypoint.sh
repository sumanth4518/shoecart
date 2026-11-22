#!/bin/sh
set -e

# If a custom PORT environment variable is provided by Render, configure Nginx to listen on it
if [ -n "$PORT" ] && [ "$PORT" != "80" ]; then
  sed -i "s/listen 80;/listen $PORT;/g" /etc/nginx/conf.d/default.conf
fi

# Dynamically generate runtime environment configuration for the Storefront React SPA
cat <<EOF > /usr/share/nginx/html/env-config.js
window.__ENV__ = {
  VITE_API_URL: "${VITE_API_URL:-}",
  VITE_STRIPE_PUBLISHABLE_KEY: "${VITE_STRIPE_PUBLISHABLE_KEY:-}"
};
EOF
