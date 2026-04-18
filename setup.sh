#!/usr/bin/env bash
# ==============================================================================
# MedBoard — Setup Script
# ==============================================================================
# Handles environment setup for goinfre-constrained cluster machines.
# Fixes broken system npm, installs dependencies, sets up the database.
# ==============================================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m'

info()    { echo -e "${BLUE}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC} $1"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
error()   { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

GOINFRE_BASE="/goinfre/${USER}"
NODE_DIR="${GOINFRE_BASE}/node"
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

info "MedBoard Setup"
info "Project directory: ${PROJECT_DIR}"

# ─── Step 1: Ensure a working Node.js + npm ──────────────────────────────────
# The cluster system npm is often broken (missing semver module).
# We install a standalone Node.js LTS in goinfre if needed.

install_node() {
  local NODE_VERSION="v20.18.0"
  local ARCHIVE="node-${NODE_VERSION}-linux-x64.tar.xz"
  local URL="https://nodejs.org/dist/${NODE_VERSION}/${ARCHIVE}"

  info "Downloading Node.js ${NODE_VERSION} to goinfre..."
  curl -fsSL "${URL}" -o "${GOINFRE_BASE}/${ARCHIVE}"
  
  info "Extracting..."
  tar -xf "${GOINFRE_BASE}/${ARCHIVE}" -C "${GOINFRE_BASE}/"
  rm -f "${GOINFRE_BASE}/${ARCHIVE}"
  mv "${GOINFRE_BASE}/node-${NODE_VERSION}-linux-x64" "${NODE_DIR}"
  success "Node.js ${NODE_VERSION} installed at ${NODE_DIR}"
}

# Check if our local node works, or if system npm works
if [ -x "${NODE_DIR}/bin/node" ] && [ -x "${NODE_DIR}/bin/npm" ]; then
  info "Using existing Node.js at ${NODE_DIR}"
elif NODE_PATH=/usr/share/nodejs npm -v &>/dev/null; then
  info "System npm works with NODE_PATH fix"
  NODE_DIR=""
else
  warn "System npm is broken, installing standalone Node.js..."
  install_node
fi

# Set up PATH
if [ -n "${NODE_DIR}" ] && [ -d "${NODE_DIR}/bin" ]; then
  export PATH="${NODE_DIR}/bin:${PATH}"
fi

info "Node: $(node -v)"
info "npm:  $(npm -v)"

# ─── Step 2: Configure npm cache to goinfre ──────────────────────────────────
NPM_CACHE_DIR="${GOINFRE_BASE}/.npm_cache"
info "Configuring npm cache → ${NPM_CACHE_DIR}"
mkdir -p "${NPM_CACHE_DIR}"
export npm_config_cache="${NPM_CACHE_DIR}"
success "npm cache configured"

# ─── Step 3: Create .env.local if missing ─────────────────────────────────────
ENV_FILE="${PROJECT_DIR}/.env.local"

if [ ! -f "${ENV_FILE}" ]; then
  info "Creating .env.local"
  cat > "${ENV_FILE}" <<EOF
DATABASE_URL="file:${PROJECT_DIR}/prisma/dev.db"
JWT_SECRET="medboard-dev-secret-$(date +%s)"
NEXT_PUBLIC_APP_NAME="MedBoard"
EOF
  success ".env.local created"
else
  warn ".env.local already exists, skipping"
fi

# ─── Step 4: Install dependencies ─────────────────────────────────────────────
info "Installing dependencies..."
cd "${PROJECT_DIR}"
npm install
success "Dependencies installed"

# ─── Step 5: Generate Prisma client ───────────────────────────────────────────
info "Generating Prisma client..."
npx prisma generate
success "Prisma client generated"

# ─── Step 6: Run database migrations ──────────────────────────────────────────
info "Pushing database schema..."
npx prisma db push
success "Database schema applied"

# ─── Step 7: Seed the database ───────────────────────────────────────────────
info "Seeding database with demo data..."
npx prisma db seed
success "Database seeded"

# ─── Done ─────────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  MedBoard setup complete!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
echo ""

if [ -n "${NODE_DIR}" ] && [ -d "${NODE_DIR}/bin" ]; then
  echo -e "  ${YELLOW}IMPORTANT: Add Node.js to your PATH:${NC}"
  echo -e "    ${BLUE}export PATH=${NODE_DIR}/bin:\$PATH${NC}"
  echo ""
fi

echo -e "  Run the dev server:  ${BLUE}npm run dev${NC}"
echo ""
echo -e "  Demo credentials:"
echo -e "    Doctor:    ${YELLOW}dr.amrani@medboard.local${NC} / ${YELLOW}demo123${NC}"
echo -e "    Nurse:     ${YELLOW}n.benali@medboard.local${NC}  / ${YELLOW}demo123${NC}"
echo -e "    Admin:     ${YELLOW}admin@medboard.local${NC}     / ${YELLOW}demo123${NC}"
echo -e "    Read-only: ${YELLOW}viewer@medboard.local${NC}    / ${YELLOW}demo123${NC}"
echo ""
