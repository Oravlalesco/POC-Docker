@echo off
chcp 65001 > nul
echo ======================================================
echo  Iniciando ClimaChile (Frontend + Backend Desacoplados)
echo ======================================================

cd /d "%~dp0"

echo [1/2] Abriendo Frontend en el navegador...
start "" "frontend\index.html"

echo [2/2] Iniciando Backend API Flask en http://127.0.0.1:5000...
echo Presiona Ctrl+C en esta consola para detener el backend.
echo ======================================================

if exist "venv\Scripts\python.exe" (
    venv\Scripts\python.exe backend\app.py
) else if exist "backend\venv\Scripts\python.exe" (
    backend\venv\Scripts\python.exe backend\app.py
) else (
    echo [ERROR] No se encontro el entorno virtual venv.
    echo Creando entorno virtual en ./venv...
    python -m venv venv
    venv\Scripts\pip.exe install -r backend\requirements.txt
    venv\Scripts\python.exe backend\app.py
)
pause
