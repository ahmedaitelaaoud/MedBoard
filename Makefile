# ==============================================================================
# MedBoard — Makefile
# ==============================================================================
# On cluster machines with broken npm, first run: make fix-node
# Then proceed with: make setup
# ==============================================================================

GOINFRE = /goinfre/$(USER)
NODE_DIR = $(GOINFRE)/node
NPM_CACHE = $(GOINFRE)/.npm_cache

# If local node exists, use it
ifneq ($(wildcard $(NODE_DIR)/bin/node),)
  export PATH := $(NODE_DIR)/bin:$(PATH)
endif

export npm_config_cache := $(NPM_CACHE)

.PHONY: fix-node setup dev build clean seed reset studio lint

# Download and install Node.js LTS to goinfre (fixes broken system npm)
fix-node:
	@echo "📦 Downloading Node.js v20.18.0 to goinfre..."
	@mkdir -p $(GOINFRE)
	@curl -fsSL https://nodejs.org/dist/v20.18.0/node-v20.18.0-linux-x64.tar.xz -o $(GOINFRE)/node.tar.xz
	@echo "📂 Extracting..."
	@rm -rf $(NODE_DIR)
	@tar -xf $(GOINFRE)/node.tar.xz -C $(GOINFRE)/
	@mv $(GOINFRE)/node-v20.18.0-linux-x64 $(NODE_DIR)
	@rm -f $(GOINFRE)/node.tar.xz
	@echo "✅ Node.js installed at $(NODE_DIR)"
	@echo ""
	@echo "⚠️  Add to your shell:"
	@echo "  export PATH=$(NODE_DIR)/bin:\$$PATH"
	@echo ""
	@$(NODE_DIR)/bin/node -v
	@$(NODE_DIR)/bin/npm -v

# Full setup (first time — run after fix-node if needed)
setup:
	@mkdir -p $(NPM_CACHE)
	@echo "📦 Installing dependencies..."
	npm install
	@echo "🔧 Generating Prisma client..."
	npx prisma generate
	@echo "🗄️  Pushing database schema..."
	npx prisma db push
	@echo "🌱 Seeding database..."
	npx prisma db seed
	@echo ""
	@echo "✅ Setup complete! Run: make dev"
	@echo ""
	@echo "Demo credentials (password: demo123):"
	@echo "  Doctor:    dr.amrani@medboard.local"
	@echo "  Nurse:     n.benali@medboard.local"
	@echo "  Admin:     admin@medboard.local"
	@echo "  Patient:   patient.kettani@medboard.local"

# Start development server
dev:
	npm run dev

# Production build
build:
	npm run build

# Open Prisma Studio (database GUI)
studio:
	npx prisma studio

# Re-seed the database
seed:
	npx prisma db seed

# Reset database completely
reset:
	rm -f prisma/dev.db
	npx prisma db push
	npx prisma db seed

# Generate Prisma client after schema changes
generate:
	npx prisma generate

# Push schema changes to database
push:
	npx prisma db push

# Lint
lint:
	npm run lint

# Clean build artifacts and database
clean:
	rm -rf .next
	rm -f prisma/dev.db

# Clean everything including node_modules
clean-all: clean
	rm -rf node_modules
