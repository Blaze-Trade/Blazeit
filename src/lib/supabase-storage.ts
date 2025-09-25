import { STORAGE_BUCKET, supabase } from './supabase';

export interface SupabaseUploadResult {
  success: boolean;
  url?: string;
  filename?: string;
  size?: number;
  error?: string;
}

export class SupabaseStorageService {
  /**
   * Upload an image file to Supabase Storage
   */
  async uploadImage(file: File): Promise<SupabaseUploadResult> {
    try {
      // Validate file parameter
      if (!file) {
        throw new Error('No file provided');
      }

      if (!(file instanceof File)) {
        throw new Error('Invalid file type');
      }

      // Validate file size (10MB max)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        throw new Error('File size must be less than 10MB');
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('File must be an image');
      }

      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileExtension = file.name.split('.').pop() || 'jpg';
      const fileName = `token-images/${timestamp}-${randomString}.${fileExtension}`;


      // Check if supabase is properly initialized
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type
        });

      if (error) {
        console.error('Supabase upload error:', error);

        // Check if it's an RLS policy error
        if (error.message.includes('row-level security policy')) {
          throw new Error(`Upload failed: Row Level Security policy violation. Please make your bucket public or configure RLS policies. See SUPABASE_RLS_FIX.md for instructions.`);
        }

        throw new Error(`Upload failed: ${error.message}`);
      }


      // Get public URL
      const { data: urlData } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(fileName);


      if (!urlData?.publicUrl) {
        throw new Error('Failed to get public URL');
      }


      return {
        success: true,
        url: urlData.publicUrl,
        filename: fileName,
        size: file.size
      };

    } catch (error) {
      console.error('Supabase storage error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Delete an image from Supabase Storage
   */
  async deleteImage(fileName: string): Promise<boolean> {
    try {
      const { error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([fileName]);

      if (error) {
        console.error('Delete error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Delete error:', error);
      return false;
    }
  }

  /**
   * Get a signed URL for private access (if needed)
   */
  async getSignedUrl(fileName: string, expiresIn: number = 3600): Promise<string | null> {
    try {
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .createSignedUrl(fileName, expiresIn);

      if (error) {
        console.error('Signed URL error:', error);
        return null;
      }

      return data?.signedUrl || null;
    } catch (error) {
      console.error('Signed URL error:', error);
      return null;
    }
  }
}

// Export singleton instance
export const supabaseStorageService = new SupabaseStorageService();
