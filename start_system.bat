@echo off
REM Script para iniciar el sistema completo en Windows

echo ========================================
echo   Sistema de Gestion de Espacios
echo ========================================
echo.

REM Cambiar al directorio del proyecto
cd /d "c:\Users\Usuario 1\Downloads\FastAPICreation"

echo [1/2] Iniciando Backend (FastAPI)...
start "Backend - FastAPI" cmd /k "uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

REM Esperar 3 segundos
timeout /t 3 /nobreak > nul

echo [2/2] Iniciando Frontend (React)...
start "Frontend - React" cmd /k "cd Front-API-main && npm run dev"

echo.
echo ========================================
echo   Servidores Iniciados
echo ========================================
echo.
echo Backend:  http://localhost:8000/docs
echo Frontend: http://localhost:5173
echo.
echo Presiona cualquier tecla para salir...
pause > nul
