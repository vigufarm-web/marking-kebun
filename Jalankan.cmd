@echo off
cd /d "%~dp0"
echo Aplikasi Marking Pisang berjalan di http://localhost:8765/
start "" "http://localhost:8765/"
python -m http.server 8765 --bind 127.0.0.1
pause
