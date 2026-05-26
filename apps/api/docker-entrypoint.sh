#!/bin/sh
set -e

echo "Running Prisma migrations..."
npx prisma migrate deploy

if [ "$RUN_SEED" = "true" ]; then
  echo "Seeding database..."
  npx prisma db seed
fi

echo "Starting API on port ${PORT:-3001}..."
exec node dist/main.js
