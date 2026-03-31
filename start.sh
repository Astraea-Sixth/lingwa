#!/bin/bash
# Lingwa — start all services

echo "Starting Lingwa..."

# Check Ollama
if ! curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
  echo "Ollama not running. Start it with: ollama serve"
  echo "Then pull a model: ollama pull mistral:7b"
  exit 1
fi

# Check if mistral model is available
if ! curl -s http://localhost:11434/api/tags | grep -q "mistral"; then
  echo "Pulling mistral:7b (this takes a few minutes)..."
  ollama pull mistral:7b
fi

# Start API
echo "Starting API (port 5003)..."
cd api
if [ ! -d "venv" ]; then
  echo "Creating Python venv..."
  python3 -m venv venv
  source venv/bin/activate
  pip install -r requirements.txt -q
else
  source venv/bin/activate
fi
uvicorn main:app --port 5003 --host 0.0.0.0 &
API_PID=$!
cd ..

# Wait for API
sleep 3
if ! curl -s http://localhost:5003/health > /dev/null; then
  echo "API failed to start"
  exit 1
fi
echo "API running on http://localhost:5003"

# Start frontend
echo "Starting frontend (port 3004)..."
cd webapp
if [ ! -d "node_modules" ]; then
  echo "Installing frontend dependencies..."
  npm install -q
fi
npm run dev &
cd ..

echo ""
echo "Lingwa is running!"
echo "  Open: http://localhost:3004"
echo ""
echo "Press Ctrl+C to stop"
wait
