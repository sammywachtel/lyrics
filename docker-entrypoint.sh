#!/bin/sh
set -e

# Cloud Run sets the PORT environment variable
# Default to 8080 if not set
PORT=${PORT:-8080}

echo "Starting nginx on port $PORT"

# Since we're running as non-root, we need to create a temp copy
# of the nginx config and modify it
cp /etc/nginx/nginx.conf /tmp/nginx.conf
sed -i "s/listen 8080;/listen $PORT;/g" /tmp/nginx.conf

# Start nginx with the modified config
exec nginx -c /tmp/nginx.conf -g "daemon off;"