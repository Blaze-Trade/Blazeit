@echo off
REM Deploy BlazeIt contracts to Aptos
REM This script handles the complete deployment process

echo 🚀 Starting BlazeIt contract deployment...

REM Check if aptos CLI is installed
where aptos >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ aptos CLI not found. Please install it first:
    echo    npm install -g aptos-cli
    exit /b 1
)

REM Check if profile exists
aptos account list --profile blaze-devnet >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo 🔧 Setting up aptos profile...
    aptos init --profile blaze-devnet
    echo ✅ Profile created. Please fund your account and run this script again.
    exit /b 0
)

REM Compile contracts
echo 📦 Compiling contracts...
npm run move:compile

REM Run tests
echo 🧪 Running tests...
npm run move:test

REM Publish contracts
echo 📤 Publishing contracts...
npm run move:publish

echo ✅ Contracts deployed successfully!
echo.
echo 🔧 Next steps:
echo 1. Update NEXT_PUBLIC_CONTRACT_ADDRESS in your .env file
echo 2. Initialize the contracts by calling the initialize functions
echo 3. Test the deployment with your frontend
echo.
echo 📋 Contract functions to initialize:
echo    - token_creation::initialize
echo    - quest_management::initialize
echo    - portfolio_trading::initialize
