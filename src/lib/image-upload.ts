import { supabaseStorageService } from "./supabase-storage";

export interface ImageUploadResult {
  success: boolean;
  url?: string;
  filename?: string;
  size?: number;
  error?: string;
}

export class ImageUploadService {
  private static instance: ImageUploadService;

  public static getInstance(): ImageUploadService {
    if (!ImageUploadService.instance) {
      ImageUploadService.instance = new ImageUploadService();
    }
    return ImageUploadService.instance;
  }

  async uploadImage(file: File): Promise<ImageUploadResult> {
    try {
      // Use Supabase storage service
      const result = await supabaseStorageService.uploadImage(file);

      if (result.success) {
        return {
          success: true,
          url: result.url,
          filename: result.filename,
          size: result.size,
        };
      } else {
        console.error("Supabase upload failed:", result.error);
        return {
          success: false,
          error: result.error || "Upload failed",
        };
      }
    } catch (error) {
      console.error("Image upload error:", error);

      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  async deleteImage(imageUrl: string): Promise<boolean> {
    try {
      // Extract filename from URL
      const url = new URL(imageUrl);
      const pathParts = url.pathname.split("/");
      const fileName = pathParts[pathParts.length - 1];

      if (!fileName) {
        console.error("Could not extract filename from URL:", imageUrl);
        return false;
      }

      // Use Supabase storage service to delete
      const success = await supabaseStorageService.deleteImage(fileName);

      if (success) {
        console.log("Image deleted successfully:", fileName);
      } else {
        console.error("Failed to delete image:", fileName);
      }

      return success;
    } catch (error) {
      console.error("Image deletion error:", error);
      return false;
    }
  }
}

export const imageUploadService = ImageUploadService.getInstance();
