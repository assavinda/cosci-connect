// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/libs/mongodb';
import User from '@/models/User';
import { uploadToCloudinary } from '@/libs/cloudinary';
import mongoose from 'mongoose';

export async function POST(req: NextRequest) {
  try {
    // Connect to the database
    await connectToDatabase();

    // Parse the request body
    const formData = await req.formData();
    
    const email = formData.get('email') as string;
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const name = `${firstName} ${lastName}`;
    const role = formData.get('role') as 'student' | 'alumni' | 'teacher';
    const major = formData.get('major') as string;
    const bio = formData.get('bio') as string || '';
    
    // รับค่า basePrice จาก formData
    const basePriceStr = formData.get('basePrice') as string;
    const basePrice = role === 'student' ? parseInt(basePriceStr, 10) || 500 : undefined;
    
    // รับค่า isOpen จาก formData
    const isOpenStr = formData.get('isOpen') as string;
    const isOpen = role === 'student' ? isOpenStr === 'true' : undefined;
    
    // Get skills as a string and convert to array
    const skillsString = formData.get('skills') as string;
    const skills = skillsString ? JSON.parse(skillsString) : [];
    
    // For students, get studentId
    let studentId = '';
    if (role === 'student') {
      studentId = formData.get('studentId') as string;
      if (!studentId) {
        return NextResponse.json(
          { error: 'Student ID is required for students' },
          { status: 400 }
        );
      }
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email }).exec();
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Check if student ID is already used
    if (role === 'student' && studentId) {
      const existingStudentId = await User.findOne({ studentId }).exec();
      if (existingStudentId) {
        return NextResponse.json(
          { error: 'Student ID is already registered' },
          { status: 400 }
        );
      }
    }

    // Create user document without files first
    const userData = {
      name,
      firstName,
      lastName,
      email,
      role,
      major,
      skills,
      bio,
      emailVerified: true, // Set to true since we verify via OTP
      ...(role === 'student' && { studentId }),
      ...(role === 'student' && { isOpen }),
      ...(role === 'student' && { basePrice }),
    };

    const user = new User(userData);
    await user.save();
    
    // Get the user ID from the saved user
    const userId = user._id.toString();

    // Handle profile image upload if provided
    const profileImage = formData.get('profileImage') as File | null;
    if (profileImage) {
      // Convert the file to a buffer and then to base64
      const bytes = await profileImage.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64Image = `data:${profileImage.type};base64,${buffer.toString('base64')}`;
      
      // Upload to Cloudinary
      const profileImageUrl = await uploadToCloudinary(base64Image, userId, 'profileImage');
      
      // Update the user with the profile image URL
      user.profileImageUrl = profileImageUrl;
    }

    // Handle portfolio upload if provided
    const portfolio = formData.get('portfolio') as File | null;
    if (portfolio && role === 'student') {
      // Convert the file to a buffer and then to base64
      const bytes = await portfolio.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64File = `data:${portfolio.type};base64,${buffer.toString('base64')}`;
      
      // Upload to Cloudinary
      const portfolioUrl = await uploadToCloudinary(base64File, userId, 'portfolio');
      
      // Update the user with the portfolio URL
      user.portfolioUrl = portfolioUrl;
    }

    // Handle gallery images upload if provided
    const galleryImages: string[] = [];
    if (role === 'student') {
      // Process up to 6 gallery images
      for (let i = 0; i < 6; i++) {
        const galleryImage = formData.get(`galleryImage${i}`) as File | null;
        
        if (galleryImage) {
          // Convert the file to a buffer and then to base64
          const bytes = await galleryImage.arrayBuffer();
          const buffer = Buffer.from(bytes);
          const base64Image = `data:${galleryImage.type};base64,${buffer.toString('base64')}`;
          
          // Generate a unique ID for gallery image
          const uniqueId = `gallery_${Date.now()}_${i}`;
          
          // Upload to Cloudinary to specific gallery folder
          const galleryImageUrl = await uploadToCloudinary(
            base64Image, 
            userId, 
            'gallery',
            uniqueId
          );
          
          galleryImages.push(galleryImageUrl);
        }
      }
      
      if (galleryImages.length > 0) {
        user.galleryImages = galleryImages;
      }
    }

    // Save the updated user if files were uploaded
    if (profileImage || portfolio || galleryImages.length > 0) {
      await user.save();
    }

    return NextResponse.json(
      { 
        success: true, 
        user: {
          id: userId,
          name,
          email,
          role,
          profileImageUrl: user.profileImageUrl,
          isOpen: role === 'student' ? user.isOpen : undefined,
          basePrice: role === 'student' ? user.basePrice : undefined,
          galleryImages: role === 'student' ? user.galleryImages : undefined
        } 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    
    // Check if it's a MongoDB duplicate key error
    if (error instanceof mongoose.Error.ValidationError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Something went wrong during registration' },
      { status: 500 }
    );
  }
}