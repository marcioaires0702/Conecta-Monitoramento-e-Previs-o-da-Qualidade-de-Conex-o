@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo === Conecta+ no navegador (API real) ===
echo Passo 1/3: instalando dependencias (pode levar alguns minutos)...
call npm install
if errorlevel 1 goto erro
echo Passo 2/3: instalando suporte ao navegador...
call npx expo install react-native-web react-dom @expo/metro-runtime
if errorlevel 1 goto erro
echo Passo 3/3: abrindo o app. O navegador vai abrir sozinho.
echo Dica: aperte F12 e clique no icone de celular para ver como no telefone.
call npx expo start --web -c
goto fim
:erro
echo.
echo Algo deu errado. Tire foto desta tela e me envie.
:fim
pause
