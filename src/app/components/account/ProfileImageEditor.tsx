'use client';

import React, { useState, useEffect, ChangeEvent } from 'react';
import ImageCropModal from '../auth/register/steps/ImageCropModal';

interface ProfileImageEditorProps {
  initialImageUrl: string | null;
  onImageChange: (file: File | null) => void;
}

const ProfileImageEditor: React.FC<ProfileImageEditorProps> = ({ initialImageUrl, onImageChange }) => {
  const [profilePreview, setProfilePreview] = useState<string | null>(initialImageUrl);
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');

  // Set first and last name for fallback avatar
  useEffect(() => {
    // Try to get name from local storage
    const storedFirstName = localStorage.getItem('firstName');
    const storedLastName = localStorage.getItem('lastName');
    
    if (storedFirstName) setFirstName(storedFirstName);
    if (storedLastName) setLastName(storedLastName);
  }, []);

  // Handle profile image selection
  const handleProfileImageSelect = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      
      // Create a URL for cropping
      const reader = new FileReader();
      reader.onload = () => {
        const imageUrl = reader.result as string;
        setCropImage(imageUrl);
      };
      reader.readAsDataURL(file);
      
      // Reset the input
      event.target.value = '';
    }
  };
  
  // Handle cropped image
  const handleCroppedImage = (file: File) => {
    onImageChange(file);
    const previewUrl = URL.createObjectURL(file);
    setProfilePreview(previewUrl);
    setCropImage(null);
  };
  
  // Remove profile image
  const removeProfileImage = () => {
    onImageChange(null);
    
    // If there was a preview URL that's not the initial URL, revoke it
    if (profilePreview && profilePreview !== initialImageUrl) {
      URL.revokeObjectURL(profilePreview);
    }
    
    // Reset to initial image URL if available
    setProfilePreview(initialImageUrl);
  };

  // Clean up URLs on unmount
  useEffect(() => {
    return () => {
      // Clean up any created object URLs to avoid memory leaks
      if (profilePreview && profilePreview !== initialImageUrl) {
        URL.revokeObjectURL(profilePreview);
      }
    };
  }, [initialImageUrl]);

  return (
    <div>
      <h3 className="text-lg font-medium mb-3">รูปโปรไฟล์</h3>
      <div className="flex items-center gap-4">
        <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
          {profilePreview ? (
            <img
              src={profilePreview}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary-blue-500 text-white text-2xl font-medium">
              {firstName && lastName ? `${firstName[0]}${lastName[0]}` : '?'}
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          <label className="btn-secondary cursor-pointer">
            เลือกรูปภาพ
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleProfileImageSelect}
            />
          </label>
          
          {profilePreview && (
            <button
              type="button"
              onClick={removeProfileImage}
              className="btn-danger"
            >
              ลบรูปภาพ
            </button>
          )}
        </div>
      </div>

      {/* Image cropper modal */}
      {cropImage && (
        <ImageCropModal
          imageSrc={cropImage}
          onClose={() => setCropImage(null)}
          onSave={handleCroppedImage}
        />
      )}
    </div>
  );
};

export default ProfileImageEditor;