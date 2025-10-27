@echo off
cd backend
start "Backend Server" cmd /k npm start
cd ..
timeout /t 2 /nobreak >nul
start "Frontend Server" cmd /k npm run dev
