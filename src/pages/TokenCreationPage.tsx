import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTokenCreation } from "@/hooks/useTokenCreation";
import { usePortfolioStore } from "@/stores/portfolioStore";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { ArrowLeft, Coins, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export function TokenCreationPage() {
  const navigate = useNavigate();
  const { account, connected } = useWallet();
  const { isConnected } = usePortfolioStore();
  const { createToken, uploadImage, isCreating } = useTokenCreation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Form state - optimized for smart contract's hardcoded cubic bonding curve
  // IMPORTANT: Contract uses cubic formula (amount³) which overflows with large amounts
  // Solution: Use ZERO DECIMALS - tokens are whole numbers only
  const [formData, setFormData] = useState({
    symbol: "",
    name: "",
    description: "",
    image: null as File | null,
    imageUrl: null as string | null,
    decimals: 0, // Token decimals (0-8). 0 = whole numbers (recommended for cubic curve)
    maxSupply: 1000000, // 1 million tokens (0 decimals = whole numbers only)
    projectURL: "",
    targetSupply: 100000, // 100K tokens (cubic curve will reach this slowly)
    virtualLiquidity: 1000000, // 1M APT (enough liquidity for reasonable prices)
    curveExponent: 2, // Stored but not used (contract hardcodes cubic regardless)
    maxMintPerAccount: 0, // NO LIMIT (0 = unlimited)
  });

  // Character limits
  const symbolMaxLength = 6;
  const descriptionMaxLength = 500;

  // Removed quality calculation and gating

  // Creation fee in APT (example value)
  const creationFee = 0.0000000000000001;

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => {
      // Handle numeric fields
      const numericFields = [
        "maxSupply",
        "targetSupply",
        "virtualLiquidity",
        "curveExponent",
        "maxMintPerAccount",
      ];
      if (numericFields.includes(field)) {
        return { ...prev, [field]: parseFloat(value) || 0 };
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
      decimals: formData.decimals, // Pass user-specified decimals
      maxSupply: formData.maxSupply,
      projectURL: formData.projectURL,
      targetSupply: formData.targetSupply,
      virtualLiquidity: formData.virtualLiquidity,
      curveExponent: formData.curveExponent,
      maxMintPerAccount: formData.maxMintPerAccount,
    });

    if (result.success) {
      navigate("/");
    }
  };

  const getShortAddress = (address: string) =>
    `${address.slice(0, 6)}...${address.slice(-4)}`;

  return (
    <div className="min-h-screen bg-blaze-white p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            onClick={() => navigate("/")}
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

            {/* Project URL */}
            <div className="space-y-2">
              <Label
                htmlFor="projectURL"
                className="text-lg font-bold text-blaze-black"
              >
                Project URL{" "}
                <span className="text-sm text-blaze-black/50 font-normal">
                  (Optional)
                </span>
              </Label>
              <Input
                id="projectURL"
                value={formData.projectURL}
                onChange={(e) =>
                  handleInputChange("projectURL", e.target.value)
                }
                placeholder="https://yourproject.com"
                className="rounded-none border-2 border-blaze-black bg-blaze-white text-blaze-black text-lg"
              />
            </div>

            {/* Advanced Options Toggle */}
            <div className="pt-4 border-t-2 border-blaze-black/10">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full rounded-none border-2 border-blaze-black/20 bg-blaze-white text-blaze-black hover:bg-blaze-black/5"
              >
                {showAdvanced ? "Hide" : "Show"} Advanced Options
              </Button>
              {!showAdvanced && (
                <p className="text-sm text-blaze-black/50 mt-2 font-mono text-center">
                  Using smart defaults: {formData.decimals} decimals, 1M max
                  supply, 100K target, 1M APT liquidity
                  {formData.decimals === 0 && " (safest - whole numbers only)"}
                  {formData.decimals > 2 && " ⚠️ High overflow risk!"}
                </p>
              )}
            </div>

            {/* Advanced Options - Collapsible */}
            {showAdvanced && (
              <div className="space-y-6 pt-4 border-t-2 border-blaze-black/10">
                <p className="text-sm text-blaze-black/70 font-mono">
                  ⚠️ Advanced options - customize with caution
                </p>

                {/* Decimals */}
                <div className="space-y-2">
                  <Label
                    htmlFor="decimals"
                    className="text-lg font-bold text-blaze-black"
                  >
                    Token Decimals ⚠️
                  </Label>
                  <Input
                    id="decimals"
                    type="number"
                    value={formData.decimals}
                    onChange={(e) =>
                      handleInputChange("decimals", e.target.value)
                    }
                    placeholder="0"
                    min="0"
                    max="8"
                    className="rounded-none border-2 border-blaze-black bg-blaze-white text-blaze-black text-lg"
                  />
                  <p className="text-xs text-blaze-black/50 font-mono">
                    0-8. CRITICAL: 0 = whole numbers (safest, ~10K max buy). 2 =
                    two decimals (~100 max buy). 4+ = high overflow risk! Higher
                    decimals = exponentially smaller safe buy amounts due to
                    cubic curve.
                  </p>
                  {formData.decimals > 2 && (
                    <div className="bg-red-500/10 border-2 border-red-500 p-3 rounded-none">
                      <p className="text-sm font-bold text-red-600 font-mono">
                        ⚠️ WARNING: {formData.decimals} decimals will likely
                        cause overflow!
                      </p>
                      <p className="text-xs text-red-600 font-mono mt-1">
                        Safe max buy ≈{" "}
                        {Math.floor(
                          10000 / Math.pow(10, formData.decimals - 0)
                        )}{" "}
                        tokens
                      </p>
                    </div>
                  )}
                </div>

                {/* Max Supply */}
                <div className="space-y-2">
                  <Label
                    htmlFor="maxSupply"
                    className="text-lg font-bold text-blaze-black"
                  >
                    Max Supply
                  </Label>
                  <Input
                    id="maxSupply"
                    type="number"
                    value={formData.maxSupply}
                    onChange={(e) =>
                      handleInputChange("maxSupply", e.target.value)
                    }
                    placeholder="1000000"
                    className="rounded-none border-2 border-blaze-black bg-blaze-white text-blaze-black text-lg"
                  />
                  <p className="text-xs text-blaze-black/50 font-mono">
                    Human-readable. 1000000 = 1 million tokens. With 0 decimals,
                    tokens are whole numbers only. Max safe buy: ~10K tokens at
                    once.
                  </p>
                </div>

                {/* Target Supply */}
                <div className="space-y-2">
                  <Label
                    htmlFor="targetSupply"
                    className="text-lg font-bold text-blaze-black"
                  >
                    Target Supply
                  </Label>
                  <Input
                    id="targetSupply"
                    type="number"
                    value={formData.targetSupply}
                    onChange={(e) =>
                      handleInputChange("targetSupply", e.target.value)
                    }
                    placeholder="100000"
                    className="rounded-none border-2 border-blaze-black bg-blaze-white text-blaze-black text-lg"
                  />
                  <p className="text-xs text-blaze-black/50 font-mono">
                    Human-readable. 100000 = 100K tokens. Bonding curve
                    deactivates when this supply is reached.
                  </p>
                </div>

                {/* Virtual Liquidity */}
                <div className="space-y-2">
                  <Label
                    htmlFor="virtualLiquidity"
                    className="text-lg font-bold text-blaze-black"
                  >
                    Virtual Liquidity (in APT)
                  </Label>
                  <Input
                    id="virtualLiquidity"
                    type="number"
                    value={formData.virtualLiquidity}
                    onChange={(e) =>
                      handleInputChange("virtualLiquidity", e.target.value)
                    }
                    placeholder="1000000"
                    className="rounded-none border-2 border-blaze-black bg-blaze-white text-blaze-black text-lg"
                  />
                  <p className="text-xs text-blaze-black/50 font-mono">
                    In APT. 1000000 = 1M APT. Controls token pricing - higher
                    liquidity = lower prices. Works with 2 decimal tokens.
                  </p>
                </div>

                {/* Curve Exponent */}
                <div className="space-y-2">
                  <Label
                    htmlFor="curveExponent"
                    className="text-lg font-bold text-blaze-black"
                  >
                    Curve Exponent
                  </Label>
                  <Input
                    id="curveExponent"
                    type="number"
                    value={formData.curveExponent}
                    onChange={(e) =>
                      handleInputChange("curveExponent", e.target.value)
                    }
                    placeholder="1"
                    className="rounded-none border-2 border-blaze-black bg-blaze-white text-blaze-black text-lg"
                  />
                  <p className="text-xs text-blaze-black/50 font-mono">
                    Stored but NOT USED. Contract hardcodes cubic formula
                    (amount³). This parameter doesn't affect pricing.
                  </p>
                </div>

                {/* Max Mint Per Account */}
                <div className="space-y-2">
                  <Label
                    htmlFor="maxMintPerAccount"
                    className="text-lg font-bold text-blaze-black"
                  >
                    Max Mint Per Account
                  </Label>
                  <Input
                    id="maxMintPerAccount"
                    type="number"
                    value={formData.maxMintPerAccount}
                    onChange={(e) =>
                      handleInputChange("maxMintPerAccount", e.target.value)
                    }
                    placeholder="0"
                    className="rounded-none border-2 border-blaze-black bg-blaze-white text-blaze-black text-lg"
                  />
                  <p className="text-xs text-blaze-black/50 font-mono">
                    <strong>0 = NO LIMIT</strong> (recommended). Set a number to
                    limit per wallet.
                  </p>
                </div>
              </div>
            )}

            {/* Quality section removed */}

            {/* Creation Fee */}
            <div className="space-y-2">
              <Label className="text-lg font-bold text-blaze-black">
                Creation Fee (APT)
              </Label>
              <div className="p-4 rounded-none border-2 border-blaze-black bg-blaze-orange/20 text-blaze-black font-mono text-lg">
                $ {creationFee.toFixed(16)}
              </div>
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
                        <img
                          src={formData.imageUrl}
                          alt="Token preview"
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

            {/* Connected Wallet Info */}
            {connected && account && (
              <div className="space-y-2">
                <Label className="text-lg font-bold text-blaze-black">
                  Connected Wallet:
                </Label>
                <div className="p-4 rounded-none border-2 border-blaze-black bg-blaze-white text-blaze-black font-mono text-lg">
                  {getShortAddress(account.address.toString())}
                </div>
              </div>
            )}

            {/* Creation Fee Summary */}
            <div className="space-y-2">
              <Label className="text-lg font-bold text-blaze-black">
                Creation Fee:
              </Label>
              <div className="p-4 rounded-none border-2 border-blaze-black bg-blaze-white text-blaze-black font-mono text-lg">
                {creationFee.toFixed(16)} APT
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
