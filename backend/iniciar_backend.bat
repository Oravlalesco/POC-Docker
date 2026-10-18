@echo off
chcp 65001 > nul
echo ======================================================
echo  Iniciando Backend API ClimaChile (Flask en venv)
echo  Endpoint API: http://127.0.0.1:5000
echo ======================================================

cd /d "%~dp0"

if exist "..\venv\Scripts\python.exe" (
    ..\venv\Scripts\python.exe app.py
) else if exist "venv\Scripts\python.exe" (
    venv\Scripts\python.exe app.py
) else (
    echo [INFO] No se encontro venv existente. Creando entorno virtual local...
    python -m venv venv
    venv\Scripts\pip.exe install -r requirements.txt
    venv\Scripts\python.exe app.py
)
pause
