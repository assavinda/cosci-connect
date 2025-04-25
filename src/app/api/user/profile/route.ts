// src/app/api/user/profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectToDatabase from '@/libs/mongodb';
import User from '@/models/User';
import { uploadToCloudinary, deleteFromCloudinary } from '@/libs/cloudinary';

// Get the user profile
export async function GET(req: NextRequest) {
  try {
    // Get the authenticated user
    const session = await getServerSession();
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Connect to the database
    await connectToDatabase();

    // Get the user from the database
    const user = await User.findOne({ email: session.user.email }).exec();
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Return the user data (exclude sensitive information)
    return NextResponse.json({
      name: user.name,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      major: user.major,
      skills: user.skills,
      studentId: user.studentId,
      bio: user.bio,
      profileImageUrl: user.profileImageUrl,
      portfolioUrl: user.portfolioUrl,
      isOpen: user.role === 'student' ? user.isOpen : undefined,
      basePrice: user.basePrice,
      galleryImages: user.galleryImages || []
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update the user profile
export async function PATCH(req: NextRequest) {
  try {
    // Get the authenticated user
    const session = await getServerSession();
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Connect to the database
    await connectToDatabase();

    // Get the user from the database
    const user = await User.findOne({ email: session.user.email }).exec();
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Parse the request body
    const formData = await req.formData();
    
    // Extract the data to update
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const bio = formData.get('bio') as string;
    
    // Update skills if provided
    const skillsString = formData.get('skills') as string;
    const skills = skillsString ? JSON.parse(skillsString) : undefined;
    
    // Get base price for students
    const basePriceStr = formData.get('basePrice') as string;
    const basePrice = basePriceStr ? parseInt(basePriceStr, 10) : undefined;
    
    // Get isOpen status for students
    const isOpenStr = formData.get('isOpen') as string;
    const isOpen = user.role === 'student' ? isOpenStr === 'true' : undefined;
    
    // Create update object with only the fields that were provided
    const updateData: any = {};
    
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (firstName && lastName) updateData.name = `${firstName} ${lastName}`;
    if (bio !== undefined) updateData.bio = bio;
    if (skills) updateData.skills = skills;
    if (basePrice !== undefined && user.role === 'student') updateData.basePrice = basePrice;
    if (isOpen !== undefined && user.role === 'student') updateData.isOpen = isOpen;
    
    // Handle profile image update if provided
    const profileImage = formData.get('profileImage') as File | null;
    
    if (profileImage) {
      // Convert the file to a buffer and then to base64
      const bytes = await profileImage.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64Image = `data:${profileImage.type};base64,${buffer.toString('base64')}`;
      
      // Upload to Cloudinary
      const profileImageUrl = await uploadToCloudinary(base64Image, user._id.toString(), 'profileImage');
      updateData.profileImageUrl = profileImageUrl;
    }
    
    // Handle portfolio file for students
    if (user.role === 'student') {
      // Check if portfolio should be deleted
      const deletePortfolio = formData.get('deletePortfolio') === 'true';
      
      if (deletePortfolio) {
        updateData.portfolioUrl = null;
      } else {
        // Upload new portfolio if provided
        const portfolio = formData.get('portfolio') as File | null;
        
        if (portfolio) {
          // Convert the file to a buffer and then to base64
          const bytes = await portfolio.arrayBuffer();
          const buffer = Buffer.from(bytes);
          const base64File = `data:${portfolio.type};base64,${buffer.toString('base64')}`;
          
          // Upload to Cloudinary
          const portfolioUrl = await uploadToCloudinary(base64File, user._id.toString(), 'portfolio');
          updateData.portfolioUrl = portfolioUrl;
        }
      }
      
      // Handle gallery images
      // Initialize gallery images if they don't exist
      if (!user.galleryImages) {
        user.galleryImages = [];
      }
      
      // Handle deleted gallery images
      const deletedGalleryImagesStr = formData.get('deletedGalleryImages') as string;
      if (deletedGalleryImagesStr) {
        console.log('Processing deleted gallery images');
        try {
          const deletedGalleryImages = JSON.parse(deletedGalleryImagesStr);
          console.log('Parsed deletedGalleryImages:', deletedGalleryImages);
          
          if (Array.isArray(deletedGalleryImages) && deletedGalleryImages.length > 0) {
            // Remove deleted images from the array
            updateData.galleryImages = user.galleryImages.filter(
              (url: string) => !deletedGalleryImages.includes(url)
            );
            
            console.log(`Will remove ${deletedGalleryImages.length} images from user gallery`);
            
            // Delete each image from Cloudinary
            for (const imageUrl of deletedGalleryImages) {
              console.log('Attempting to delete from Cloudinary:', imageUrl);
              const deleted = await deleteFromCloudinary(imageUrl);
              console.log('Image delete result:', deleted ? 'Success' : 'Failed');
            }
          } else {
            console.log('No valid image URLs to delete');
          }
        } catch (error) {
          console.error('Error processing or deleting gallery images:', error);
          // Even if delete fails, continue with DB update
          updateData.galleryImages = [...user.galleryImages];
        }
      } else {
        // If no deleted images were specified, keep the existing ones
        updateData.galleryImages = [...user.galleryImages];
      }
      
      // Handle new gallery images
      const newGalleryImages: string[] = [];
      
      // Process up to 6 new gallery images
      for (let i = 0; i < 6; i++) {
        const galleryImage = formData.get(`galleryImage${i}`) as File | null;
        
        if (galleryImage) {
          // Convert the file to a buffer and then to base64
          const bytes = await galleryImage.arrayBuffer();
          const buffer = Buffer.from(bytes);
          const base64Image = `data:${galleryImage.type};base64,${buffer.toString('base64')}`;
          
          // Generate a unique ID for the gallery image
          const uniqueId = `gallery_${Date.now()}_${i}`;
          
          // Upload to Cloudinary with a unique ID for each gallery image
          const galleryImageUrl = await uploadToCloudinary(
            base64Image, 
            user._id.toString(), 
            'gallery', // Use specific gallery type
            uniqueId   // Create a unique ID for each image
          );
          
          newGalleryImages.push(galleryImageUrl);
        }
      }
      
      // Combine existing (minus deleted) and new gallery images, up to max of 6
      if (newGalleryImages.length > 0) {
        const currentGalleryImages = updateData.galleryImages || user.galleryImages || [];
        updateData.galleryImages = [...currentGalleryImages, ...newGalleryImages].slice(0, 6);
      }
    }
    
    // Update the user
    const updatedUser = await User.findOneAndUpdate(
      { email: session.user.email },
      { $set: updateData },
      { new: true }
    ).exec();
    
    // Return the updated user data
    return NextResponse.json({
      name: updatedUser.name,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      email: updatedUser.email,
      role: updatedUser.role,
      major: updatedUser.major,
      skills: updatedUser.skills,
      studentId: updatedUser.studentId,
      bio: updatedUser.bio,
      profileImageUrl: updatedUser.profileImageUrl,
      portfolioUrl: updatedUser.portfolioUrl,
      isOpen: updatedUser.role === 'student' ? updatedUser.isOpen : undefined,
      basePrice: updatedUser.basePrice,
      galleryImages: updatedUser.galleryImages || []
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}