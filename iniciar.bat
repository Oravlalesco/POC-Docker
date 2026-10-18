@echo off
chcp 65001 > nul
echo ======================================================
echo  Iniciando ClimaChile en entorno local (venv)
echo  Accede desde tu navegador en: http://127.0.0.1:5000
echo ======================================================

if exist "venv\Scripts\python.exe" (
    venv\Scripts\python.exe app.py
) else (
    echo [ERROR] No se encontro el entorno virtual venv.
    echo Creando entorno virtual...
    python -m venv venv
    venv\Scripts\pip.exe install -r requirements.txt
    venv\Scripts\python.exe app.py
)
pause
