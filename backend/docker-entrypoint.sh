#!/bin/sh
set -e

cd /app
echo "Running database migrations..."
npx prisma migrate deploy

cd /app/backend
echo "Starting backend..."
exec "$@"
