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
echo "1. Update contract addresses in src/lib/contracts.ts:"
echo "   - blazeTokenLaunchpadV2: $DEPLOYED_ADDRESS"
echo "2. Update contract address in src/lib/blaze-sdk.ts:"
echo "   - CONTRACT_ADDRESS_V2: $DEPLOYED_ADDRESS"
echo "3. Apply database migration: migrations/add_v2_fields.sql"
echo "4. Initialize the V2 contract (already done via init_module)"
echo "5. Set admin and treasury addresses (if different from deployer)"
echo "6. Set initial APT/USD price in oracle (default is \$8.50)"
echo "7. Test the deployment with your frontend"
echo ""
echo "📋 V2 Contract Admin Functions:"
echo "   - launchpad_v2::set_admin(new_admin: address)"
echo "   - launchpad_v2::set_treasury(new_treasury: address)"
echo "   - launchpad_v2::update_fee(buy_fee_bps: u64, sell_fee_bps: u64)"
echo "   - launchpad_v2::update_oracle_price(price: u64, oracle_address: address)"
echo "   - launchpad_v2::force_migrate_to_hyperion(pool_id: Object<Metadata>)"
echo ""
echo "💡 To update oracle price via API:"
echo "   POST /api/admin/update-oracle"
echo "   Headers: Authorization: Bearer \$ADMIN_SECRET"
echo "   Body: { \"price\": 850, \"oracleAddress\": \"0x...\" }"
