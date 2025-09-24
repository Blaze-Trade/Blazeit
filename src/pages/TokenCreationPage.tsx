import { useState, useRef } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { usePortfolioStore } from "@/stores/portfolioStore";
import { useTokenCreation } from "@/hooks/useTokenCreation";
import { ArrowLeft, Upload, Coins } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export function TokenCreationPage() {
  const navigate = useNavigate();
  const { account, connected } = useWallet();
  const { isConnected } = usePortfolioStore();
  const { createToken, uploadImage, isCreating } = useTokenCreation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    symbol: "",
    name: "",
    description: "",
    image: null as File | null,
    imageUrl: null as string | null,
  });

  // Character limits
  const symbolMaxLength = 6;
  const descriptionMaxLength = 500;

  // Calculate quality percentage based on form completion
  const calculateQuality = () => {
    let score = 0;
    if (formData.symbol.length >= 2) score += 25;
    if (formData.name.length >= 3) score += 25;
    if (formData.description.length >= 10) score += 25;
    if (formData.imageUrl) score += 25;
    return score;
  };

  const quality = calculateQuality();

  // Creation fee in APT (example value)
  const creationFee = 0.0000000000000001;

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error("Please upload an image file (PNG, JPG)");
        return;
      }
      
      // Upload image to R2
      try {
        const toastId = toast.loading("Uploading image...");
        const imageUrl = await uploadImage(file);
        toast.success("Image uploaded successfully!", { id: toastId });
        setFormData(prev => ({ ...prev, image: file, imageUrl }));
      } catch (error) {
        toast.error("Failed to upload image. Please try again.");
        console.error("Image upload error:", error);
      }
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
      symbol: formData.symbol,
      name: formData.name,
      description: formData.description,
      image: formData.image || undefined,
      imageUrl: formData.imageUrl || undefined,
    });

    if (result.success) {
      navigate("/");
    }
  };

  const getShortAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`;

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
              <Label htmlFor="symbol" className="text-lg font-bold text-blaze-black">
                Token Symbol
              </Label>
              <Input
                id="symbol"
                value={formData.symbol}
                onChange={(e) => handleInputChange("symbol", e.target.value.toUpperCase())}
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
              <Label htmlFor="name" className="text-lg font-bold text-blaze-black">
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
              <Label htmlFor="description" className="text-lg font-bold text-blaze-black">
                Description
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Describe your token..."
                maxLength={descriptionMaxLength}
                rows={4}
                className="rounded-none border-2 border-blaze-black bg-blaze-white text-blaze-black text-lg resize-none"
              />
              <div className="text-sm text-blaze-black/70 font-mono">
                {formData.description.length} characters
              </div>
            </div>

            {/* Quality Progress */}
            <div className="space-y-2">
              <Label className="text-lg font-bold text-blaze-black">
                Quality:
              </Label>
              <div className="space-y-2">
                <Progress value={quality} className="h-3 bg-blaze-black/20" />
                <div className="text-sm text-blaze-black/70 font-mono">
                  {quality}%
                </div>
              </div>
            </div>

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
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-blaze-black bg-blaze-white hover:bg-blaze-orange/20 transition-colors cursor-pointer p-8 text-center rounded-none"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Upload className="w-12 h-12 mx-auto mb-4 text-blaze-black" />
                <p className="text-blaze-black font-mono text-lg mb-2">
                  Drop image or click to browse
                </p>
                <p className="text-blaze-black/70 font-mono text-sm">
                  PNG, JPG up to 10MB
                </p>
                {formData.image && (
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
                        />
                      </div>
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
              disabled={!connected || isCreating || quality < 100}
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
