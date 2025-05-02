// src/app/api/notifications/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectToDatabase from '@/libs/mongodb';
import Notification from '@/models/Notification';
import mongoose from 'mongoose';

// GET - Retrieve user notifications with pagination
export async function GET(req: NextRequest) {
  try {
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
    
    // Get query parameters
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '30', 10);
    const unreadOnly = url.searchParams.get('unreadOnly') === 'true';
    
    // Calculate skip value
    const skip = (page - 1) * limit;
    
    // Create query
    const query: any = { 
      userId: new mongoose.Types.ObjectId(session.user.id) 
    };
    
    // Add unread filter if requested
    if (unreadOnly) {
      query.isRead = false;
    }
    
    // Get total count for pagination
    const totalCount = await Notification.countDocuments(query);
    
    // Get notifications with pagination
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 }) // Most recent first
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();
    
    // Map to response format
    const mappedNotifications = notifications.map(notification => ({
      id: notification._id.toString(),
      type: notification.type,
      title: notification.title,
      message: notification.message,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
      data: notification.data
    }));
    
    // Get unread count
    const unreadCount = await Notification.countDocuments({
      userId: new mongoose.Types.ObjectId(session.user.id),
      isRead: false
    });
    
    // Return the response with pagination info
    return NextResponse.json({
      notifications: mappedNotifications,
      totalCount,
      unreadCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit)
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// POST - Create a new notification
export async function POST(req: NextRequest) {
  try {
    // Get the authenticated user (for authorization)
    const session = await getServerSession();
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Please login to create notifications' },
        { status: 401 }
      );
    }

    // Connect to database
    await connectToDatabase();
    
    // Get notification data from request
    const data = await req.json();
    
    // Validate required fields
    if (!data.userId || !data.type || !data.title || !data.message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Basic security check - can only create notifications for yourself
    // or with special admin permission (could be added later)
    if (data.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Permission denied - Cannot create notifications for other users' },
        { status: 403 }
      );
    }
    
    // Create the notification
    const notification = new Notification({
      userId: new mongoose.Types.ObjectId(data.userId),
      type: data.type,
      title: data.title,
      message: data.message,
      isRead: data.isRead || false,
      data: data.data || {}
    });
    
    // Save the notification
    await notification.save();
    
    // Return the created notification
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
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}

// PATCH - Mark all notifications as read
export async function PATCH(req: NextRequest) {
  try {
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
    
    // Get data from request
    const data = await req.json();
    
    // Check if it's a bulk operation
    const markAllAsRead = data.markAllAsRead === true;
    
    if (markAllAsRead) {
      // Mark all notifications as read
      const result = await Notification.updateMany(
        { userId: new mongoose.Types.ObjectId(session.user.id), isRead: false },
        { $set: { isRead: true } }
      );
      
      return NextResponse.json({
        success: true,
        message: `Marked ${result.modifiedCount} notifications as read`
      });
    } else if (data.id) {
      // Mark a single notification as read
      const notification = await Notification.findOneAndUpdate(
        { 
          _id: new mongoose.Types.ObjectId(data.id),
          userId: new mongoose.Types.ObjectId(session.user.id)
        },
        { $set: { isRead: true } },
        { new: true }
      );
      
      if (!notification) {
        return NextResponse.json(
          { error: 'Notification not found or access denied' },
          { status: 404 }
        );
      }
      
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
    } else {
      return NextResponse.json(
        { error: 'Invalid request - specify either markAllAsRead or id' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error updating notifications:', error);
    return NextResponse.json(
      { error: 'Failed to update notifications' },
      { status: 500 }
    );
  }
}

// DELETE - Delete notifications
export async function DELETE(req: NextRequest) {
  try {
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
    
    // Get URL parameters
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    const clearAll = url.searchParams.get('clearAll') === 'true';
    
    if (clearAll) {
      // Delete all notifications for this user
      const result = await Notification.deleteMany({
        userId: new mongoose.Types.ObjectId(session.user.id)
      });
      
      return NextResponse.json({
        success: true,
        message: `Deleted ${result.deletedCount} notifications`
      });
    } else if (id) {
      // Delete a single notification
      const result = await Notification.findOneAndDelete({
        _id: new mongoose.Types.ObjectId(id),
        userId: new mongoose.Types.ObjectId(session.user.id)
      });
      
      if (!result) {
        return NextResponse.json(
          { error: 'Notification not found or access denied' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        success: true,
        message: 'Notification deleted successfully'
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid request - specify either clearAll or id' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error deleting notifications:', error);
    return NextResponse.json(
      { error: 'Failed to delete notifications' },
      { status: 500 }
    );
  }
}