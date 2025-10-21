"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTokenCreation } from "@/hooks/useTokenCreation";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { ArrowLeft, Coins, Upload } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";

export function TokenCreationPage() {
  const router = useRouter();
  const { account, connected } = useWallet();
  const { createToken, uploadImage, isCreating } = useTokenCreation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // V2 Form state - Bancor bonding curve with automatic DEX migration
  const [formData, setFormData] = useState({
    // Basic Info
    symbol: "",
    name: "",
    description: "",
    image: null as File | null,
    imageUrl: null as string | null,

    // Token Settings
    decimals: 8, // Token decimals (0-8), default 8
    maxSupply: undefined as number | undefined, // Optional max supply (undefined = unlimited)

    // V2 Bonding Curve Parameters
    reserveRatio: 50, // Bancor reserve ratio (1-100%), default 50%
    initialReserveApt: 0.1, // Initial APT to bootstrap curve, default 0.1 APT
    marketCapThreshold: 75000, // Market cap threshold for DEX migration (USD), default $75k

    // Social Links
    website: "",
    twitter: "",
    telegram: "",
    discord: "",
  });

  // Character limits
  const symbolMaxLength = 10; // V2 allows up to 10 chars
  const descriptionMaxLength = 500;

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => {
      // Handle numeric fields
      const numericFields = [
        "decimals",
        "maxSupply",
        "reserveRatio",
        "initialReserveApt",
        "marketCapThreshold",
      ];
      if (numericFields.includes(field)) {
        const numValue = typeof value === "string" ? parseFloat(value) : value;
        return { ...prev, [field]: numValue || 0 };
      }
      return { ...prev, [field]: value };
    });
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    // Check if file exists
    if (!file) {
      toast.error("No file selected");
      return;
    }

    await handleFileValidationAndUpload(file);
  };

  const handleFileValidationAndUpload = async (file: File) => {
    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (PNG, JPG)");
      return;
    }

    // Create immediate preview URL for the file
    const previewUrl = URL.createObjectURL(file);

    // Update form data immediately with file and preview URL
    setFormData((prev) => ({ ...prev, image: file, imageUrl: previewUrl }));

    // Upload image to R2
    setIsUploadingImage(true);
    try {
      const toastId = toast.loading("Uploading image...");
      const imageUrl = await uploadImage(file);
      toast.success("Image uploaded successfully!", { id: toastId });

      // Update form data with the server URL (replacing preview URL)
      setFormData((prev) => ({ ...prev, image: file, imageUrl }));

      // Clean up the preview URL after successful upload
      URL.revokeObjectURL(previewUrl);
    } catch (error) {
      console.error("Image upload error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      toast.error(`Failed to upload image: ${errorMessage}`);

      // Clean up the preview URL on error
      URL.revokeObjectURL(previewUrl);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isUploadingImage) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (isUploadingImage) {
      return;
    }

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      await handleFileValidationAndUpload(file);
    }
  };

  const handleCreateToken = async () => {
    if (!connected || !account) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!formData.symbol || !formData.name || !formData.description) {
      toast.error("Please fill in all required fields");
      return;
    }

    const result = await createToken({
      name: formData.name,
      symbol: formData.symbol,
      description: formData.description,
      image: formData.image || undefined,
      imageUrl: formData.imageUrl || undefined,
      decimals: formData.decimals,
      maxSupply: formData.maxSupply,

      // V2 Bonding Curve Parameters
      reserveRatio: formData.reserveRatio,
      initialReserveApt: formData.initialReserveApt,
      marketCapThreshold: formData.marketCapThreshold,

      // Social Links
      website: formData.website,
      twitter: formData.twitter,
      telegram: formData.telegram,
      discord: formData.discord,
    });

    if (result.success) {
      router.push("/");
    }
  };

  const formatCurrency = (value: number) => {
    if (value >= 1_000_000) {
      return `$${(value / 1_000_000).toFixed(2)}M`;
    }
    if (value >= 1_000) {
      return `$${(value / 1_000).toFixed(2)}K`;
    }
    return `$${value.toFixed(2)}`;
  };

  return (
    <div className="min-h-screen bg-blaze-white p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            onClick={() => router.push("/")}
            className="rounded-none border-2 border-blaze-black bg-blaze-white text-blaze-black hover:bg-blaze-orange hover:text-blaze-black"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-blaze-black">
            Create Token
          </h1>
        </div>

        {/* Main Form */}
        <Card className="rounded-none border-2 border-blaze-black bg-blaze-white">
          <CardHeader>
            <CardTitle className="font-display text-2xl font-bold text-blaze-black flex items-center gap-2">
              <Coins className="w-6 h-6" />
              Token Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Token Symbol */}
            <div className="space-y-2">
              <Label
                htmlFor="symbol"
                className="text-lg font-bold text-blaze-black"
              >
                Token Symbol
              </Label>
              <Input
                id="symbol"
                value={formData.symbol}
                onChange={(e) =>
                  handleInputChange("symbol", e.target.value.toUpperCase())
                }
                placeholder="DOGE"
                maxLength={symbolMaxLength}
                className="rounded-none border-2 border-blaze-black bg-blaze-white text-blaze-black text-lg font-mono"
              />
              <div className="text-sm text-blaze-black/70 font-mono">
                {formData.symbol.length}/{symbolMaxLength}
              </div>
            </div>

            {/* Token Name */}
            <div className="space-y-2">
              <Label
                htmlFor="name"
                className="text-lg font-bold text-blaze-black"
              >
                Token Name
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Dogecoin"
                className="rounded-none border-2 border-blaze-black bg-blaze-white text-blaze-black text-lg"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label
                htmlFor="description"
                className="text-lg font-bold text-blaze-black"
              >
                Description
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                placeholder="Describe your token..."
                maxLength={descriptionMaxLength}
                rows={4}
                className="rounded-none border-2 border-blaze-black bg-blaze-white text-blaze-black text-lg resize-none"
              />
              <div className="text-sm text-blaze-black/70 font-mono">
                {formData.description.length} characters
              </div>
            </div>

            {/* Social Links Section */}
            <div className="space-y-4 pt-4 border-t-2 border-blaze-black/10">
              <h3 className="font-mono font-bold text-lg text-blaze-black">
                Social Links{" "}
                <span className="text-sm text-blaze-black/50 font-normal">
                  (Optional)
                </span>
              </h3>

              <div className="space-y-2">
                <Label
                  htmlFor="website"
                  className="text-sm font-bold text-blaze-black"
                >
                  Website
                </Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => handleInputChange("website", e.target.value)}
                  placeholder="https://yourproject.com"
                  className="rounded-none border-2 border-blaze-black bg-blaze-white text-blaze-black"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="twitter"
                  className="text-sm font-bold text-blaze-black"
                >
                  Twitter
                </Label>
                <Input
                  id="twitter"
                  value={formData.twitter}
                  onChange={(e) => handleInputChange("twitter", e.target.value)}
                  placeholder="@yourtoken"
                  className="rounded-none border-2 border-blaze-black bg-blaze-white text-blaze-black"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="telegram"
                  className="text-sm font-bold text-blaze-black"
                >
                  Telegram
                </Label>
                <Input
                  id="telegram"
                  value={formData.telegram}
                  onChange={(e) =>
                    handleInputChange("telegram", e.target.value)
                  }
                  placeholder="t.me/yourtoken"
                  className="rounded-none border-2 border-blaze-black bg-blaze-white text-blaze-black"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="discord"
                  className="text-sm font-bold text-blaze-black"
                >
                  Discord
                </Label>
                <Input
                  id="discord"
                  value={formData.discord}
                  onChange={(e) => handleInputChange("discord", e.target.value)}
                  placeholder="discord.gg/yourtoken"
                  className="rounded-none border-2 border-blaze-black bg-blaze-white text-blaze-black"
                />
              </div>
            </div>

            {/* Bonding Curve Settings */}
            <div className="space-y-4 pt-4 border-t-2 border-blaze-black/10">
              <h3 className="font-mono font-bold text-lg text-blaze-black">
                Bonding Curve Settings
              </h3>

              {/* Reserve Ratio */}
              <div className="space-y-2">
                <Label
                  htmlFor="reserveRatio"
                  className="text-sm font-bold text-blaze-black"
                >
                  Reserve Ratio
                </Label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    id="reserveRatio"
                    min="1"
                    max="100"
                    value={formData.reserveRatio}
                    onChange={(e) =>
                      handleInputChange(
                        "reserveRatio",
                        parseInt(e.target.value)
                      )
                    }
                    className="flex-1 h-2 bg-blaze-orange/20 rounded-none border-2 border-blaze-black appearance-none cursor-pointer"
                  />
                  <span className="font-mono font-bold text-xl text-blaze-black w-16 text-right">
                    {formData.reserveRatio}%
                  </span>
                </div>
                <p className="text-xs text-blaze-black/50 font-mono">
                  Higher ratio = more stable price. 50% recommended for balanced
                  growth.
                </p>
              </div>

              {/* Initial Reserve */}
              <div className="space-y-2">
                <Label
                  htmlFor="initialReserveApt"
                  className="text-sm font-bold text-blaze-black"
                >
                  Initial Reserve (APT)
                </Label>
                <Input
                  id="initialReserveApt"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.initialReserveApt}
                  onChange={(e) =>
                    handleInputChange("initialReserveApt", e.target.value)
                  }
                  placeholder="0.1"
                  className="rounded-none border-2 border-blaze-black bg-blaze-white text-blaze-black text-lg"
                />
                <p className="text-xs text-blaze-black/50 font-mono">
                  APT you deposit to bootstrap the bonding curve. Min 0.01 APT.
                </p>
              </div>

              {/* Market Cap Threshold */}
              <div className="space-y-2">
                <Label
                  htmlFor="marketCapThreshold"
                  className="text-sm font-bold text-blaze-black"
                >
                  DEX Migration Threshold (USD)
                </Label>
                <Input
                  id="marketCapThreshold"
                  type="number"
                  step="1000"
                  min="1000"
                  value={formData.marketCapThreshold}
                  onChange={(e) =>
                    handleInputChange("marketCapThreshold", e.target.value)
                  }
                  placeholder="75000"
                  className="rounded-none border-2 border-blaze-black bg-blaze-white text-blaze-black text-lg"
                />
                <p className="text-xs text-blaze-black/50 font-mono">
                  When market cap reaches this value, token automatically
                  migrates to Hyperion DEX. Default: $75,000
                </p>
              </div>
            </div>

            {/* Advanced Options Toggle */}
            <div className="pt-4 border-t-2 border-blaze-black/10">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full rounded-none border-2 border-blaze-black/20 bg-blaze-white text-blaze-black hover:bg-blaze-black/5"
              >
                {showAdvanced ? "Hide" : "Show"} Advanced Token Settings
              </Button>
            </div>

            {/* Advanced Token Settings - Collapsible */}
            {showAdvanced && (
              <div className="space-y-6 pt-4">
                <p className="text-sm text-blaze-black/70 font-mono">
                  Advanced token settings
                </p>

                {/* Decimals */}
                <div className="space-y-2">
                  <Label
                    htmlFor="decimals"
                    className="text-sm font-bold text-blaze-black"
                  >
                    Token Decimals
                  </Label>
                  <Input
                    id="decimals"
                    type="number"
                    value={formData.decimals}
                    onChange={(e) =>
                      handleInputChange("decimals", e.target.value)
                    }
                    placeholder="8"
                    min="0"
                    max="8"
                    className="rounded-none border-2 border-blaze-black bg-blaze-white text-blaze-black text-lg"
                  />
                  <p className="text-xs text-blaze-black/50 font-mono">
                    0-8. Default is 8 (standard for Aptos FA). 0 = whole numbers
                    only.
                  </p>
                </div>

                {/* Max Supply */}
                <div className="space-y-2">
                  <Label
                    htmlFor="maxSupply"
                    className="text-sm font-bold text-blaze-black"
                  >
                    Max Supply{" "}
                    <span className="text-xs text-blaze-black/50 font-normal">
                      (Optional)
                    </span>
                  </Label>
                  <Input
                    id="maxSupply"
                    type="number"
                    value={formData.maxSupply || ""}
                    onChange={(e) =>
                      handleInputChange("maxSupply", e.target.value)
                    }
                    placeholder="Leave empty for unlimited"
                    className="rounded-none border-2 border-blaze-black bg-blaze-white text-blaze-black text-lg"
                  />
                  <p className="text-xs text-blaze-black/50 font-mono">
                    Maximum total supply. Leave empty for unlimited supply.
                  </p>
                </div>
              </div>
            )}

            {/* Initial Reserve Summary */}
            <div className="space-y-2 pt-4 border-t-2 border-blaze-black/10">
              <Label className="text-lg font-bold text-blaze-black">
                You Will Pay
              </Label>
              <div className="p-4 rounded-none border-2 border-blaze-black bg-blaze-orange/20 text-blaze-black font-mono text-lg">
                {formData.initialReserveApt.toFixed(2)} APT
              </div>
              <p className="text-xs text-blaze-black/50 font-mono">
                This APT bootstraps your token&apos;s bonding curve. When the
                token reaches ${formatCurrency(formData.marketCapThreshold)}{" "}
                market cap, all collected funds migrate to Hyperion DEX as
                liquidity.
              </p>
            </div>

            {/* Token Image Upload */}
            <div className="space-y-2">
              <Label className="text-lg font-bold text-blaze-black">
                Token Image
              </Label>
              <div
                onClick={() =>
                  !isUploadingImage && fileInputRef.current?.click()
                }
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className={`border-2 border-dashed border-blaze-black transition-colors p-8 text-center rounded-none ${
                  isUploadingImage
                    ? "cursor-not-allowed opacity-50 bg-blaze-white"
                    : isDragging
                    ? "cursor-pointer bg-blaze-orange/40 border-blaze-orange"
                    : "cursor-pointer bg-blaze-white hover:bg-blaze-orange/20"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={isUploadingImage}
                />
                <Upload className="w-12 h-12 mx-auto mb-4 text-blaze-black" />
                <p className="text-blaze-black font-mono text-lg mb-2">
                  {isUploadingImage
                    ? "Uploading..."
                    : isDragging
                    ? "Drop image here"
                    : "Drop image or click to browse"}
                </p>
                <p className="text-blaze-black/70 font-mono text-sm">
                  PNG, JPG up to 10MB
                </p>
                {isUploadingImage && (
                  <div className="mt-4">
                    <div className="w-full bg-blaze-orange/20 rounded-none border-2 border-blaze-black">
                      <div className="h-2 bg-blaze-orange animate-pulse"></div>
                    </div>
                    <p className="text-blaze-black font-mono text-sm mt-2">
                      Uploading image...
                    </p>
                  </div>
                )}

                {formData.image && !isUploadingImage && (
                  <div className="mt-4">
                    <p className="text-blaze-black font-mono text-sm mb-2">
                      Selected: {formData.image.name}
                    </p>
                    {formData.imageUrl && (
                      <div className="mt-2">
                        <Image
                          src={formData.imageUrl}
                          alt="Token preview"
                          width={128}
                          height={128}
                          className="w-32 h-32 object-cover border-2 border-blaze-black"
                          onLoad={() =>
                            console.log(
                              "Image loaded successfully:",
                              formData.imageUrl
                            )
                          }
                          onError={(e) =>
                            console.error(
                              "Image failed to load:",
                              formData.imageUrl,
                              e
                            )
                          }
                        />
                      </div>
                    )}
                    {!formData.imageUrl && (
                      <p className="text-red-600 font-mono text-sm mt-2">
                        No image URL available
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Create Button */}
            <Button
              onClick={handleCreateToken}
              disabled={!connected || isCreating}
              className="w-full h-14 rounded-none border-2 border-blaze-black bg-blaze-orange text-blaze-black text-xl font-bold uppercase tracking-wider hover:bg-blaze-black hover:text-blaze-white active:translate-y-px active:translate-x-px disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isCreating ? "Creating..." : "Create Coin"}
            </Button>

            {!connected && (
              <p className="text-center text-blaze-black/70 font-mono">
                Please connect your wallet to create a token
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
