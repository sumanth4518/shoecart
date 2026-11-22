#!/bin/sh
set -e

# Dynamically generate runtime environment configuration for the React SPA
cat <<EOF > /usr/share/nginx/html/env-config.js
window.__ENV__ = {
  VITE_API_URL: "${VITE_API_URL:-}",
  VITE_STRIPE_PUBLISHABLE_KEY: "${VITE_STRIPE_PUBLISHABLE_KEY:-}"
};
EOF

# Execute the CMD passed to Docker (default: nginx -g "daemon off;")
exec "$@"
