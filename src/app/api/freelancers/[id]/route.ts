// src/app/api/freelancers/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/libs/mongodb';
import User from '@/models/User';
import mongoose from 'mongoose';
import pusherServer, { 
  triggerFreelancerUpdate, 
  triggerFreelancerListUpdate 
} from '@/libs/pusher';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get freelancer ID from route params
    const { id } =  await params;
    
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
      portfolioUrl: user.portfolioUrl,
      isOpen: user.isOpen
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

// PATCH - Update a freelancer profile
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get freelancer ID from route params
    const { id } =  await params;
    
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
    }).exec();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Freelancer not found' },
        { status: 404 }
      );
    }
    
    // Get authenticated user session
    const session = await getServerSession();
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized - Please login to update a profile' },
        { status: 401 }
      );
    }
    
    // Get the current user
    const currentUser = await User.findOne({ email: session.user.email }).exec();
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Parse the request body
    const data = await req.json();
    
    // Fields that can be updated
    const updateData: any = {};
    
    // Basic info
    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.firstName && data.lastName) {
      updateData.name = `${data.firstName} ${data.lastName}`;
    }
    if (data.bio !== undefined) updateData.bio = data.bio;
    
    // Freelancer specific fields
    if (data.basePrice !== undefined) {
      const basePrice = parseInt(data.basePrice, 10);
      if (isNaN(basePrice) || basePrice < 100) {
        return NextResponse.json(
          { error: 'Base price must be at least 100' },
          { status: 400 }
        );
      }
      updateData.basePrice = basePrice;
    }
    
    if (data.isOpen !== undefined) {
      updateData.isOpen = Boolean(data.isOpen);
    }
    
    if (data.skills !== undefined) {
      if (!Array.isArray(data.skills)) {
        return NextResponse.json(
          { error: 'Skills must be an array' },
          { status: 400 }
        );
      }
      updateData.skills = data.skills;
    }
    
    // Update the user
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    ).lean().exec();
    
    // Check if updatedUser is null
    if (!updatedUser) {
      return NextResponse.json(
        { error: 'Failed to update freelancer: User not found after update' },
        { status: 404 }
      );
    }

    // Map to response object (clean up sensitive data)
    const freelancer = {
      id: updatedUser._id.toString(),
      name: updatedUser.name,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      major: updatedUser.major,
      skills: updatedUser.skills || [],
      profileImageUrl: updatedUser.profileImageUrl,
      basePrice: updatedUser.basePrice || 500,
      galleryImages: updatedUser.galleryImages || [],
      bio: updatedUser.bio || '',
      portfolioUrl: updatedUser.portfolioUrl,
      isOpen: updatedUser.isOpen
    };
    
    // ส่งการอัปเดตแบบเรียลไทม์
    await triggerFreelancerUpdate(id, freelancer);
    
    // อัปเดตรายการฟรีแลนซ์ทั้งหมด ในกรณีที่มีการเปลี่ยนสถานะหรือทักษะ
    if (data.isOpen !== undefined || data.skills !== undefined || data.basePrice !== undefined) {
      await triggerFreelancerListUpdate();
    }
    
    return NextResponse.json({
      success: true,
      message: 'Freelancer updated successfully',
      freelancer
    });
  } catch (error) {
    console.error('Error updating freelancer:', error);
    return NextResponse.json(
      { error: 'Failed to update freelancer: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}

// เพิ่มฟังก์ชัน getServerSession เพื่อรับข้อมูล session ผู้ใช้
async function getServerSession() {
  try {
    // Import the getServerSession function dynamically to avoid circular dependencies
    const { getServerSession } = await import('next-auth');
    return await getServerSession();
  } catch (error) {
    console.error('Error getting server session:', error);
    return null;
  }
}