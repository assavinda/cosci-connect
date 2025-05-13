// src/app/api/notifications/[id]/read/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/libs/mongodb';
import Notification from '@/models/Notification';
import User from '@/models/User'; // เพิ่ม import User Model
import mongoose from 'mongoose';
import { getServerSession } from "next-auth/next";

// POST - Mark a specific notification as read
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ใช้ getServerSession ของ next-auth เหมือนกับใน route.ts
    const session = await getServerSession();
    
    // ตรวจสอบว่ามี session และ session.user หรือไม่
    if (!session?.user?.email) {
      console.error('Session not found or invalid:', session);
      return NextResponse.json(
        { error: 'Unauthorized - Please login to manage notifications' },
        { status: 401 }
      );
    }

    // ค้นหา user จาก email ใน session
    await connectToDatabase();
    const user = await User.findOne({ email: session.user.email }).exec();
    
    if (!user?._id) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    const userId = user._id.toString();

    // Get notification ID from route params
    const { id } =  await params;
    
    // Validate the ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid notification ID format' },
        { status: 400 }
      );
    }
    
    // Find the notification and verify it belongs to the user
    const notification = await Notification.findOne({
      _id: new mongoose.Types.ObjectId(id),
      recipientId: new mongoose.Types.ObjectId(userId)
    });
    
    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }
    
    // Mark as read
    notification.isRead = true;
    await notification.save();
    
    return NextResponse.json({
      success: true,
      message: 'Notification marked as read',
      notificationId: id
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}