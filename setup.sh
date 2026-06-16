#!/usr/bin/env bash
# LIMS App — Linux/macOS setup script
# Run once before starting the dev server: bash setup.sh

set -e

echo "============================================"
echo "  LIMS App — Environment Setup (Linux/Mac)"
echo "============================================"

# ── 1. Node.js ────────────────────────────────────────────────────────────────
MIN_NODE=18

if command -v node &>/dev/null; then
  NODE_VER=$(node -e "process.stdout.write(process.versions.node.split('.')[0])")
  echo "[OK] Node.js found: v$(node -v | tr -d 'v')"
  if [ "$NODE_VER" -lt "$MIN_NODE" ]; then
    echo "[ERROR] Node.js v${MIN_NODE}+ is required (found v${NODE_VER})."
    echo "        Install it from https://nodejs.org or via nvm:"
    echo "          curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash"
    echo "          nvm install 20"
    exit 1
  fi
else
  echo "[ERROR] Node.js not found. Install v${MIN_NODE}+ from https://nodejs.org"
  exit 1
fi

# ── 2. npm ────────────────────────────────────────────────────────────────────
if command -v npm &>/dev/null; then
  echo "[OK] npm found: $(npm -v)"
else
  echo "[ERROR] npm not found. It normally ships with Node.js."
  exit 1
fi

# ── 3. Install dependencies ───────────────────────────────────────────────────
echo ""
echo "[>>] Installing npm dependencies..."
npm install

echo ""
echo "============================================"
echo "  Setup complete!"
echo "  Start the dev server with:"
echo "    npm run dev"
echo "  Then open: http://localhost:3000"
echo "============================================"
