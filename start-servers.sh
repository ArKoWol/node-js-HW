#!/bin/bash

cleanup() {
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup INT TERM

cd backend
npm start &
BACKEND_PID=$!
cd ..

sleep 2

npm run dev &
FRONTEND_PID=$!

wait
