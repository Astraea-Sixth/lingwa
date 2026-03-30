#!/bin/bash
# Lingwa — start all services

set -e

echo "🦊 Starting Lingwa..."

# ── API ────────────────────────────────────────────────────────
cd api

# Create venv if missing
if [ ! -d "venv" ]; then
  echo "  Creating Python environment..."
  python3 -m venv venv
fi

# Always use venv Python
source venv/bin/activate

# Install/update dependencies
echo "  Installing API dependencies..."
pip install -r requirements.txt -q

# Start API with venv Python (not system uvicorn)
echo "  Starting API (port 5005)..."
python3 -m uvicorn main:app --port 5005 --host 0.0.0.0 &
API_PID=$!
cd ..

# Wait for API to be ready
sleep 3
if ! curl -s http://localhost:5005/health > /dev/null 2>&1; then
  echo "  ✗ API failed to start — check logs"
  exit 1
fi
echo "  ✓ API running on http://localhost:5005"

# ── Ollama (optional — for AI tutor) ──────────────────────────
if command -v ollama &>/dev/null; then
  if ! curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "  Starting Ollama..."
    ollama serve &>/dev/null &
    sleep 3
  fi
  if ! curl -s http://localhost:11434/api/tags | grep -q "mistral" 2>/dev/null; then
    echo "  Pulling mistral:7b for AI tutor (one-time, ~4GB)..."
    ollama pull mistral:7b
  fi
  echo "  ✓ Ollama ready (AI tutor enabled)"
else
  echo "  ⚠ Ollama not found — AI conversation (Nong) will be disabled"
  echo "    Install from: https://ollama.ai"
fi

# ── Webapp ─────────────────────────────────────────────────────
cd webapp

if [ ! -d "node_modules" ]; then
  echo "  Installing frontend dependencies..."
  npm install -q
fi

# Create .env.local if missing
if [ ! -f ".env.local" ]; then
  echo "API_BASE_URL=http://localhost:5005" > .env.local
fi

echo "  Starting webapp (port 3004)..."
npm run dev &
cd ..

sleep 4
echo ""
echo "  ✓ Lingwa is running!"
echo ""
echo "  → Open: http://localhost:3004"
echo ""
echo "  Press Ctrl+C to stop"
echo ""

wait
