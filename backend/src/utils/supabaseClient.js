import { createClient } from '@supabase/supabase-js';
import { config } from '../config/index.js';

// Configure Supabase
const supabaseUrl = config.supabase.url;
const supabaseKey = config.supabase.serviceRoleKey || config.supabase.key;

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Upload image to Supabase Storage
 * @param {Buffer|Blob|File} file - File buffer
 * @param {string} fileName - File name
 * @param {string} mimeType - File mime type
 * @returns {Promise<string>} - Supabase Public URL
 */
export const uploadImage = async (file, fileName, mimeType) => {
  try {
    const { data: uploadData, error } = await supabase.storage
      .from('incident-photos')
      .upload(`incidents/${fileName}`, file, {
        contentType: mimeType,
        upsert: true
      });

    if (error) {
      throw new Error(`Supabase upload failed: ${error.message}`);
    }

    const { data } = supabase.storage
      .from('incident-photos')
      .getPublicUrl(uploadData.path);

    return data.publicUrl;
  } catch (error) {
    console.error('Supabase upload error:', error);
    throw new Error('Failed to upload image to Supabase');
  }
};

/**
 * Delete image from Supabase
 * @param {string} path - File path in the bucket
 */
export const deleteImage = async (path) => {
  try {
    const { error } = await supabase.storage
      .from('incident-photos')
      .remove([path]);
      
    if (error) {
      throw new Error(`Supabase delete failed: ${error.message}`);
    }
  } catch (error) {
    console.error('Supabase delete error:', error);
    throw new Error('Failed to delete image from Supabase');
  }
};

/**
 * Extract path from Supabase URL
 * @param {string} url - Supabase URL
 * @returns {string} - Bucket path
 */
export const extractPublicId = (url) => {
  const parts = url.split('/');
  return parts.slice(-2).join('/');
};

export default supabase;
