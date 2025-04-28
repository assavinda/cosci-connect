// src/app/api/freelancers/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/libs/mongodb';
import User from '@/models/User';
import mongoose from 'mongoose';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get freelancer ID from route params
    const id = params.id;
    
    // Validate the ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid freelancer ID format' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectToDatabase();
    
    // Find user by ID and ensure it's a student/freelancer
    const user = await User.findOne({
      _id: id,
      role: 'student'
    }).lean().exec();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Freelancer not found' },
        { status: 404 }
      );
    }
    
    // Map to response object (clean up sensitive data)
    const freelancer = {
      id: user._id.toString(),
      name: user.name,
      firstName: user.firstName,
      lastName: user.lastName,
      major: user.major,
      skills: user.skills || [],
      profileImageUrl: user.profileImageUrl,
      basePrice: user.basePrice || 500,
      galleryImages: user.galleryImages || [],
      bio: user.bio || '',
      portfolioUrl: user.portfolioUrl
    };
    
    return NextResponse.json(freelancer);
  } catch (error) {
    console.error('Error fetching freelancer:', error);
    return NextResponse.json(
      { error: 'Failed to fetch freelancer details' },
      { status: 500 }
    );
  }
}