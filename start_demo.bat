@echo off
title Department Notice Board System Prototype
echo ========================================================
echo  Starting Department Notice Board System Demo
echo ========================================================
echo.
echo Opening your browser to http://localhost:8000 ...
start http://localhost:8000
echo.
echo Starting Python web server on port 8000...
echo (Keep this window open while using the website)
echo Press Ctrl+C in this window when you want to stop.
echo.
python -m http.server 8000
pause
