import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  'https://zweyhvisdntwtnmnfdzl.supabase.co';

const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3ZXlodmlzZG50d3RubW5mZHpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4ODA5NTQsImV4cCI6MjEwNjQ1Njk1NH0.fWi3OkOhSOmSrWaU_eQtOLtvIdEC8pYQdnA2QsCjsP8';

export const BUCKET_NAME =
  process.env.SUPABASE_STORAGE_BUCKET ||
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_STORAGE_BUCKET) ||
  'media-berita';

/**
 * Universal Supabase Client for Browser and Server Environments
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

/**
 * Helper to upload a file to Supabase Storage Bucket
 */
export async function uploadMediaToSupabase(
  file: File | Blob,
  path: string,
  contentType?: string
): Promise<{ url: string; path: string }> {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(path, file, {
      upsert: true,
      contentType: contentType || (file as File).type || 'image/jpeg',
    });

  if (error) {
    throw new Error(`Failed to upload media to Supabase: ${error.message}`);
  }

  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(data.path);

  return {
    url: urlData.publicUrl,
    path: data.path,
  };
}

/**
 * Helper to delete a file from Supabase Storage Bucket
 */
export async function deleteMediaFromSupabase(paths: string[]): Promise<void> {
  const { error } = await supabase.storage.from(BUCKET_NAME).remove(paths);
  if (error) {
    console.error('Failed to remove media from Supabase:', error);
  }
}
