// src/app/api/notifications/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectToDatabase from '@/libs/mongodb';
import Notification from '@/models/Notification';
import mongoose from 'mongoose';

// GET - Retrieve a specific notification
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get notification ID from route params
    const id = params.id;
    
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid notification ID format' },
        { status: 400 }
      );
    }
    
    // Get the authenticated user
    const session = await getServerSession();
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Please login to view notifications' },
        { status: 401 }
      );
    }

    // Connect to database
    await connectToDatabase();
    
    // Find notification by ID and ensure it belongs to the user
    const notification = await Notification.findOne({
      _id: id,
      userId: session.user.id
    }).lean().exec();
    
    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found or access denied' },
        { status: 404 }
      );
    }
    
    // Return the notification
    return NextResponse.json({
      id: notification._id.toString(),
      type: notification.type,
      title: notification.title,
      message: notification.message,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
      data: notification.data
    });
  } catch (error) {
    console.error('Error fetching notification:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notification' },
      { status: 500 }
    );
  }
}

// PATCH - Mark a specific notification as read
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get notification ID from route params
    const id = params.id;
    
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid notification ID format' },
        { status: 400 }
      );
    }
    
    // Get the authenticated user
    const session = await getServerSession();
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Please login to update notifications' },
        { status: 401 }
      );
    }

    // Connect to database
    await connectToDatabase();
    
    // Find and update the notification
    const notification = await Notification.findOneAndUpdate(
      {
        _id: id,
        userId: session.user.id
      },
      { $set: { isRead: true } },
      { new: true }
    ).lean().exec();
    
    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found or access denied' },
        { status: 404 }
      );
    }
    
    // Return the updated notification
    return NextResponse.json({
      success: true,
      notification: {
        id: notification._id.toString(),
        type: notification.type,
        title: notification.title,
        message: notification.message,
        isRead: notification.isRead,
        createdAt: notification.createdAt,
        data: notification.data
      }
    });
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json(
      { error: 'Failed to update notification' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a specific notification
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get notification ID from route params
    const id = params.id;
    
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid notification ID format' },
        { status: 400 }
      );
    }
    
    // Get the authenticated user
    const session = await getServerSession();
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Please login to delete notifications' },
        { status: 401 }
      );
    }

    // Connect to database
    await connectToDatabase();
    
    // Find and delete the notification
    const result = await Notification.findOneAndDelete({
      _id: id,
      userId: session.user.id
    }).exec();
    
    if (!result) {
      return NextResponse.json(
        { error: 'Notification not found or access denied' },
        { status: 404 }
      );
    }
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json(
      { error: 'Failed to delete notification' },
      { status: 500 }
    );
  }
}