@echo off
cd backend
start cmd /k npm start
cd ..
timeout /t 2 /nobreak >nul
start cmd /k npm run dev

