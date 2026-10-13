@echo off
title CineMeca
cd /d "%~dp0"

if not exist node_modules (
  echo Instalando dependencias por primera vez...
  call npm install || goto :error
)

echo Preparando CineMeca...
call npm run build || goto :error

echo.
echo CineMeca esta abierto en http://localhost:5173
echo Cierra esta ventana cuando termines de jugar.
echo.
start "" http://localhost:5173
call npm run preview
goto :eof

:error
echo.
echo Algo fallo. Revisa el mensaje de arriba.
pause
