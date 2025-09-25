#!/bin/bash

# Setup Aptos CLI for BlazeIt contract deployment
# This script installs and configures the Aptos CLI

set -e

echo "🚀 Setting up Aptos CLI for BlazeIt..."

# Check if aptos CLI is already installed
if command -v aptos &> /dev/null; then
    echo "✅ Aptos CLI is already installed"
    aptos --version
else
    echo "📦 Installing Aptos CLI..."
    
    # Install using the official installer
    curl -fsSL "https://aptos.dev/scripts/install_cli.py" | python3
    
    # Add to PATH if not already there
    if ! command -v aptos &> /dev/null; then
        echo "⚠️  Please add the aptos CLI to your PATH:"
        echo "   export PATH=\"\$HOME/.local/bin:\$PATH\""
        echo "   Then run this script again."
        exit 1
    fi
fi

# Initialize aptos profile
echo "🔧 Setting up aptos profile..."
if ! aptos account list --profile blaze-devnet &> /dev/null; then
    echo "Creating new profile..."
    aptos init --profile blaze-devnet --network devnet
    echo "✅ Profile created. Please fund your account and run the deployment script."
else
    echo "✅ Profile already exists"
fi

echo "🎉 Aptos CLI setup complete!"
echo ""
echo "Next steps:"
echo "1. Fund your account: https://faucet.devnet.aptoslabs.com/"
echo "2. Run: npm run move:compile"
echo "3. Run: npm run move:publish"
