/**
 * Admin API Route: Update Oracle Price
 *
 * Updates the APT/USD price in the V2 contract oracle
 * Should be called periodically (e.g., via cron job) or manually by admin
 */

import { getAptosNetwork } from "@/lib/constants";
import { CONTRACT_FUNCTIONS } from "@/lib/contracts";
import { Account, Aptos, AptosConfig, Ed25519PrivateKey } from "@aptos-labs/ts-sdk";
import { NextRequest, NextResponse } from "next/server";

// Initialize Aptos client with environment-based network configuration
const config = new AptosConfig({ network: getAptosNetwork() });
const aptos = new Aptos(config);

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get("authorization");
    const adminSecret = process.env.ADMIN_SECRET;

    if (!adminSecret) {
      return NextResponse.json(
        { error: "Admin secret not configured" },
        { status: 500 }
      );
    }

    if (!authHeader || authHeader !== `Bearer ${adminSecret}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get private key from environment
    const adminPrivateKey = process.env.ADMIN_PRIVATE_KEY;
    if (!adminPrivateKey) {
      return NextResponse.json(
        { error: "Admin private key not configured" },
        { status: 500 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { price, oracleAddress } = body;

    // Validate inputs
    if (!price || typeof price !== "number" || price <= 0) {
      return NextResponse.json(
        { error: "Invalid price. Must be a positive number (in USD cents, e.g., 850 for $8.50)" },
        { status: 400 }
      );
    }

    if (!oracleAddress || typeof oracleAddress !== "string") {
      return NextResponse.json(
        { error: "Invalid oracle address" },
        { status: 400 }
      );
    }

    // Create admin account from private key
    const privateKey = new Ed25519PrivateKey(adminPrivateKey);
    const adminAccount = Account.fromPrivateKey({ privateKey });

    // Build transaction to update oracle price
    const transaction = await aptos.transaction.build.simple({
      sender: adminAccount.accountAddress,
      data: {
        function: CONTRACT_FUNCTIONS.launchpadV2.updateOraclePrice as `${string}::${string}::${string}`,
        functionArguments: [
          price, // Price in USD cents
          oracleAddress, // Oracle address
        ],
      },
    });

    // Sign and submit transaction
    const committedTxn = await aptos.signAndSubmitTransaction({
      signer: adminAccount,
      transaction,
    });

    return NextResponse.json({
      success: true,
      transactionHash: committedTxn.hash,
      price,
      priceUsd: (price / 100).toFixed(2),
      oracleAddress,
    });
  } catch (error: any) {
    console.error("Error updating oracle price:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update oracle price" },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch current oracle price
export async function GET() {
  try {
    const result = await aptos.view({
      payload: {
        function: CONTRACT_FUNCTIONS.launchpadV2.getAptUsdPrice as `${string}::${string}::${string}`,
        functionArguments: [],
      }
    });

    const priceInCents = parseInt(result[0] as string);
    const priceInUsd = priceInCents / 100;

    return NextResponse.json({
      success: true,
      priceInCents,
      priceInUsd,
    });
  } catch (error: any) {
    console.error("Error fetching oracle price:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch oracle price" },
      { status: 500 }
    );
  }
}

