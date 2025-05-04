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
 * @param type Type of file ('profileImage', 'portfolio', or 'gallery')
 * @param publicId Optional public ID to use (for gallery images)
 * @returns URL of the uploaded file
 */
// src/libs/cloudinary.ts
export async function uploadToCloudinary(
  file: string, 
  userId: string, 
  type: 'profileImage' | 'portfolio' | 'gallery',
  publicId?: string
): Promise<string> {
  // สร้าง folder path ตามประเภทไฟล์
  const folderPath = type === 'gallery' 
    ? `users/${userId}/gallery` 
    : `users/${userId}/${type}`;
  
  try {
    // ตรวจสอบประเภทไฟล์
    const isPDF = file.includes('application/pdf');
    
    // สำหรับไฟล์ PDF (portfolio)
    if (type === 'portfolio' && isPDF) {
      const result = await cloudinary.uploader.upload(file, {
        folder: folderPath,
        resource_type: 'raw',  // แก้ไขจาก 'image' เป็น 'raw' สำหรับ PDF
        public_id: 'portfolio',
        overwrite: true,
        type: 'upload'
      });

      // เพิ่ม fl_attachment เพื่อบังคับให้ดาวน์โหลด
      return result.secure_url;
    }
    
    // สำหรับรูปภาพและไฟล์อื่นๆ
    const result = await cloudinary.uploader.upload(file, {
      folder: folderPath,
      resource_type: type === 'portfolio' ? 'auto' : 'image',
      public_id: publicId || (type === 'portfolio' ? 'portfolio' : (type === 'profileImage' ? 'profile' : undefined)),
      overwrite: type !== 'gallery',
    });

    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload file to Cloudinary');
  }
}

/**
 * Delete a file from Cloudinary
 * @param url The URL of the file to delete
 * @returns Success status
 */
export async function deleteFromCloudinary(url: string): Promise<boolean> {
  try {
    console.log('Attempting to delete Cloudinary file:', url);
    
    // URL format examples:
    // https://res.cloudinary.com/cloud_name/image/upload/v1234567890/users/123456/gallery/image_123.jpg
    // or sometimes: https://res.cloudinary.com/cloud_name/image/upload/users/123456/gallery/image_123.jpg (no version)
    
    // Get everything after the /upload/ part which includes version (if present) and path
    const uploadIndex = url.indexOf('/upload/');
    if (uploadIndex === -1) {
      console.error('Invalid Cloudinary URL format (missing /upload/)', url);
      return false;
    }
    
    let pathAfterUpload = url.substring(uploadIndex + 8); // +8 for "/upload/"
    
    // Check if the path contains a version number (v1234567890/)
    const versionMatch = pathAfterUpload.match(/^v\d+\//);
    if (versionMatch) {
      // Remove the version part if it exists
      pathAfterUpload = pathAfterUpload.substring(versionMatch[0].length);
    }
    
    // This should now be the full path without version: users/123456/gallery/image_123.jpg
    // Extract the file extension
    const extension = pathAfterUpload.substring(pathAfterUpload.lastIndexOf('.'));
    
    // Remove the extension to get the public ID
    const publicId = pathAfterUpload.substring(0, pathAfterUpload.lastIndexOf('.'));
    
    console.log('Extracted public ID:', publicId);
    
    // Delete the file using the full public ID
    const result = await cloudinary.uploader.destroy(publicId);
    console.log('Cloudinary delete result:', result);
    
    return result.result === 'ok';
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    return false;
  }
}

export default cloudinary;