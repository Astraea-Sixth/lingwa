#!/usr/bin/env bash
set -e

# ─────────────────────────────────────────────
#  Lingwa — One-command installer
#  https://github.com/Astraea-Sixth/lingwa
# ─────────────────────────────────────────────

BOLD="\033[1m"
GREEN="\033[32m"
YELLOW="\033[33m"
RED="\033[31m"
RESET="\033[0m"

REPO_URL="https://github.com/Astraea-Sixth/lingwa.git"
INSTALL_DIR="$HOME/lingwa"
OLLAMA_MODEL="mistral:7b"

print_step() { echo -e "\n${BOLD}→ $1${RESET}"; }
print_ok()   { echo -e "  ${GREEN}✓${RESET} $1"; }
print_warn() { echo -e "  ${YELLOW}⚠${RESET}  $1"; }
print_err()  { echo -e "  ${RED}✗${RESET} $1"; }

echo ""
echo -e "${BOLD}🦊 Lingwa — Language Learning, Free Forever${RESET}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ── Check prerequisites ──────────────────────

print_step "Checking prerequisites"

MISSING=()

# Node.js
if command -v node &>/dev/null; then
  NODE_VER=$(node -v | sed 's/v//')
  NODE_MAJOR=$(echo "$NODE_VER" | cut -d. -f1)
  if [ "$NODE_MAJOR" -lt 18 ]; then
    print_warn "Node.js v$NODE_VER found, but v18+ is required"
    MISSING+=("nodejs")
  else
    print_ok "Node.js v$NODE_VER"
  fi
else
  print_err "Node.js not found (need v18+)"
  MISSING+=("nodejs")
fi

# Python
if command -v python3 &>/dev/null; then
  PY_VER=$(python3 --version 2>&1 | awk '{print $2}')
  print_ok "Python $PY_VER"
else
  print_err "Python 3 not found"
  MISSING+=("python3")
fi

# Git
if command -v git &>/dev/null; then
  print_ok "Git $(git --version | awk '{print $3}')"
else
  print_err "Git not found"
  MISSING+=("git")
fi

# Ollama
if command -v ollama &>/dev/null; then
  print_ok "Ollama $(ollama --version 2>/dev/null | head -1 || echo 'installed')"
  OLLAMA_INSTALLED=true
else
  print_warn "Ollama not found — AI conversation (Nong) will be disabled"
  print_warn "Install from: https://ollama.ai"
  OLLAMA_INSTALLED=false
fi

if [ ${#MISSING[@]} -gt 0 ]; then
  echo ""
  print_err "Missing required tools: ${MISSING[*]}"
  echo ""
  echo "  Install instructions:"
  for dep in "${MISSING[@]}"; do
    case $dep in
      nodejs)
        echo "    Node.js:  https://nodejs.org (or: brew install node)"
        ;;
      python3)
        echo "    Python:   https://python.org (or: brew install python3)"
        ;;
      git)
        echo "    Git:      https://git-scm.com (or: brew install git)"
        ;;
    esac
  done
  echo ""
  exit 1
fi

# ── Clone repo ───────────────────────────────

print_step "Installing Lingwa"

if [ -d "$INSTALL_DIR" ]; then
  print_warn "Directory $INSTALL_DIR already exists — pulling latest..."
  cd "$INSTALL_DIR" && git pull --quiet
else
  git clone --quiet "$REPO_URL" "$INSTALL_DIR"
  print_ok "Cloned to $INSTALL_DIR"
fi

cd "$INSTALL_DIR"

# ── Install webapp dependencies ──────────────

print_step "Installing webapp dependencies"
cd webapp
npm install --silent
print_ok "npm packages installed"

# Copy env example if .env.local doesn't exist
if [ ! -f .env.local ]; then
  cp .env.example .env.local 2>/dev/null || echo "API_BASE_URL=http://localhost:5003" > .env.local
fi
cd ..

# ── Install API dependencies ─────────────────

print_step "Installing API dependencies"
cd api

if [ ! -d venv ]; then
  python3 -m venv venv
fi
source venv/bin/activate
pip install -q -r requirements.txt
print_ok "Python packages installed"
deactivate
cd ..

# ── Pull Ollama model ────────────────────────

if [ "$OLLAMA_INSTALLED" = true ]; then
  print_step "Pulling AI model ($OLLAMA_MODEL)"
  # Start Ollama if not running
  if ! pgrep -x ollama &>/dev/null; then
    ollama serve &>/dev/null &
    sleep 2
  fi
  ollama pull "$OLLAMA_MODEL" 2>/dev/null && print_ok "$OLLAMA_MODEL ready"
fi

# ── Done ─────────────────────────────────────

echo ""
echo -e "${BOLD}${GREEN}✓ Lingwa installed successfully!${RESET}"
echo ""
echo "  Start:  cd $INSTALL_DIR && bash start.sh"
echo "  Open:   http://localhost:3004"
echo ""
echo "  Or with Docker:"
echo "  cd $INSTALL_DIR && docker-compose up"
echo ""
