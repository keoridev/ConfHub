#!/bin/sh
set -e

echo "==> Running migrations..."
app --migrate

echo "==> Seeding database..."
app --seed

echo "==> Starting server..."
exec app
