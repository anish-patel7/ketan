@echo off
setlocal EnableDelayedExpansion

echo ============================================
echo   LIMS App ^— Environment Setup (Windows)
echo ============================================

:: ── 1. Node.js ────────────────────────────────────────────────────────────────
set MIN_NODE=18

where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js not found.
    echo         Download and install Node.js v20+ from:
    echo         https://nodejs.org/en/download
    echo         Then re-run this script.
    pause
    exit /b 1
)

for /f "tokens=1 delims=." %%V in ('node -e "process.stdout.write(process.versions.node)"') do set NODE_MAJOR=%%V
echo [OK] Node.js found: v%NODE_MAJOR%.x

if %NODE_MAJOR% LSS %MIN_NODE% (
    echo [ERROR] Node.js v%MIN_NODE%+ is required ^(found v%NODE_MAJOR%^).
    echo         Download Node.js v20+ from: https://nodejs.org/en/download
    pause
    exit /b 1
)

:: ── 2. npm ────────────────────────────────────────────────────────────────────
where npm >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] npm not found. It normally ships with Node.js.
    pause
    exit /b 1
)

for /f %%V in ('npm -v') do set NPM_VER=%%V
echo [OK] npm found: v%NPM_VER%

:: ── 3. Install dependencies ───────────────────────────────────────────────────
echo.
echo [^>^>] Installing npm dependencies...
npm install
if %ERRORLEVEL% neq 0 (
    echo [ERROR] npm install failed. Check the output above for details.
    pause
    exit /b 1
)

echo.
echo ============================================
echo   Setup complete!
echo   Start the dev server with:
echo     npm run dev
echo   Then open: http://localhost:3000
echo ============================================
pause
