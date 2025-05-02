// src/libs/notification-helpers.ts
import Notification from '@/models/Notification';
import { NotificationType } from '@/models/Notification';
import connectToDatabase from '@/libs/mongodb';
import pusherServer from '@/libs/pusher';
import mongoose from 'mongoose';

// Function to generate notification ID for client-side before DB save
export function generateNotificationId(): string {
  return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Function to create a new notification in the database
export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  data?: {
    projectId?: string;
    projectTitle?: string;
    userId?: string;
    userName?: string;
    status?: string;
  }
): Promise<any> {
  try {
    // Ensure database connection
    await connectToDatabase();
    
    // Create notification object
    const notification = new Notification({
      userId: new mongoose.Types.ObjectId(userId),
      type,
      title,
      message,
      isRead: false,
      data: data || {}
    });
    
    // Save to database
    await notification.save();
    
    // Prepare notification data for client
    const notificationData = {
      id: notification._id.toString(),
      type: notification.type,
      title: notification.title,
      message: notification.message,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
      data: notification.data
    };
    
    // Trigger real-time notification via Pusher
    await pusherServer.trigger(
      `notifications-${userId}`,
      'new-notification',
      notificationData
    );
    
    // Return the created notification data
    return notificationData;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

// Function to send a notification to a user
export async function sendNotificationToUser(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  data?: {
    projectId?: string;
    projectTitle?: string;
    userId?: string;
    userName?: string;
    status?: string;
  }
): Promise<boolean> {
  try {
    await createNotification(userId, type, title, message, data);
    return true;
  } catch (error) {
    console.error('Error sending notification to user:', error);
    return false;
  }
}

// Function to send project status change notification
export async function sendProjectStatusNotification(
  projectId: string,
  newStatus: string,
  ownerId: string,
  freelancerId?: string,
  projectTitle?: string
): Promise<boolean> {
  try {
    // Create status change message
    let title = 'สถานะโปรเจกต์เปลี่ยนแปลง';
    let message = `โปรเจกต์ "${projectTitle || 'โปรเจกต์'}" มีการเปลี่ยนสถานะเป็น ${newStatus}`;
    
    // Customize based on status
    switch (newStatus) {
      case 'in_progress':
        title = 'เริ่มทำโปรเจกต์แล้ว';
        message = `โปรเจกต์ "${projectTitle || 'โปรเจกต์'}" ได้เริ่มดำเนินการแล้ว`;
        break;
      case 'awaiting':
        title = 'โปรเจกต์รอการตรวจสอบ';
        message = `ฟรีแลนซ์ส่งงานโปรเจกต์ "${projectTitle || 'โปรเจกต์'}" เพื่อรอการตรวจสอบ`;
        break;
      case 'revision':
        title = 'โปรเจกต์ต้องได้รับการแก้ไข';
        message = `โปรเจกต์ "${projectTitle || 'โปรเจกต์'}" ต้องได้รับการแก้ไข`;
        break;
      case 'completed':
        title = 'โปรเจกต์เสร็จสิ้น';
        message = `โปรเจกต์ "${projectTitle || 'โปรเจกต์'}" เสร็จสมบูรณ์แล้ว`;
        break;
    }
    
    // Common notification data
    const notificationData = {
      projectId,
      projectTitle,
      status: newStatus
    };
    
    // Send notification to project owner
    await sendNotificationToUser(ownerId, 'project_status_change', title, message, notificationData);
    
    // Send to freelancer if provided
    if (freelancerId) {
      await sendNotificationToUser(freelancerId, 'project_status_change', title, message, notificationData);
    }
    
    // Also trigger Pusher event for real-time updates
    await pusherServer.trigger('project-updates', `project-${projectId}-status-changed`, {
      projectId,
      projectTitle,
      newStatus,
      updatedAt: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    console.error('Error sending project status notification:', error);
    return false;
  }
}

// Function to send project request notification (freelancer to owner)
export async function sendProjectRequestNotification(
  ownerId: string,
  projectId: string,
  projectTitle: string,
  freelancerId: string,
  freelancerName: string
): Promise<boolean> {
  try {
    // Create notification title and message
    const title = 'คำขอร่วมงานใหม่';
    const message = `${freelancerName || 'ฟรีแลนซ์'} ต้องการร่วมงานในโปรเจกต์ "${projectTitle || 'โปรเจกต์'}"`;
    
    // Notification data
    const notificationData = {
      projectId,
      projectTitle,
      userId: freelancerId,
      userName: freelancerName
    };
    
    // Send notification to project owner
    await sendNotificationToUser(ownerId, 'project_request', title, message, notificationData);
    
    // Trigger Pusher event for real-time updates
    await pusherServer.trigger(`user-${ownerId}`, 'project-request', {
      projectId,
      projectTitle,
      freelancerId,
      freelancerName,
      timestamp: new Date().toISOString()
    });
    
    // Notify all clients about new request
    await pusherServer.trigger('project-updates', 'project-request-new', {
      projectId,
      projectTitle,
      freelancerId,
      freelancerName,
      projectOwnerId: ownerId,
      timestamp: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    console.error('Error sending project request notification:', error);
    return false;
  }
}

// Function to send project invitation notification (owner to freelancer)
export async function sendProjectInvitationNotification(
  freelancerId: string,
  projectId: string,
  projectTitle: string,
  ownerId: string,
  ownerName: string
): Promise<boolean> {
  try {
    // Create notification title and message
    const title = 'คำเชิญทำงานใหม่';
    const message = `${ownerName || 'เจ้าของโปรเจกต์'} เชิญคุณร่วมทำโปรเจกต์ "${projectTitle || 'โปรเจกต์'}"`;
    
    // Notification data
    const notificationData = {
      projectId,
      projectTitle,
      userId: ownerId,
      userName: ownerName
    };
    
    // Send notification to freelancer
    await sendNotificationToUser(freelancerId, 'project_invitation', title, message, notificationData);
    
    // Trigger Pusher event for real-time updates
    await pusherServer.trigger(`user-${freelancerId}`, 'project-invitation', {
      projectId,
      projectTitle,
      ownerId,
      ownerName,
      timestamp: new Date().toISOString()
    });
    
    // Notify all clients about new invitation
    await pusherServer.trigger('project-updates', 'project-invitation-new', {
      projectId,
      projectTitle,
      ownerId,
      ownerName,
      freelancerId,
      timestamp: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    console.error('Error sending project invitation notification:', error);
    return false;
  }
}

// Function to get unread notification count for a user
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  try {
    // Ensure database connection
    await connectToDatabase();
    
    // Count unread notifications
    const count = await Notification.countDocuments({
      userId: new mongoose.Types.ObjectId(userId),
      isRead: false
    });
    
    return count;
  } catch (error) {
    console.error('Error fetching unread notification count:', error);
    return 0;
  }
}

// Function to mark notification as read
export async function markNotificationAsRead(userId: string, notificationId: string): Promise<boolean> {
  try {
    // Ensure database connection
    await connectToDatabase();
    
    // Update notification
    const result = await Notification.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(notificationId),
        userId: new mongoose.Types.ObjectId(userId)
      },
      { $set: { isRead: true } }
    );
    
    return !!result;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
}

// Function to mark all notifications as read
export async function markAllNotificationsAsRead(userId: string): Promise<number> {
  try {
    // Ensure database connection
    await connectToDatabase();
    
    // Update all unread notifications
    const result = await Notification.updateMany(
      {
        userId: new mongoose.Types.ObjectId(userId),
        isRead: false
      },
      { $set: { isRead: true } }
    );
    
    return result.modifiedCount;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return 0;
  }
}