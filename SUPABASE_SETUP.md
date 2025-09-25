# Supabase Setup Guide

## 🚀 Quick Setup Steps

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Sign up/Login and create a new project
3. Wait for the project to be ready (usually takes 1-2 minutes)

### 2. Get Your Credentials
1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy your **Project URL** and **anon public** key
3. These will be your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

### 3. Create Storage Bucket
1. In your Supabase dashboard, go to **Storage**
2. Click **New bucket**
3. Name it: `token-images`
4. Make it **Public** (so images can be accessed via URL)
5. Click **Create bucket**

### 4. Update Environment Variables
Create a `.env` file in your project root with:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_SUPABASE_STORAGE_BUCKET=token-images
```

### 5. Test the Setup
1. Start your development server: `npm run dev`
2. Open browser console and look for "Supabase connection test result"
3. If successful, you should see connection details
4. If failed, check the error message and fix accordingly

## 🔧 Troubleshooting

### Common Issues:

1. **"Missing Supabase environment variables"**
   - Make sure your `.env` file is in the project root
   - Restart your dev server after adding env variables
   - Check that variable names start with `VITE_`

2. **"Bucket not found"**
   - Make sure you created the bucket named `token-images`
   - Check that the bucket is public

3. **"Upload failed: Invalid JWT"**
   - Check that your anon key is correct
   - Make sure you copied the full key without extra spaces

4. **"Failed to access bucket"**
   - Make sure the bucket is public
   - Check your RLS (Row Level Security) policies

## 🧪 Testing Upload

Once setup is complete:
1. Go to the Token Creation page
2. Try uploading an image
3. Check browser console for detailed logs
4. The image should appear in your Supabase Storage dashboard

## 📝 Notes

- Images are stored in the `token-images/` folder within your bucket
- Each image gets a unique filename with timestamp
- Images are publicly accessible via their URLs
- File size limit is 10MB
- Only image files are allowed
