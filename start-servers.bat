@echo off
setlocal

where psql >nul 2>&1
if errorlevel 1 (
    echo PostgreSQL not found
    exit /b 1
)

if not exist .env (
    echo .env missing
    exit /b 1
)

psql -U postgres -d postgres -lqt | findstr /C:"articles_db" >nul 2>&1
if errorlevel 1 (
    psql -U postgres -d postgres -c "CREATE DATABASE articles_db;" >nul 2>&1
)

cd backend

call npm run db:migrate:status 2>nul | findstr "up" >nul 2>&1
if errorlevel 1 (
    call npm run db:migrate >nul 2>&1
)

for %%F in (..\backend\data\*.json) do (
    psql -U postgres -d articles_db -tAc "SELECT COUNT(*) FROM articles;" 2>nul | findstr "^0$" >nul 2>&1
    if not errorlevel 1 (
        call npm run db:migrate-data >nul 2>&1
    )
    goto :skip_check
)
:skip_check

start "Backend" cmd /k npm start
cd ..
timeout /t 2 /nobreak >nul
start "Frontend" cmd /k npm run dev
