@echo off
REM Setup Aptos CLI for BlazeIt contract deployment
REM This script installs and configures the Aptos CLI

echo 🚀 Setting up Aptos CLI for BlazeIt...

REM Check if aptos CLI is already installed
where aptos >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Aptos CLI is already installed
    aptos --version
    goto :setup_profile
)

echo 📦 Installing Aptos CLI...
echo Please install Aptos CLI manually from: https://aptos.dev/cli-tools/aptos-cli-tool/install-aptos-cli/
echo Or use: winget install AptosLabs.AptosCLI
echo.
echo After installation, please restart your terminal and run this script again.
pause
exit /b 1

:setup_profile
echo 🔧 Setting up aptos profile...
aptos account list --profile blaze-devnet >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Creating new profile...
    aptos init --profile blaze-devnet --network devnet
    echo ✅ Profile created. Please fund your account and run the deployment script.
) else (
    echo ✅ Profile already exists
)

echo 🎉 Aptos CLI setup complete!
echo.
echo Next steps:
echo 1. Fund your account: https://faucet.devnet.aptoslabs.com/
echo 2. Run: npm run move:compile
echo 3. Run: npm run move:publish
pause
