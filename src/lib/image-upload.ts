export interface ImageUploadResult {
  success: boolean;
  url?: string;
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
      // Create FormData for the upload
      const formData = new FormData();
      formData.append('image', file);
      
      // Generate a unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileExtension = file.name.split('.').pop() || 'jpg';
      const fileName = `token-images/${timestamp}-${randomString}.${fileExtension}`;
      
      // Upload to our worker endpoint
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();
      
      return {
        success: true,
        url: result.url,
      };
    } catch (error) {
      console.error('Image upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  }

  async deleteImage(imageUrl: string): Promise<boolean> {
    try {
      // Extract the key from the URL
      const url = new URL(imageUrl);
      const key = url.pathname.substring(1); // Remove leading slash
      
      const response = await fetch('/api/delete-image', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key }),
      });

      return response.ok;
    } catch (error) {
      console.error('Image deletion error:', error);
      return false;
    }
  }
}

export const imageUploadService = ImageUploadService.getInstance();
