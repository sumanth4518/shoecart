#!/bin/sh
set -e

# Dynamically generate runtime environment configuration for the Storefront React SPA
cat <<EOF > /usr/share/nginx/html/env-config.js
window.__ENV__ = {
  VITE_API_URL: "${VITE_API_URL:-}",
  VITE_STRIPE_PUBLISHABLE_KEY: "${VITE_STRIPE_PUBLISHABLE_KEY:-}"
};
EOF
