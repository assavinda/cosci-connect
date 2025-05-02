// src/app/api/notifications/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/libs/mongodb';
import Notification from '@/models/Notification';
import mongoose from 'mongoose';
import { markAllNotificationsAsRead } from '@/utils/notificationUtils';
import { getServerSession, getUserIdFromSession } from '@/libs/auth';

// GET - Fetch user notifications
export async function GET(req: NextRequest) {
  try {
    // ใช้ getServerSession ที่สร้างเอง
    const session = await getServerSession({ req });
    const userId = getUserIdFromSession(session);
    
    if (!userId) {
      console.error('Session not found or invalid:', session);
      return NextResponse.json(
        { error: 'Unauthorized - Please login to view notifications' },
        { status: 401 }
      );
    }

    // Connect to the database
    await connectToDatabase();
    
    // Parse query parameters
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '10', 10);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const skip = (page - 1) * limit;
    const unreadOnly = url.searchParams.get('unread') === 'true';
    
    console.log(`Fetching notifications for user ${userId}, page ${page}, limit ${limit}`);
    
    // Build query
    const query: any = { 
      recipientId: new mongoose.Types.ObjectId(userId) 
    };
    
    if (unreadOnly) {
      query.isRead = false;
    }
    
    // Count total notifications for pagination
    const totalCount = await Notification.countDocuments(query);
    
    // Fetch notifications
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('senderId', 'name profileImageUrl')
      .lean()
      .exec();
    
    // Format response data
    const formattedNotifications = notifications.map(notification => ({
      id: notification._id.toString(),
      type: notification.type,
      title: notification.title,
      message: notification.message,
      sender: notification.senderId && typeof notification.senderId !== 'string' ? {
        id: notification.senderId._id.toString(),
        name: (notification.senderId as any).name,
        profileImageUrl: (notification.senderId as any).profileImageUrl
      } : null,
      projectId: notification.projectId ? notification.projectId.toString() : null,
      isRead: notification.isRead,
      link: notification.link,
      createdAt: notification.createdAt
    }));
    
    // Count unread notifications
    const unreadCount = await Notification.countDocuments({
      recipientId: new mongoose.Types.ObjectId(userId),
      isRead: false
    });
    
    console.log(`Found ${notifications.length} notifications, ${unreadCount} unread`);
    
    return NextResponse.json({
      notifications: formattedNotifications,
      pagination: {
        totalCount,
        unreadCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH - Mark notifications as read
export async function PATCH(req: NextRequest) {
  try {
    // ใช้ getServerSession ที่สร้างเอง
    const session = await getServerSession({ req });
    const userId = getUserIdFromSession(session);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - Please login to manage notifications' },
        { status: 401 }
      );
    }

    // Connect to the database
    await connectToDatabase();
    
    // Get request body
    const data = await req.json();
    
    // If notificationId is provided, mark a specific notification as read
    if (data.notificationId) {
      if (!mongoose.Types.ObjectId.isValid(data.notificationId)) {
        return NextResponse.json(
          { error: 'Invalid notification ID' },
          { status: 400 }
        );
      }
      
      // Verify the notification belongs to the user
      const notification = await Notification.findOne({
        _id: new mongoose.Types.ObjectId(data.notificationId),
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
        notificationId: data.notificationId
      });
    }
    
    // If markAll is true, mark all notifications as read
    if (data.markAll) {
      const result = await markAllNotificationsAsRead(userId);
      
      if (!result.success) {
        return NextResponse.json(
          { error: result.error || 'Failed to mark all notifications as read' },
          { status: 500 }
        );
      }
      
      return NextResponse.json({
        success: true,
        message: 'All notifications marked as read'
      });
    }
    
    return NextResponse.json(
      { error: 'Missing notificationId or markAll parameter' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a notification
export async function DELETE(req: NextRequest) {
  try {
    // ใช้ getServerSession ที่สร้างเอง
    const session = await getServerSession({ req });
    const userId = getUserIdFromSession(session);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - Please login to delete notifications' },
        { status: 401 }
      );
    }

    // Connect to the database
    await connectToDatabase();
    
    // Get notification ID from request
    const url = new URL(req.url);
    const notificationId = url.searchParams.get('id');
    
    if (!notificationId || !mongoose.Types.ObjectId.isValid(notificationId)) {
      return NextResponse.json(
        { error: 'Invalid notification ID' },
        { status: 400 }
      );
    }
    
    // Verify the notification belongs to the user
    const notification = await Notification.findOne({
      _id: new mongoose.Types.ObjectId(notificationId),
      recipientId: new mongoose.Types.ObjectId(userId)
    });
    
    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }
    
    // Delete the notification
    await Notification.findByIdAndDelete(notificationId);
    
    return NextResponse.json({
      success: true,
      message: 'Notification deleted',
      notificationId
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}