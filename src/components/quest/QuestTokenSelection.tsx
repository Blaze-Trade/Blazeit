"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useBlockchainTokens } from "@/hooks/useBlockchainTokens";
import { useQuestStaking } from "@/hooks/useQuestStaking";
import { useSupabaseQuests } from "@/hooks/useSupabaseQuests";
import { useSupabaseTokens } from "@/hooks/useSupabaseTokens";
import { formatDuration } from "@/lib/utils";
import { usePortfolioStore } from "@/stores/portfolioStore";
import type { Quest, Token } from "@shared/types";
import { AlertTriangle, ArrowLeft, Check, Minus, Plus } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface TokenSelection {
  token: Token;
  quantity: number;
  investmentAmount: number;
}

interface QuestTokenSelectionProps {
  quest: Quest;
  onBack: () => void;
}

export function QuestTokenSelection({
  quest,
  onBack,
}: QuestTokenSelectionProps) {
  const router = useRouter();
  const { address, joinQuest } = usePortfolioStore();
  const { joinQuest: submitQuestPortfolio } = useSupabaseQuests();
  const { selectPortfolio: selectPortfolioBlockchain } = useQuestStaking();
  const {
    tokens: supabaseTokens,
    loading: supabaseLoading,
    error: supabaseError,
  } = useSupabaseTokens();
  const {
    tokens: blockchainTokens,
    loading: blockchainLoading,
    error: blockchainError,
  } = useBlockchainTokens();

  const tokens =
    blockchainTokens.length > 0 ? blockchainTokens : supabaseTokens;
  const tokensLoading = blockchainLoading || supabaseLoading;
  const tokensError = blockchainError || supabaseError;

  const [selectedTokens, setSelectedTokens] = useState<TokenSelection[]>([]);
  const [confirming, setConfirming] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [transactionHash, setTransactionHash] = useState<string>("");

  // Show error toast if tokens fail to load
  useEffect(() => {
    if (tokensError) {
      toast.error("Failed to fetch tokens");
    }
  }, [tokensError]);

  const addTokenSelection = (token: Token) => {
    if (selectedTokens.find((s) => s.token.id === token.id)) {
      toast.error("Token already selected");
      return;
    }

    // Enforce maximum 5 tokens (as per smart contract)
    if (selectedTokens.length >= 5) {
      toast.error("You can select up to 5 tokens for the quest");
      return;
    }

    const newSelection: TokenSelection = {
      token,
      quantity: 1,
      investmentAmount: token.price,
    };
    setSelectedTokens([...selectedTokens, newSelection]);
  };

  const removeTokenSelection = (tokenId: string) => {
    setSelectedTokens(selectedTokens.filter((s) => s.token.id !== tokenId));
  };

  const updateTokenQuantity = (tokenId: string, quantity: number) => {
    if (quantity <= 0) {
      removeTokenSelection(tokenId);
      return;
    }

    setSelectedTokens(
      selectedTokens.map((s) =>
        s.token.id === tokenId
          ? { ...s, quantity, investmentAmount: s.token.price * quantity }
          : s
      )
    );
  };

  const updateInvestmentAmount = (tokenId: string, amount: number) => {
    if (amount <= 0) {
      removeTokenSelection(tokenId);
      return;
    }

    setSelectedTokens(
      selectedTokens.map((s) =>
        s.token.id === tokenId
          ? { ...s, investmentAmount: amount, quantity: amount / s.token.price }
          : s
      )
    );
  };

  const totalInvestment = selectedTokens.reduce(
    (sum, s) => sum + s.investmentAmount,
    0
  );
  const totalWithFees = totalInvestment + quest.entryFee;

  const handleConfirmSelection = () => {
    if (selectedTokens.length < 1 || selectedTokens.length > 5) {
      toast.error("You must select between 1 and 5 tokens for the quest");
      return;
    }
    setShowConfirmation(true);
  };

  const handleFinalConfirmation = async () => {
    if (!address) {
      toast.error("Please connect your wallet");
      return;
    }

    // Validate portfolio size (1-5 tokens as per smart contract)
    if (selectedTokens.length < 1 || selectedTokens.length > 5) {
      toast.error("You must select between 1 and 5 tokens");
      return;
    }

    setConfirming(true);
    try {
      // Extract token addresses and investment amounts
      const tokenAddresses = selectedTokens.map((s) => {
        let address = s.token.address || s.token.id;

        // Validate that we have an address
        if (!address) {
          throw new Error(`No address found for token ${s.token.symbol}`);
        }

        // Ensure the address is properly formatted for Aptos (64 characters)
        if (address.startsWith("0x")) {
          // Remove 0x prefix and pad to 64 characters
          const hexPart = address.slice(2);
          const paddedHex = hexPart.padStart(64, "0");
          address = `0x${paddedHex}`;
        } else {
          // If no 0x prefix, add it and pad
          const paddedHex = address.padStart(64, "0");
          address = `0x${paddedHex}`;
        }

        // Validate final address length
        if (address.length !== 66) {
          // 0x + 64 hex chars
          throw new Error(
            `Invalid address format for token ${s.token.symbol}: ${address}`
          );
        }

        console.log(
          `Original address: ${
            s.token.address || s.token.id
          }, Formatted: ${address}`
        );
        return address;
      });
      const amountsAPT = selectedTokens.map((s) => s.investmentAmount);

      // Step 1: Submit portfolio to blockchain
      let portfolioResult;
      if (quest.blockchainQuestId) {
        // Convert APT amounts to USDC amounts (6 decimals) for the smart contract
        // For MVP, we'll use 1 APT = 10 USDC conversion
        const amountsUSDC = amountsAPT.map(
          (apt) => Math.floor(apt * 10 * 1000000).toString() // *10 for APT->USD, *1000000 for 6 decimals
        );

        // Call select_portfolio entrypoint with token addresses and USDC amounts
        portfolioResult = await selectPortfolioBlockchain({
          questId: quest.blockchainQuestId,
          tokenAddresses,
          amountsUSDC,
        });

        if (!portfolioResult.success) {
          toast.error("Failed to submit portfolio to blockchain");
          return;
        }
      } else {
        toast.error("Quest not properly configured for blockchain operations");
        return;
      }

      // Store transaction hash
      setTransactionHash(portfolioResult.hash || "");

      const portfolioResult_db = await submitQuestPortfolio(quest.id, address);

      if (portfolioResult_db.success) {
        // Add to local state
        joinQuest(quest);

        // Show success modal
        setShowSuccessModal(true);

        // Auto-redirect after 5 seconds
        setTimeout(() => {
          router.push(`/quests/${quest.id}`);
        }, 5000);
      } else {
        toast.warning(
          "Portfolio submitted to blockchain but failed to save to database. Transaction: " +
            portfolioResult.hash?.slice(0, 10)
        );
        console.error(
          "Failed to save portfolio to database:",
          portfolioResult_db.error
        );
      }
    } catch (error) {
      console.error("Transaction error:", error);
      toast.error("Failed to complete transaction");
    } finally {
      setConfirming(false);
    }
  };

  // Success Modal Component
  if (showSuccessModal) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-none border-4 border-blaze-black shadow-blaze-shadow max-w-md w-full p-8 space-y-6">
          {/* Success Icon */}
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center">
              <Check className="w-12 h-12 text-white" />
            </div>
          </div>

          {/* Success Message */}
          <div className="text-center space-y-3">
            <h2 className="font-display text-3xl font-bold text-blaze-black">
              Transaction Successful!
            </h2>
            <p className="text-lg text-blaze-black/80">
              You have successfully joined <strong>{quest.name}</strong>
            </p>
          </div>

          {/* Transaction Details */}
          <div className="bg-blaze-black/5 p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-blaze-black/70">Amount Sent:</span>
              <span className="font-mono font-bold">1 APT</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-blaze-black/70">
                Tokens Selected:
              </span>
              <span className="font-mono font-bold">
                {selectedTokens.length}
              </span>
            </div>
            {transactionHash && (
              <div className="pt-2 border-t border-blaze-black/10">
                <span className="text-xs text-blaze-black/50">
                  Transaction Hash:
                </span>
                <p className="font-mono text-xs break-all">
                  {transactionHash.slice(0, 20)}...
                </p>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="space-y-3">
            <Button
              onClick={() => router.push(`/quests/${quest.id}`)}
              className="w-full h-12 rounded-none border-2 border-blaze-black bg-blaze-orange text-blaze-black font-bold uppercase hover:bg-blaze-black hover:text-blaze-white"
            >
              Go to Quest Dashboard
            </Button>
            <p className="text-center text-sm text-blaze-black/50">
              Redirecting automatically in 5 seconds...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (tokensLoading) {
    return (
      <div className="p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-blaze-black/10 w-1/3"></div>
            <div className="h-64 bg-blaze-black/10"></div>
          </div>
        </div>
      </div>
    );
  }

  if (showConfirmation) {
    return (
      <div className="p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <Button
            variant="outline"
            onClick={() => setShowConfirmation(false)}
            className="border-2 border-blaze-black rounded-none h-12 px-4 flex items-center gap-2 font-bold uppercase text-lg hover:bg-blaze-black/5"
          >
            <ArrowLeft /> Back to Selection
          </Button>

          <Card className="rounded-none border-2 border-blaze-black shadow-blaze-shadow">
            <CardHeader className="border-b-2 border-blaze-black">
              <CardTitle className="font-display text-4xl font-bold">
                Confirm Quest Entry
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              {/* Quest Details */}
              <div className="space-y-4">
                <h3 className="font-display text-2xl font-bold">
                  Quest: {quest.name}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="border-2 border-blaze-black p-4">
                    <p className="text-sm uppercase tracking-wider text-blaze-black/70">
                      Entry Fee
                    </p>
                    <p className="text-2xl font-bold">${quest.entryFee}</p>
                  </div>
                  <div className="border-2 border-blaze-black p-4">
                    <p className="text-sm uppercase tracking-wider text-blaze-black/70">
                      Prize Pool
                    </p>
                    <p className="text-2xl font-bold">
                      ${quest.prizePool.toLocaleString()}
                    </p>
                  </div>
                  <div className="border-2 border-blaze-black p-4">
                    <p className="text-sm uppercase tracking-wider text-blaze-black/70">
                      Duration
                    </p>
                    <p className="text-2xl font-bold">
                      {quest.durationMinutes && quest.durationMinutes > 0
                        ? formatDuration(quest.durationMinutes)
                        : "N/A"}
                    </p>
                  </div>
                  <div className="border-2 border-blaze-black p-4">
                    <p className="text-sm uppercase tracking-wider text-blaze-black/70">
                      Players
                    </p>
                    <p className="text-2xl font-bold">{quest.participants}</p>
                  </div>
                </div>
              </div>

              <Separator className="bg-blaze-black" />

              {/* Selected Tokens */}
              <div className="space-y-4">
                <h3 className="font-display text-2xl font-bold">
                  Selected Tokens ({selectedTokens.length}/5)
                </h3>
                <div className="space-y-3">
                  {selectedTokens.map((selection) => (
                    <div
                      key={selection.token.id}
                      className="flex items-center justify-between p-4 border-2 border-blaze-black"
                    >
                      <div className="flex items-center gap-4">
                        {selection.token.logoUrl && (
                          <Image
                            src={selection.token.logoUrl}
                            alt={selection.token.name}
                            width={48}
                            height={48}
                            className="w-12 h-12"
                          />
                        )}
                        {!selection.token.logoUrl && (
                          <div className="w-12 h-12 bg-blaze-black/10 flex items-center justify-center border-2 border-blaze-black">
                            <span className="text-blaze-black/50 font-bold text-xs">
                              {selection.token.symbol.slice(0, 2)}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-lg">
                            {selection.token.symbol}
                          </p>
                          <p className="text-sm text-blaze-black/70">
                            {selection.token.name}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">
                          {selection.quantity.toFixed(4)} tokens
                        </p>
                        <p className="text-sm text-blaze-black/70">
                          ${selection.investmentAmount.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator className="bg-blaze-black" />

              {/* Cost Breakdown */}
              <div className="space-y-4">
                <h3 className="font-display text-2xl font-bold">
                  Cost Breakdown
                </h3>
                <div className="space-y-2 font-mono">
                  <div className="flex justify-between text-lg">
                    <span>Token Investment:</span>
                    <span>${totalInvestment.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg">
                    <span>Quest Entry Fee:</span>
                    <span>${quest.entryFee.toFixed(2)}</span>
                  </div>
                  <Separator className="bg-blaze-black" />
                  <div className="flex justify-between text-2xl font-bold">
                    <span>Total Cost:</span>
                    <span>${totalWithFees.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Warning */}
              <div className="flex items-start gap-3 p-4 border-2 border-yellow-500 bg-yellow-50">
                <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
                <div className="text-sm">
                  <p className="font-bold text-yellow-800">Important:</p>
                  <p className="text-yellow-700">
                    This will join the quest and immediately purchase the
                    selected tokens. Make sure you have sufficient funds in your
                    wallet.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <Button
                  onClick={() => setShowConfirmation(false)}
                  variant="outline"
                  className="flex-1 h-14 rounded-none border-2 border-blaze-black text-xl font-bold uppercase"
                >
                  Modify Selection
                </Button>
                <Button
                  onClick={handleFinalConfirmation}
                  disabled={confirming}
                  className="flex-1 h-14 rounded-none border-2 border-blaze-black bg-blaze-orange text-blaze-black text-xl font-bold uppercase hover:bg-blaze-black hover:text-blaze-white"
                >
                  {confirming ? "Processing..." : "Confirm & Join Quest"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <Button
          variant="outline"
          onClick={onBack}
          className="border-2 border-blaze-black rounded-none h-12 px-4 flex items-center gap-2 font-bold uppercase text-lg hover:bg-blaze-black/5"
        >
          <ArrowLeft /> Back to Quest
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Token Selection */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="rounded-none border-2 border-blaze-black shadow-blaze-shadow">
              <CardHeader className="border-b-2 border-blaze-black">
                <CardTitle className="font-display text-3xl font-bold">
                  Select Tokens
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tokens.map((token) => {
                    const isSelected = selectedTokens.some(
                      (s) => s.token.id === token.id
                    );
                    return (
                      <div
                        key={token.id}
                        className={`p-4 border-2 cursor-pointer transition-colors ${
                          isSelected
                            ? "border-blaze-orange bg-blaze-orange/10"
                            : "border-blaze-black hover:bg-blaze-black/5"
                        }`}
                        onClick={() => !isSelected && addTokenSelection(token)}
                      >
                        <div className="flex items-center gap-3">
                          {token.logoUrl && (
                            <Image
                              src={token.logoUrl}
                              alt={token.name}
                              width={40}
                              height={40}
                              className="w-10 h-10"
                            />
                          )}
                          {!token.logoUrl && (
                            <div className="w-10 h-10 bg-blaze-black/10 flex items-center justify-center border-2 border-blaze-black">
                              <span className="text-blaze-black/50 font-bold text-xs">
                                {token.symbol.slice(0, 2)}
                              </span>
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="font-bold text-lg">{token.symbol}</p>
                            <p className="text-sm text-blaze-black/70">
                              {token.name}
                            </p>
                            <p className="font-mono font-bold">
                              ${token.price.toFixed(2)}
                            </p>
                          </div>
                          {isSelected && (
                            <Check className="w-6 h-6 text-blaze-orange" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Selection Summary */}
          <div className="space-y-6">
            <Card className="rounded-none border-2 border-blaze-black shadow-blaze-shadow">
              <CardHeader className="border-b-2 border-blaze-black">
                <CardTitle className="font-display text-2xl font-bold">
                  Portfolio ({selectedTokens.length}/5)
                </CardTitle>
                <p className="text-sm text-blaze-black/70 font-mono">
                  {selectedTokens.length < 5
                    ? `Select ${5 - selectedTokens.length} more token${
                        5 - selectedTokens.length !== 1 ? "s" : ""
                      }`
                    : "✓ All 5 tokens selected"}
                </p>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {selectedTokens.length === 0 ? (
                  <p className="text-center text-blaze-black/70 py-8">
                    Select 1-5 tokens to build your quest portfolio
                  </p>
                ) : (
                  <>
                    {selectedTokens.map((selection) => (
                      <div
                        key={selection.token.id}
                        className="space-y-3 p-4 border border-blaze-black/20"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {selection.token.logoUrl && (
                              <Image
                                src={selection.token.logoUrl}
                                alt={selection.token.name}
                                width={32}
                                height={32}
                                className="w-8 h-8"
                              />
                            )}
                            {!selection.token.logoUrl && (
                              <div className="w-8 h-8 bg-blaze-black/10 flex items-center justify-center border-2 border-blaze-black">
                                <span className="text-blaze-black/50 font-bold text-xs">
                                  {selection.token.symbol.slice(0, 2)}
                                </span>
                              </div>
                            )}
                            <span className="font-bold">
                              {selection.token.symbol}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              removeTokenSelection(selection.token.id)
                            }
                            className="text-red-600 hover:bg-red-50"
                          >
                            Remove
                          </Button>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-bold">Quantity</Label>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                updateTokenQuantity(
                                  selection.token.id,
                                  selection.quantity - 0.1
                                )
                              }
                              className="h-8 w-8 p-0 rounded-none border-blaze-black"
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <Input
                              type="number"
                              value={selection.quantity.toFixed(4)}
                              onChange={(e) =>
                                updateTokenQuantity(
                                  selection.token.id,
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="text-center h-8 rounded-none border-blaze-black"
                              step="0.0001"
                              min="0"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                updateTokenQuantity(
                                  selection.token.id,
                                  selection.quantity + 0.1
                                )
                              }
                              className="h-8 w-8 p-0 rounded-none border-blaze-black"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-bold">
                            Investment ($)
                          </Label>
                          <Input
                            type="number"
                            value={selection.investmentAmount.toFixed(2)}
                            onChange={(e) =>
                              updateInvestmentAmount(
                                selection.token.id,
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="h-8 rounded-none border-blaze-black"
                            step="0.01"
                            min="0"
                          />
                        </div>
                      </div>
                    ))}

                    <Separator className="bg-blaze-black" />

                    <div className="space-y-2 font-mono">
                      <div className="flex justify-between">
                        <span>Investment:</span>
                        <span>${totalInvestment.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Entry Fee:</span>
                        <span>${quest.entryFee}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total:</span>
                        <span>${totalWithFees.toFixed(2)}</span>
                      </div>
                    </div>

                    <Button
                      onClick={handleConfirmSelection}
                      disabled={selectedTokens.length !== 5}
                      className="w-full h-12 rounded-none border-2 border-blaze-black bg-blaze-orange text-blaze-black font-bold uppercase hover:bg-blaze-black hover:text-blaze-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {selectedTokens.length === 5
                        ? "Review & Confirm"
                        : `Select ${5 - selectedTokens.length} More Token${
                            5 - selectedTokens.length !== 1 ? "s" : ""
                          }`}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
