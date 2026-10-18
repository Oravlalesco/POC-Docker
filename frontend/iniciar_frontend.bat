@echo off
chcp 65001 > nul
echo ======================================================
echo  Iniciando Frontend ClimaChile
echo ======================================================

cd /d "%~dp0"

echo [1] Abriendo directamente en el navegador por defecto...
start "" index.html

echo [2] Si deseas servirlo como servidor local HTTP (Puerto 3000):
echo     Presiona cualquier tecla para iniciar servidor web local en http://localhost:3000
echo     (O cierra esta ventana si prefieres usar solo el navegador).
pause > nul

python -m http.server 3000
pause
