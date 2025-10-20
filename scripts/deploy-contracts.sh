#!/bin/bash

# Deploy BlazeIt contracts to Aptos
# This script handles the complete deployment process

set -e

echo "🚀 Starting BlazeIt contract deployment..."

# Check if aptos CLI is installed
if ! command -v aptos &> /dev/null; then
    echo "❌ aptos CLI not found. Please install it first:"
    echo "   npm install -g aptos-cli"
    exit 1
fi

# Check if profile exists
if ! aptos account list --profile blaze-devnet &> /dev/null; then
    echo "🔧 Setting up aptos profile..."
    aptos init --profile blaze-devnet
    echo "✅ Profile created. Please fund your account and run this script again."
    exit 0
fi

# Compile contracts
echo "📦 Compiling contracts..."
npm run move:compile

# Run tests
echo "🧪 Running tests..."
npm run move:test

# Publish contracts
echo "📤 Publishing contracts..."
npm run move:publish

# Get the deployed address
DEPLOYED_ADDRESS=$(aptos account list --profile blaze-devnet | grep "blaze-devnet" | awk '{print $2}')

echo "✅ Contracts deployed successfully!"
echo "📍 Contract address: $DEPLOYED_ADDRESS"
echo ""
echo "🔧 Next steps:"
echo "1. Update NEXT_PUBLIC_CONTRACT_ADDRESS in your .env file to: $DEPLOYED_ADDRESS"
echo "2. Initialize the contracts by calling the initialize functions"
echo "3. Test the deployment with your frontend"
echo ""
echo "📋 Contract functions to initialize:"
echo "   - token_creation::initialize"
echo "   - quest_management::initialize"
echo "   - portfolio_trading::initialize"
