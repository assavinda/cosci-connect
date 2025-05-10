// src/app/api/notifications/[id]/read/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/libs/auth';
import connectToDatabase from '@/libs/mongodb';
import Notification from '@/models/Notification';
import mongoose from 'mongoose';

// POST - Mark a specific notification as read
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ใช้ getServerSession จาก next-auth/jwt แทน next-auth
    const session = await getServerSession({ req });
    
    if (!session || !session.sub) {
      console.error('Mark read API - Session error:', session);
      return NextResponse.json(
        { error: 'Unauthorized - Please login to manage notifications' },
        { status: 401 }
      );
    }

    const userId = session.sub;

    // Get notification ID from route params
    const { id } =  await params;
    
    // Validate the ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid notification ID format' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectToDatabase();
    
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