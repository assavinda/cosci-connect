// src/app/api/user/profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectToDatabase from '@/libs/mongodb';
import User from '@/models/User';
import { uploadToCloudinary } from '@/libs/cloudinary';

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
    
    // Handle profile image update if provided
    const profileImage = formData.get('profileImage') as File | null;
    let profileImageUrl = undefined;
    
    if (profileImage) {
      // Convert the file to a buffer and then to base64
      const bytes = await profileImage.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64Image = `data:${profileImage.type};base64,${buffer.toString('base64')}`;
      
      // Upload to Cloudinary
      profileImageUrl = await uploadToCloudinary(base64Image, user._id.toString(), 'profileImage');
    }
    
    // Handle portfolio update if provided
    const portfolio = formData.get('portfolio') as File | null;
    let portfolioUrl = undefined;
    
    if (portfolio && user.role === 'student') {
      // Convert the file to a buffer and then to base64
      const bytes = await portfolio.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64File = `data:${portfolio.type};base64,${buffer.toString('base64')}`;
      
      // Upload to Cloudinary
      portfolioUrl = await uploadToCloudinary(base64File, user._id.toString(), 'portfolio');
    }
    
    // Create update object with only the fields that were provided
    const updateData: any = {};
    
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (firstName && lastName) updateData.name = `${firstName} ${lastName}`;
    if (bio !== undefined) updateData.bio = bio;
    if (skills) updateData.skills = skills;
    if (profileImageUrl) updateData.profileImageUrl = profileImageUrl;
    if (portfolioUrl) updateData.portfolioUrl = portfolioUrl;
    
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
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}