# Script para iniciar el sistema completo en Windows

Write-Host "🚀 Iniciando Sistema de Gestión de Espacios" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Gray

# Verificar que estamos en el directorio correcto
$projectRoot = "c:\Users\Usuario 1\Downloads\FastAPICreation"

# Función para verificar si un puerto está en uso
function Test-Port {
    param($Port)
    $connection = Test-NetConnection -ComputerName localhost -Port $Port -InformationLevel Quiet -WarningAction SilentlyContinue
    return $connection
}

# Verificar puerto 8000 (Backend)
Write-Host "`n📍 Verificando puerto 8000 (Backend)..." -ForegroundColor Yellow
if (Test-Port 8000) {
    Write-Host "⚠️  Puerto 8000 ya está en uso. El backend puede estar corriendo." -ForegroundColor Yellow
    $continue = Read-Host "¿Continuar de todas formas? (s/n)"
    if ($continue -ne "s") {
        Write-Host "❌ Operación cancelada" -ForegroundColor Red
        exit
    }
}

# Verificar puerto 5173 (Frontend)
Write-Host "📍 Verificando puerto 5173 (Frontend)..." -ForegroundColor Yellow
if (Test-Port 5173) {
    Write-Host "⚠️  Puerto 5173 ya está en uso. El frontend puede estar corriendo." -ForegroundColor Yellow
    $continue = Read-Host "¿Continuar de todas formas? (s/n)"
    if ($continue -ne "s") {
        Write-Host "❌ Operación cancelada" -ForegroundColor Red
        exit
    }
}

Write-Host "`n" + "=" * 50 -ForegroundColor Gray
Write-Host "📝 Instrucciones:" -ForegroundColor Cyan
Write-Host "   1. Se abrirán 2 ventanas de terminal" -ForegroundColor White
Write-Host "   2. Terminal 1: Backend (FastAPI) - Puerto 8000" -ForegroundColor White
Write-Host "   3. Terminal 2: Frontend (React) - Puerto 5173" -ForegroundColor White
Write-Host "   4. Espera a que ambos estén listos" -ForegroundColor White
Write-Host "   5. Abre http://localhost:5173 en tu navegador" -ForegroundColor White
Write-Host "=" * 50 -ForegroundColor Gray

Read-Host "`nPresiona Enter para continuar"

# Iniciar Backend en nueva terminal
Write-Host "`n🔧 Iniciando Backend (FastAPI)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", @"
    Write-Host '🔧 BACKEND - FastAPI' -ForegroundColor Green
    Write-Host '=' * 50 -ForegroundColor Gray
    cd '$projectRoot'
    Write-Host 'Iniciando servidor en puerto 8000...' -ForegroundColor Yellow
    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
"@

# Esperar 3 segundos para que el backend inicie
Start-Sleep -Seconds 3

# Iniciar Frontend en nueva terminal
Write-Host "🎨 Iniciando Frontend (React)..." -ForegroundColor Blue
Start-Process powershell -ArgumentList "-NoExit", "-Command", @"
    Write-Host '🎨 FRONTEND - React + Vite' -ForegroundColor Blue
    Write-Host '=' * 50 -ForegroundColor Gray
    cd '$projectRoot\Front-API-main'
    Write-Host 'Iniciando servidor en puerto 5173...' -ForegroundColor Yellow
    npm run dev
"@

Write-Host "`n✅ Servidores iniciándose..." -ForegroundColor Green
Write-Host "`n📊 URLs:" -ForegroundColor Cyan
Write-Host "   Backend:  http://localhost:8000/docs" -ForegroundColor White
Write-Host "   Frontend: http://localhost:5173" -ForegroundColor White

Write-Host "`n💡 Tip: Espera unos segundos a que ambos servidores estén listos" -ForegroundColor Yellow
Write-Host "`n🛑 Para detener: Cierra las ventanas de terminal que se abrieron" -ForegroundColor Gray

Read-Host "`nPresiona Enter para salir"
