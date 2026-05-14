#!/bin/bash

# DataFlow Agent Setup Script
# Automates initial setup for OOBE x Ace Data Cloud bounty

set -e

echo "🚀 DataFlow Agent Setup"
echo "======================"
echo ""

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "❌ Node.js 20+ required (you have: $(node -v))"
    exit 1
fi
echo "✅ Node.js version: $(node -v)"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Create keys directory
echo ""
echo "🔑 Setting up keys..."
mkdir -p keys

# Check if keypair exists
if [ ! -f "keys/dataflow-agent.json" ]; then
    echo "⚠️  Agent keypair not found. Generate one with:"
    echo "   synapse-sap env keypair generate --out keys/dataflow-agent.json"
    echo ""
    echo "   Or using Solana CLI:"
    echo "   solana-keygen new --outfile keys/dataflow-agent.json"
    echo ""
    read -p "Press Enter after generating keypair..."
fi

# Check if manifest exists
if [ ! -f "manifest.json" ]; then
    echo "📋 Creating agent manifest from template..."
    cp manifest.example.json manifest.json
    echo "⚠️  Please edit manifest.json with your agent details"
    echo "   - Update x402Endpoint with your agent URL"
    echo "   - Add your website/github/contact info"
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚙️  Creating .env from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env with your configuration:"
    echo "   - SOLANA_RPC_URL: Get API key from https://synapse.oobeprotocol.ai/"
    echo "   - Review other settings"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env with your Synapse RPC URL"
echo "2. Edit manifest.json with your agent details"
echo "3. Run: npm run register  (to register agent on SAP)"
echo "4. Run: npm run demo      (to test the workflow)"
echo ""
echo "📚 Documentation:"
echo "   - README.md: Project overview"
echo "   - IMPLEMENTATION.md: Detailed implementation guide"
echo ""
