"use client";

import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { getNetworkName } from "@/lib/constants";
import type { Token } from "@shared/types";
import {
  ExternalLink,
  Globe,
  MessageCircle,
  Send,
  TrendingUp
} from "lucide-react";
import Image from "next/image";
import { useMemo } from "react";

interface TokenInfoModalProps {
  token: Token | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TokenInfoModal({ token, open, onOpenChange }: TokenInfoModalProps) {
  // Calculate bonding curve progress
  const bondingCurveProgress = useMemo(() => {
    if (!token?.marketCap || !token?.marketCapThresholdUsd) {
      return 0;
    }

    const progressPercent = (token.marketCap / token.marketCapThresholdUsd) * 100;
    return Math.min(progressPercent, 100);
  }, [token]);

  if (!token) return null;

  const formatCurrency = (value: number) => {
    if (value >= 1_000_000) {
      return `$${(value / 1_000_000).toFixed(2)}M`;
    }
    if (value >= 1_000) {
      return `$${(value / 1_000).toFixed(2)}K`;
    }
    return `$${value.toFixed(2)}`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Unknown";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-none border-2 border-blaze-black bg-blaze-white max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-4">
            {token.logoUrl && (
              <Image
                src={token.logoUrl}
                alt={token.name}
                width={48}
                height={48}
                className="w-12 h-12 border-2 border-blaze-black"
              />
            )}
            <div className="flex-1">
              <DialogTitle className="font-display text-3xl text-blaze-black">
                {typeof token.symbol === 'string' ? token.symbol : 'Unknown'}
              </DialogTitle>
              <p className="font-mono text-sm text-blaze-black/70">
                {typeof token.name === 'string' ? token.name : 'Unknown Token'}
              </p>
            </div>
            <Badge
              className={`rounded-none border-2 ${
                token.migrationCompleted
                  ? "bg-green-500 border-green-700 text-white"
                  : "bg-blaze-orange border-blaze-black text-blaze-black"
              }`}
            >
              {token.migrationCompleted ? "On DEX" : "On Curve"}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Description */}
          {token.description && typeof token.description === 'string' && (
            <div>
              <h3 className="font-mono font-bold text-sm text-blaze-black mb-2">
                Description
              </h3>
              <p className="font-mono text-sm text-blaze-black/80">
                {String(token.description)}
              </p>
            </div>
          )}

          <Separator className="bg-blaze-black/20" />

          {/* Price Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-mono text-xs text-blaze-black/70 mb-1">Price</p>
              <p className="font-mono font-bold text-xl text-blaze-black">
                ${token.price.toFixed(8)}
              </p>
            </div>
            <div>
              <p className="font-mono text-xs text-blaze-black/70 mb-1">24h Change</p>
              <p
                className={`font-mono font-bold text-xl ${
                  token.change24h >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {token.change24h >= 0 ? "+" : ""}
                {token.change24h.toFixed(2)}%
              </p>
            </div>
            <div>
              <p className="font-mono text-xs text-blaze-black/70 mb-1">Market Cap</p>
              <p className="font-mono font-bold text-xl text-blaze-black">
                {formatCurrency(token.marketCap)}
              </p>
            </div>
            {token.reserveBalance !== undefined && (
              <div>
                <p className="font-mono text-xs text-blaze-black/70 mb-1">Reserve (APT)</p>
                <p className="font-mono font-bold text-xl text-blaze-black">
                  {token.reserveBalance.toFixed(2)}
                </p>
              </div>
            )}
          </div>

          <Separator className="bg-blaze-black/20" />

          {/* Bonding Curve Progress (if not migrated) */}
          {!token.migrationCompleted && token.bondingCurveActive && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-mono font-bold text-sm text-blaze-black">
                  Bonding Curve Progress
                </h3>
                <span className="font-mono text-sm font-bold text-blaze-orange">
                  {bondingCurveProgress.toFixed(1)}%
                </span>
              </div>
              <Progress
                value={bondingCurveProgress}
                className="h-3 rounded-none border-2 border-blaze-black"
              />
              <p className="font-mono text-xs text-blaze-black/70 mt-2">
                Target: ${formatCurrency(token.marketCapThresholdUsd || 75000)} market cap
              </p>
              <p className="font-mono text-xs text-blaze-black/60 mt-1">
                When reached, automatically migrates to Hyperion DEX
              </p>
            </div>
          )}

          {/* Migration Status */}
          {token.migrationCompleted && (
            <div className="bg-green-500/10 border-2 border-green-500 p-4 rounded-none">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <h3 className="font-mono font-bold text-sm text-green-700">
                  Migrated to Hyperion DEX
                </h3>
              </div>
              <p className="font-mono text-xs text-green-700/80">
                This token has graduated from the bonding curve and is now trading on
                Hyperion DEX with full liquidity.
              </p>
              {token.migrationTimestamp && typeof token.migrationTimestamp === 'string' && (
                <p className="font-mono text-xs text-green-700/60 mt-2">
                  Migrated on {formatDate(String(token.migrationTimestamp))}
                </p>
              )}
              {token.hyperionPoolAddress && typeof token.hyperionPoolAddress === 'string' && (
                <a
                  href={`https://app.hyperion.xyz/pool/${String(token.hyperionPoolAddress)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-mono text-xs text-green-700 hover:text-green-800 mt-2 underline"
                >
                  View on Hyperion DEX
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          )}

          {/* Bonding Curve Details */}
          {!token.migrationCompleted && (
            <>
              <Separator className="bg-blaze-black/20" />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-mono text-xs text-blaze-black/70 mb-1">
                    Reserve Ratio
                  </p>
                  <p className="font-mono font-bold text-lg text-blaze-black">
                    {token.reserveRatio || 50}%
                  </p>
                </div>
                <div>
                  <p className="font-mono text-xs text-blaze-black/70 mb-1">
                    Initial Reserve
                  </p>
                  <p className="font-mono font-bold text-lg text-blaze-black">
                    {(token.initialReserveApt || 0.1).toFixed(2)} APT
                  </p>
                </div>
              </div>
            </>
          )}

          {/* Social Links */}
          {token.socialLinks &&
           typeof token.socialLinks === 'object' &&
           !Array.isArray(token.socialLinks) &&
           !(token.socialLinks as any).vec &&
           Object.keys(token.socialLinks).length > 0 && (
            <>
              <Separator className="bg-blaze-black/20" />
              <div>
                <h3 className="font-mono font-bold text-sm text-blaze-black mb-3">
                  Links
                </h3>
                <div className="flex flex-wrap gap-2">
                  {token.socialLinks.website && typeof token.socialLinks.website === 'string' && (
                    <a
                      href={token.socialLinks.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-2 border-2 border-blaze-black bg-blaze-white hover:bg-blaze-orange/20 font-mono text-xs"
                    >
                      <Globe className="w-4 h-4" />
                      Website
                    </a>
                  )}
                  {token.socialLinks.twitter && typeof token.socialLinks.twitter === 'string' && (
                    <a
                      href={`https://twitter.com/${String(token.socialLinks.twitter).replace("@", "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-2 border-2 border-blaze-black bg-blaze-white hover:bg-blaze-orange/20 font-mono text-xs"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                      Twitter
                    </a>
                  )}
                  {token.socialLinks.telegram && typeof token.socialLinks.telegram === 'string' && (
                    <a
                      href={String(token.socialLinks.telegram)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-2 border-2 border-blaze-black bg-blaze-white hover:bg-blaze-orange/20 font-mono text-xs"
                    >
                      <Send className="w-4 h-4" />
                      Telegram
                    </a>
                  )}
                  {token.socialLinks.discord && typeof token.socialLinks.discord === 'string' && (
                    <a
                      href={String(token.socialLinks.discord)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-2 border-2 border-blaze-black bg-blaze-white hover:bg-blaze-orange/20 font-mono text-xs"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Discord
                    </a>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Creator & Contract Info */}
          <Separator className="bg-blaze-black/20" />
          <div className="space-y-2">
            {token.address && typeof token.address === 'string' && (
              <div>
                <p className="font-mono text-xs text-blaze-black/70 mb-1">
                  Contract Address
                </p>
                <a
                  href={`https://explorer.aptoslabs.com/account/${String(token.address)}?network=${getNetworkName()}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs text-blaze-black hover:text-blaze-orange underline inline-flex items-center gap-1"
                >
                  {String(token.address).slice(0, 10)}...{String(token.address).slice(-8)}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
            {token.createdAt && typeof token.createdAt === 'string' && (
              <div>
                <p className="font-mono text-xs text-blaze-black/70 mb-1">Created</p>
                <p className="font-mono text-xs text-blaze-black">
                  {formatDate(String(token.createdAt))}
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

