@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo === Conecta+ no celular (API real) ===
echo Passo 1/2: instalando dependencias (pode levar alguns minutos)...
call npm install
if errorlevel 1 goto erro
echo Passo 2/2: aparecera um QR Code. Escaneie com o app Expo Go.
call npx expo start -c
goto fim
:erro
echo.
echo Algo deu errado. Tire foto desta tela e me envie.
:fim
pause
