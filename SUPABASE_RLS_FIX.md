# Supabase RLS (Row Level Security) Fix

## 🚨 Current Issue
**Error**: `new row violates row-level security policy`

This happens because Supabase Storage has Row Level Security enabled by default, which blocks uploads unless you have proper policies set up.

## 🔧 Quick Fix Options

### Option 1: Disable RLS for Storage (Recommended for Development)

1. Go to your Supabase dashboard
2. Navigate to **Storage** → **Policies**
3. Find your `token-images` bucket
4. Click **Disable RLS** (temporarily for development)

### Option 2: Create Proper RLS Policies

1. Go to **Storage** → **Policies**
2. Click **New Policy** for `token-images` bucket
3. Use this policy:

```sql
-- Allow public uploads
CREATE POLICY "Allow public uploads" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'token-images');

-- Allow public access to files
CREATE POLICY "Allow public access" ON storage.objects
FOR SELECT USING (bucket_id = 'token-images');
```

### Option 3: Make Bucket Public (Easiest)

1. Go to **Storage** → **Buckets**
2. Find your `token-images` bucket
3. Click **Settings** (gear icon)
4. Toggle **Public bucket** to ON
5. This automatically disables RLS for this bucket

## 🧪 Test After Fix

1. Try uploading an image again
2. Check browser console for success messages
3. Verify the image appears in your Supabase Storage dashboard

## 📝 Notes

- **Option 3** (Public bucket) is the easiest for development
- For production, use **Option 2** with proper RLS policies
- The bucket needs to be public anyway for images to be accessible via URL
