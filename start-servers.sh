#!/bin/bash
set -e

cd "$(dirname "$0")"

PSQL=$(command -v psql || echo "/opt/homebrew/opt/postgresql@15/bin/psql")

[ ! -x "$PSQL" ] && echo "❌ PostgreSQL not found" && exit 1
[ ! -f .env ] && echo "❌ .env missing" && exit 1

$PSQL -d postgres -lqt | cut -d \| -f 1 | grep -qw articles_db || $PSQL -d postgres -c "CREATE DATABASE articles_db;" >/dev/null

cd backend

npm run db:migrate:status 2>/dev/null | grep -q "up" || npm run db:migrate >/dev/null

[ "$($PSQL -d articles_db -tAc "SELECT COUNT(*) FROM articles;" 2>/dev/null)" = "0" ] && [ -n "$(ls data/*.json 2>/dev/null)" ] && npm run db:migrate-data >/dev/null

cleanup() { kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0; }
trap cleanup INT TERM

npm start &
BACKEND_PID=$!
cd ..
sleep 2
npm run dev &
FRONTEND_PID=$!
wait
