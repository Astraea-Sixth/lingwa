#!/bin/bash
echo "Stopping Lingwa..."
pkill -f "uvicorn main:app" 2>/dev/null
pkill -f "next dev" 2>/dev/null
echo "✅ Stopped"
