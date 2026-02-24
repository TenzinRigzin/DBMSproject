@echo off
cd /d "%~dp0"
git add .
git commit -m "Initial commit: BMS project"
git branch -M main
git remote add origin https://github.com/TenzinRigzin/DBMSproject.git
git push -u origin main
echo.
echo Done! Press any key to close...
pause
