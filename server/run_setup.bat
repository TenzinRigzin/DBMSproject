@echo off
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p123456 < "%~dp0setup.sql"
echo.
echo Done! Press any key to close...
pause
