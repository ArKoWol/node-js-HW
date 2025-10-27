#!/bin/bash

BACKEND_PID=$(lsof -ti:3000)
if [ ! -z "$BACKEND_PID" ]; then
  kill -9 $BACKEND_PID
fi

FRONTEND_PID=$(lsof -ti:5173)
if [ ! -z "$FRONTEND_PID" ]; then
  kill -9 $FRONTEND_PID
fi

