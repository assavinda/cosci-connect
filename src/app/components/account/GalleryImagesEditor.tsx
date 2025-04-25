'use client';

import React, { useState, useRef, ChangeEvent, useEffect } from 'react';

interface GalleryImagesEditorProps {
  initialImages: string[];
  onImagesChange: (newFiles: File[], deletedImageUrls: string[]) => void;
}

const GalleryImagesEditor: React.FC<GalleryImagesEditorProps> = ({ 
  initialImages, 
  onImagesChange 
}) => {
  // State
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>(initialImages || []);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [deletedImages, setDeletedImages] = useState<string[]>([]);
  const [error, setError] = useState('');
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Whenever state changes, update parent component
  useEffect(() => {
    onImagesChange(newImages, deletedImages);
  }, [newImages, deletedImages, onImagesChange]);
  
  // Handle gallery image selection
  const handleImageSelect = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const selectedFiles = Array.from(event.target.files);
      
      // Calculate available slots
      const existingImages = initialImages.filter(url => !deletedImages.includes(url));
      const availableSlots = 6 - existingImages.length - newImages.length;
      
      if (selectedFiles.length > availableSlots) {
        setError(`คุณสามารถเพิ่มรูปได้อีก ${availableSlots} รูป`);
        return;
      }
      
      // Validate each file
      const validFiles: File[] = [];
      const newPreviews: string[] = [];
      
      selectedFiles.forEach(file => {
        // Check size (max 2MB per image)
        if (file.size > 2 * 1024 * 1024) {
          setError('รูปภาพขนาดใหญ่เกินไป (สูงสุด 2MB ต่อรูป)');
          return;
        }
        
        // Check type (image only)
        if (!file.type.startsWith('image/')) {
          setError('กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น');
          return;
        }
        
        // File is valid
        validFiles.push(file);
        newPreviews.push(URL.createObjectURL(file));
      });
      
      if (validFiles.length === 0) return;
      
      // Update state
      setNewImages(prev => [...prev, ...validFiles]);
      setGalleryPreviews(prev => [...prev, ...newPreviews]);
      setError('');
      
      // Reset the input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  // Handle image deletion
  const removeImage = (index: number) => {
    // Calculate indexes
    const initialImagesCount = initialImages.length - deletedImages.length;
    
    if (index < initialImagesCount) {
      // It's an existing image
      const originalIndex = initialImages.findIndex(url => 
        !deletedImages.includes(url) || initialImages.indexOf(url) === index
      );
      
      if (originalIndex >= 0) {
        const imageUrl = initialImages[originalIndex];
        setDeletedImages(prev => [...prev, imageUrl]);
        
        // Remove from previews
        setGalleryPreviews(prev => prev.filter(url => url !== imageUrl));
      }
    } else {
      // It's a new image
      const newImageIndex = index - initialImagesCount;
      
      if (newImageIndex >= 0 && newImageIndex < newImages.length) {
        // Get the preview URL to revoke
        const previewToRemove = galleryPreviews[index];
        
        // Remove from newImages array
        const updatedNewImages = [...newImages];
        updatedNewImages.splice(newImageIndex, 1);
        setNewImages(updatedNewImages);
        
        // Remove from previews
        const updatedPreviews = [...galleryPreviews];
        updatedPreviews.splice(index, 1);
        setGalleryPreviews(updatedPreviews);
        
        // Revoke the object URL to prevent memory leaks
        URL.revokeObjectURL(previewToRemove);
      }
    }
  };
  
  // Clean up object URLs when component unmounts
  useEffect(() => {
    return () => {
      // Revoke any preview URLs we created
      galleryPreviews.forEach(url => {
        // Only revoke URLs that we created (not the initial image URLs)
        if (!initialImages.includes(url)) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, []);

  return (
    <div>
      <h3 className="text-lg font-medium mb-3">รูปภาพตัวอย่างผลงาน (สูงสุด 6 รูป)</h3>
      
      {/* Error message */}
      {error && (
        <div className="mb-3 text-red-500 text-sm">
          {error}
        </div>
      )}
      
      {/* Image grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
        {/* Display all previews (initial + new) */}
        {galleryPreviews.map((imageUrl, index) => (
          <div key={index} className="relative group">
            <div className="h-40 rounded-lg overflow-hidden border border-gray-200">
              <img 
                src={imageUrl} 
                alt={`Portfolio example ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
            <button
              type="button"
              onClick={() => removeImage(index)}
              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Remove image"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18"></path>
                <path d="M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        ))}
        
        {/* Add new image button - shown only if less than 6 images */}
        {galleryPreviews.length < 6 && (
          <div className="h-40 rounded-lg border border-dashed border-gray-300 flex items-center justify-center">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              multiple
              onChange={handleImageSelect}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-4 flex flex-col items-center justify-center text-gray-500 hover:text-primary-blue-500 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
              <span className="text-xs">เพิ่มรูปภาพ</span>
            </button>
          </div>
        )}
      </div>
      
      <p className="text-sm text-gray-500">
        อัปโหลดรูปภาพตัวอย่างผลงานของคุณ (สูงสุด 6 รูป, ขนาดไม่เกิน 2MB ต่อรูป)
      </p>
    </div>
  );
};

export default GalleryImagesEditor;