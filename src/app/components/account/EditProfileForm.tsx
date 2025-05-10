'use client';

import React, { useState } from 'react';
import axios from 'axios';
import BasicInfoEditor from './BasicInfoEditor';
import WorkStatusToggle from './WorkStatusToggle';
import BasePriceEditor from './BasePriceEditor';
import SkillsEditor from './SkillsEditor';
import PortfolioFileEditor from './PortfolioFileEditor';
import GalleryImagesEditor from './GalleryImagesEditor';
import ProfileImageEditor from './ProfileImageEditor';
import { useUser } from '../../../providers/UserProvider'; // Import useUser hook

interface EditProfileFormProps {
  userData: any;
  onUpdateSuccess: (updatedData: any) => void;
  onCancel: () => void;
}

const EditProfileForm: React.FC<EditProfileFormProps> = ({ userData, onUpdateSuccess, onCancel }) => {
  // Access the UserProvider context
  const { updateUserData, refreshUserData } = useUser();

  // Form state
  const [firstName, setFirstName] = useState(userData?.firstName || '');
  const [lastName, setLastName] = useState(userData?.lastName || '');
  const [bio, setBio] = useState(userData?.bio || '');
  const [basePrice, setBasePrice] = useState(userData?.basePrice || 500);
  const [selectedSkills, setSelectedSkills] = useState<string[]>(userData?.skills || []);
  const [isOpen, setIsOpen] = useState(userData?.isOpen || false);
  
  // File state
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [portfolioFile, setPortfolioFile] = useState<File | null>(null);
  const [deletePortfolio, setDeletePortfolio] = useState(false);
  const [newGalleryImages, setNewGalleryImages] = useState<File[]>([]);
  const [deletedGalleryImages, setDeletedGalleryImages] = useState<string[]>([]);
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Handlers for each component
  const handleProfileImageChange = (file: File | null) => {
    setProfileImage(file);
  };
  
  const handlePortfolioChange = (file: File | null, shouldDelete: boolean) => {
    setPortfolioFile(file);
    setDeletePortfolio(shouldDelete);
  };
  
  const handleGalleryImagesChange = (newFiles: File[], deletedImageUrls: string[]) => {
    setNewGalleryImages(newFiles);
    setDeletedGalleryImages(deletedImageUrls);
  };
  
  // Handle form submission
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMessage('');
    
    try {
      // Create form data for submission
      const formData = new FormData();
      
      // Basic info
      formData.append('firstName', firstName);
      formData.append('lastName', lastName);
      formData.append('bio', bio);
      
      // Student-specific fields
      if (userData.role === 'student') {
        formData.append('isOpen', isOpen.toString());
        formData.append('basePrice', basePrice.toString());
        formData.append('skills', JSON.stringify(selectedSkills));
        
        // Portfolio handling
        if (deletePortfolio) {
          formData.append('deletePortfolio', 'true');
        }
        if (portfolioFile) {
          formData.append('portfolio', portfolioFile);
        }
        
        // Gallery images handling
        if (deletedGalleryImages.length > 0) {
          formData.append('deletedGalleryImages', JSON.stringify(deletedGalleryImages));
        }
        
        // Add new gallery images
        newGalleryImages.forEach((file, index) => {
          formData.append(`galleryImage${index}`, file);
        });
      }
      
      // Profile image
      if (profileImage) {
        formData.append('profileImage', profileImage);
      }
      
      // Submit form
      const response = await axios.patch('/api/user/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      // Show success message
      setSuccessMessage('บันทึกข้อมูลสำเร็จ');
      
      // Update UserProvider state with new data
      if (profileImage && response.data.profileImageUrl) {
        // Update the user data in context
        updateUserData({
          profileImageUrl: response.data.profileImageUrl,
          name: response.data.name,
          firstName: response.data.firstName,
          lastName: response.data.lastName
        });
      } else {
        // Refresh all user data from server
        await refreshUserData();
      }
      
      // Notify parent component of updated data
      onUpdateSuccess(response.data);
      
      // Clear success message after a delay
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setError(error.response?.data?.error || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองอีกครั้ง');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6">
      <div className="flex justify-between items-center mb-6">
        <button onClick={onCancel} className="text-primary-blue-500 hover:text-primary-blue-600 flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
          กลับไปยังหน้าโปรไฟล์
        </button>
      </div>

      <h2 className="text-xl font-medium text-primary-blue-500 mb-4 border-b border-gray-300 pb-4">แก้ไขโปรไฟล์</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-300 text-red-700 rounded-lg">
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="mb-4 p-3 bg-green-50 border border-green-300 text-green-700 rounded-lg">
          {successMessage}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile Image */}
        <ProfileImageEditor 
          initialImageUrl={userData?.profileImageUrl || null}
          onImageChange={handleProfileImageChange}
        />
        
        {/* Basic Information */}
        <BasicInfoEditor 
          firstName={firstName}
          lastName={lastName}
          bio={bio}
          onFirstNameChange={setFirstName}
          onLastNameChange={setLastName}
          onBioChange={setBio}
        />
        
        {/* Student-specific settings */}
        {userData.role === 'student' && (
          <>
            {/* Work Availability */}
            <WorkStatusToggle 
              isOpen={isOpen}
              onToggle={setIsOpen}
            />
            
            {/* Base Price */}
            <BasePriceEditor 
              basePrice={basePrice}
              onBasePriceChange={setBasePrice}
            />
            
            {/* Skills */}
            <SkillsEditor 
              selectedSkills={selectedSkills}
              onSkillsChange={setSelectedSkills}
            />
            
            {/* Portfolio File */}
            <PortfolioFileEditor 
              portfolioUrl={userData?.portfolioUrl || null}
              onPortfolioChange={handlePortfolioChange}
            />
            
            {/* Gallery Images */}
            <GalleryImagesEditor 
              initialImages={userData?.galleryImages || []}
              onImagesChange={handleGalleryImagesChange}
            />
          </>
        )}
        
        <div className="flex justify-between">
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary"
            disabled={isLoading}
          >
            ยกเลิก
          </button>
          
          <button
            type="submit"
            className={`btn-primary ${isLoading ? 'opacity-50 cursor-not-allowed' : ''} w-32 flex justify-center items-center`}
            disabled={isLoading}
          >
            {isLoading && (
              <span className="inline-block h-4 w-4 border-2 border-white border-r-transparent rounded-full animate-spin mr-2"></span>
            )}
            บันทึกข้อมูล
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProfileForm;