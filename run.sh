#!/usr/bin/env bash

# ═══════════════════════════════════════════════════════════
#  VOLTORA — Autonomous Financial Document Auditor
#  One-click launcher for FastAPI Backend & Vite Frontend
# ═══════════════════════════════════════════════════════════

set -e

# Terminal Colors
CYAN='\033[0;36m'
VIOLET='\033[0;35m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m' # No Color

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

print_banner() {
  echo -e "${CYAN}${BOLD}"
  echo "  ██╗   ██╗ ██████╗ ██╗  ████████╗ ██████╗ ██████╗  █████╗ "
  echo "  ██║   ██║██╔═══██╗██║  ╚══██╔══╝██╔═══██╗██╔══██╗██╔══██╗"
  echo "  ██║   ██║██║   ██║██║     ██║   ██║   ██║██████╔╝███████║"
  echo "  ╚██╗ ██╔╝██║   ██║██║     ██║   ██║   ██║██╔══██╗██╔══██║"
  echo "   ╚████╔╝ ╚██████╔╝███████╗██║   ╚██████╔╝██║  ██║██║  ██║"
  echo "    ╚═══╝   ╚═════╝ ╚══════╝╚═╝    ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝"
  echo -e "${NC}"
  echo -e "  ${VIOLET}${BOLD}⚡ Autonomous Multi-Dimensional Document Auditor${NC}"
  echo -e "  ${CYAN}Evidence-Grounded • Coordinate Anchors • Groq Neuro-Symbolic${NC}"
  echo "  ─────────────────────────────────────────────────────────────"
}

cleanup() {
  echo -e "\n\n${YELLOW}⚡ Shutting down Voltora services...${NC}"
  if [ -n "$BACKEND_PID" ] && kill -0 "$BACKEND_PID" 2>/dev/null; then
    kill "$BACKEND_PID" 2>/dev/null || true
  fi
  if [ -n "$FRONTEND_PID" ] && kill -0 "$FRONTEND_PID" 2>/dev/null; then
    kill "$FRONTEND_PID" 2>/dev/null || true
  fi
  # Double check port cleanup
  lsof -ti :8000 | xargs kill -9 2>/dev/null || true
  lsof -ti :5173 | xargs kill -9 2>/dev/null || true
  echo -e "${GREEN}✓ All services stopped safely.${NC}"
  exit 0
}

trap cleanup SIGINT SIGTERM EXIT

print_banner

# 1. Check prerequisites
echo -e "\n${BOLD}[1/4] Checking prerequisites...${NC}"

if ! command -v python3 &>/dev/null; then
  echo -e "${RED}✗ Error: python3 is not installed or not in PATH.${NC}"
  exit 1
fi

if ! command -v node &>/dev/null; then
  echo -e "${RED}✗ Error: node is not installed or not in PATH.${NC}"
  exit 1
fi

if ! command -v npm &>/dev/null; then
  echo -e "${RED}✗ Error: npm is not installed or not in PATH.${NC}"
  exit 1
fi

echo -e "  ${GREEN}✓${NC} Python: $(python3 --version)"
echo -e "  ${GREEN}✓${NC} Node: $(node --version)"
echo -e "  ${GREEN}✓${NC} npm: v$(npm --version)"

# 2. Check & Setup Python Virtual Environment
echo -e "\n${BOLD}[2/4] Setting up Python backend environment...${NC}"
if [ ! -d ".venv" ]; then
  echo -e "  ${YELLOW}Creating Python virtual environment in .venv...${NC}"
  python3 -m venv .venv
fi

VENV_PYTHON="$PROJECT_ROOT/.venv/bin/python"
VENV_PIP="$PROJECT_ROOT/.venv/bin/pip"
VENV_UVICORN="$PROJECT_ROOT/.venv/bin/uvicorn"

if [ ! -f "$VENV_UVICORN" ]; then
  echo -e "  ${YELLOW}Installing Python backend dependencies...${NC}"
  "$VENV_PIP" install --upgrade pip
  "$VENV_PIP" install -r requirements.txt
else
  echo -e "  ${GREEN}✓${NC} Python virtual environment is ready."
fi

# 3. Check & Setup Frontend dependencies
echo -e "\n${BOLD}[3/4] Setting up Vite frontend environment...${NC}"
if [ ! -d "frontend/node_modules" ]; then
  echo -e "  ${YELLOW}Installing frontend node_modules...${NC}"
  cd "$PROJECT_ROOT/frontend"
  npm install
  cd "$PROJECT_ROOT"
else
  echo -e "  ${GREEN}✓${NC} Frontend dependencies are ready."
fi

# Free up ports if occupied
echo -e "\n${BOLD}[4/4] Launching services...${NC}"
lsof -ti :8000 | xargs kill -9 2>/dev/null || true
lsof -ti :5173 | xargs kill -9 2>/dev/null || true

# Start FastAPI Backend
echo -e "  ${CYAN}Starting FastAPI backend on port 8000...${NC}"
"$VENV_UVICORN" backend.main:app --host 127.0.0.1 --port 8000 --reload > /dev/null 2>&1 &
BACKEND_PID=$!

# Wait for backend to be healthy
MAX_WAIT=20
WAIT_COUNT=0
until curl -s http://127.0.0.1:8000/api/health > /dev/null 2>&1; do
  sleep 0.5
  WAIT_COUNT=$((WAIT_COUNT + 1))
  if [ "$WAIT_COUNT" -ge "$MAX_WAIT" ]; then
    echo -e "${RED}✗ Error: Backend server failed to start within 10 seconds.${NC}"
    exit 1
  fi
done
echo -e "  ${GREEN}✓${NC} Backend online at ${BOLD}http://localhost:8000${NC}"

# Start Vite Frontend
echo -e "  ${CYAN}Starting Vite frontend on port 5173...${NC}"
cd "$PROJECT_ROOT/frontend"
npm run dev -- --host 127.0.0.1 --port 5173 > /dev/null 2>&1 &
FRONTEND_PID=$!
cd "$PROJECT_ROOT"

# Wait for frontend to be responsive
WAIT_COUNT=0
until curl -s http://localhost:5173 > /dev/null 2>&1; do
  sleep 0.5
  WAIT_COUNT=$((WAIT_COUNT + 1))
  if [ "$WAIT_COUNT" -ge "$MAX_WAIT" ]; then
    echo -e "${RED}✗ Error: Frontend server failed to start within 10 seconds.${NC}"
    exit 1
  fi
done
echo -e "  ${GREEN}✓${NC} Frontend online at ${BOLD}http://localhost:5173${NC}"

# Open browser if on macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
  echo -e "  ${VIOLET}Opening application in default browser...${NC}"
  open "http://localhost:5173" || true
fi

echo ""
echo "  ═════════════════════════════════════════════════════════════"
echo -e "  ${GREEN}${BOLD}🚀 Voltora is running live!${NC}"
echo -e "  ${BOLD}Frontend UI:${NC}    ${CYAN}http://localhost:5173${NC}"
echo -e "  ${BOLD}Backend API:${NC}    ${CYAN}http://localhost:8000${NC}"
echo -e "  ${BOLD}Swagger Docs:${NC}   ${CYAN}http://localhost:8000/docs${NC}"
echo "  ═════════════════════════════════════════════════════════════"
echo -e "  ${YELLOW}Press Ctrl+C to stop all services.${NC}"
echo ""

# Keep alive until user interrupts
wait
