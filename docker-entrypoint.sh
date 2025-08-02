#!/bin/sh
set -e

# Cloud Run sets the PORT environment variable
# Default to 8080 if not set
export PORT=${PORT:-8080}

# Get backend URL from environment or use default
export BACKEND_URL=${BACKEND_URL:-"http://localhost:8001"}

echo "Starting nginx on port $PORT"
echo "Backend URL: $BACKEND_URL"

# Use envsubst to replace environment variables in the template
# This is more reliable than sed for complex substitutions
envsubst '${PORT} ${BACKEND_URL}' < /etc/nginx/nginx.template.conf > /tmp/nginx.conf

# Verify the configuration
nginx -t -c /tmp/nginx.conf

# Start nginx with the processed config
exec nginx -c /tmp/nginx.conf -g "daemon off;"