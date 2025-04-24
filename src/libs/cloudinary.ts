// libs/cloudinary.ts
import { v2 as cloudinary } from 'cloudinary';

if (!process.env.CLOUDINARY_CLOUD_NAME || 
    !process.env.CLOUDINARY_API_KEY || 
    !process.env.CLOUDINARY_API_SECRET) {
  throw new Error('Please add your Cloudinary credentials to .env.local');
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a file to Cloudinary
 * @param file Base64 encoded file to upload
 * @param userId User ID for creating folder structure
 * @param type Type of file ('profileImage' or 'portfolio')
 * @returns URL of the uploaded file
 */
export async function uploadToCloudinary(
  file: string, 
  userId: string, 
  type: 'profileImage' | 'portfolio'
): Promise<string> {
  // Create the folder path
  const folderPath = `users/${userId}/${type}`;
  
  try {
    // Upload the file to Cloudinary
    const result = await cloudinary.uploader.upload(file, {
      folder: folderPath,
      resource_type: type === 'portfolio' ? 'raw' : 'image',
      // Set the public_id to ensure overwriting of previous files
      public_id: type === 'portfolio' ? 'portfolio' : 'profile',
      overwrite: true,
      // For PDF files, specify the format
      format: type === 'portfolio' ? 'pdf' : undefined,
    });

    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload file to Cloudinary');
  }
}

export default cloudinary;