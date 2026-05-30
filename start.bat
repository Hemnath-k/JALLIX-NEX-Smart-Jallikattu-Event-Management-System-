@echo off
echo ============================================
echo    JALLIX-NEX Management System
echo    Starting Servers...
echo ============================================
echo.

echo [1/2] Starting Flask Backend on http://localhost:5000...
start "Flask Backend" cmd /k "cd backend && python app.py"

timeout /t 3 /nobreak >nul

echo [2/2] Starting Frontend Server on http://localhost:8080...
start "Frontend Server" cmd /k "python -m http.server 8080"

echo.
echo ============================================
echo    Servers Started!
echo ============================================
echo.
echo Backend API:  http://localhost:5000
echo Frontend:     http://localhost:8080
echo.
echo Available Pages:
echo   - Login:     http://localhost:8080/login.html
echo   - Events:    http://localhost:8080/events.html
echo   - Bulls:     http://localhost:8080/bulls.html
echo   - Tamers:    http://localhost:8080/tamers.html
echo   - Dashboard: http://localhost:8080/dashboard.html
echo.
echo Press any key to stop all servers...
pause >nul

taskkill /FI "WINDOWTITLE eq Flask Backend*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Frontend Server*" /F >nul 2>&1

echo Servers stopped.
