// src/utils/notificationUtils.ts
import Notification from '@/models/Notification';
import User from '@/models/User';
import Project from '@/models/Project';
import mongoose from 'mongoose';
import pusherServer, { 
  triggerUserNotification 
} from '@/libs/pusher';

/**
 * Creates a new notification and sends a real-time update via Pusher
 */
export async function createNotification(data: {
  recipientId: string;
  senderId?: string;
  type: string;
  title: string;
  message: string;
  projectId?: string;
  link?: string;
}) {
  try {
    // Convert string IDs to ObjectIds
    const notification = new Notification({
      recipientId: new mongoose.Types.ObjectId(data.recipientId),
      senderId: data.senderId ? new mongoose.Types.ObjectId(data.senderId) : undefined,
      projectId: data.projectId ? new mongoose.Types.ObjectId(data.projectId) : undefined,
      type: data.type,
      title: data.title,
      message: data.message,
      isRead: false,
      link: data.link,
      createdAt: new Date()
    });

    // Save to database
    await notification.save();

    // Get sender information if provided
    let senderInfo = null;
    if (data.senderId) {
      const sender = await User.findById(data.senderId).select('name profileImageUrl').lean();
      if (sender) {
        senderInfo = {
          id: sender._id.toString(),
          name: sender.name,
          profileImageUrl: sender.profileImageUrl
        };
      }
    }

    // Trigger real-time notification via Pusher
    await triggerUserNotification(data.recipientId, {
      id: notification._id.toString(),
      type: data.type,
      title: data.title,
      message: data.message,
      sender: senderInfo,
      link: data.link,
      createdAt: notification.createdAt
    });

    return {
      success: true,
      notification: {
        id: notification._id.toString(),
        ...data,
        createdAt: notification.createdAt
      }
    };
  } catch (error) {
    console.error('Error creating notification:', error);
    return {
      success: false,
      error: 'Failed to create notification'
    };
  }
}

/**
 * Creates project request notification (when freelancer requests to join a project)
 */
export async function createProjectRequestNotification(projectId: string, freelancerId: string) {
  try {
    // Get project and freelancer details
    const [project, freelancer] = await Promise.all([
      Project.findById(projectId).lean(),
      User.findById(freelancerId).select('name').lean()
    ]);

    if (!project || !freelancer) {
      return { success: false, error: 'Project or freelancer not found' };
    }

    // Notification to project owner
    return await createNotification({
      recipientId: project.owner.toString(),
      senderId: freelancerId,
      type: 'project_request',
      title: 'คำขอร่วมงานใหม่',
      message: `${freelancer.name} ส่งคำขอร่วมงานในโปรเจกต์ "${project.title}"`,
      projectId: projectId,
      link: `/project/${projectId}`
    });
  } catch (error) {
    console.error('Error creating project request notification:', error);
    return { success: false, error: 'Failed to create notification' };
  }
}

/**
 * Creates project invitation notification (when project owner invites a freelancer)
 */
export async function createProjectInvitationNotification(projectId: string, freelancerId: string) {
  try {
    // Get project and owner details
    const project = await Project.findById(projectId).populate('owner', 'name').lean();

    if (!project) {
      return { success: false, error: 'Project not found' };
    }

    // Notification to freelancer
    return await createNotification({
      recipientId: freelancerId,
      senderId: project.owner._id.toString(),
      type: 'project_invitation',
      title: 'คำเชิญร่วมงานใหม่',
      message: `${project.ownerName} เชิญคุณร่วมงานในโปรเจกต์ "${project.title}"`,
      projectId: projectId,
      link: `/project/${projectId}`
    });
  } catch (error) {
    console.error('Error creating project invitation notification:', error);
    return { success: false, error: 'Failed to create notification' };
  }
}

/**
 * Creates notification when a project request is accepted/rejected
 */
export async function createProjectResponseNotification(
  projectId: string, 
  freelancerId: string, 
  isAccepted: boolean
) {
  try {
    // Get project details
    const project = await Project.findById(projectId).lean();

    if (!project) {
      return { success: false, error: 'Project not found' };
    }

    // Notification to freelancer
    return await createNotification({
      recipientId: freelancerId,
      senderId: project.owner.toString(),
      type: isAccepted ? 'project_accepted' : 'project_rejected',
      title: isAccepted ? 'คำขอร่วมงานได้รับการยอมรับ' : 'คำขอร่วมงานถูกปฏิเสธ',
      message: isAccepted 
        ? `คำขอร่วมงานของคุณในโปรเจกต์ "${project.title}" ได้รับการยอมรับ`
        : `คำขอร่วมงานของคุณในโปรเจกต์ "${project.title}" ถูกปฏิเสธ`,
      projectId: projectId,
      link: isAccepted ? `/project/${projectId}` : `/project-board`
    });
  } catch (error) {
    console.error('Error creating project response notification:', error);
    return { success: false, error: 'Failed to create notification' };
  }
}

/**
 * Creates notification for project status change
 */
export async function createProjectStatusChangeNotification(
  projectId: string, 
  status: string, 
  recipientId: string,
  senderId: string
) {
  try {
    // Get project details
    const project = await Project.findById(projectId).lean();

    if (!project) {
      return { success: false, error: 'Project not found' };
    }

    // Map status to human-readable text
    const statusMap = {
      'in_progress': 'กำลังดำเนินการ',
      'revision': 'ต้องการการแก้ไข',
      'awaiting': 'รอการตรวจสอบ',
      'completed': 'เสร็จสิ้น'
    };

    const statusText = statusMap[status] || status;

    return await createNotification({
      recipientId: recipientId,
      senderId: senderId,
      type: 'project_status_change',
      title: 'มีการเปลี่ยนสถานะโปรเจกต์',
      message: `โปรเจกต์ "${project.title}" มีการเปลี่ยนสถานะเป็น "${statusText}"`,
      projectId: projectId,
      link: `/project/${projectId}`
    });
  } catch (error) {
    console.error('Error creating project status change notification:', error);
    return { success: false, error: 'Failed to create notification' };
  }
}

/**
 * Creates notification for project progress update
 */
export async function createProjectProgressUpdateNotification(
  projectId: string, 
  progress: number, 
  ownerId: string,
  freelancerId: string
) {
  try {
    // Get project details
    const project = await Project.findById(projectId).lean();

    if (!project) {
      return { success: false, error: 'Project not found' };
    }

    // Only notify owner when progress changes significantly (e.g., 10% increments)
    if (progress % 10 !== 0 && progress !== 100) {
      return { success: false, message: 'Progress update not significant enough for notification' };
    }

    return await createNotification({
      recipientId: ownerId,
      senderId: freelancerId,
      type: 'project_progress_update',
      title: 'มีการอัปเดตความคืบหน้าโปรเจกต์',
      message: `โปรเจกต์ "${project.title}" มีความคืบหน้า ${progress}%`,
      projectId: projectId,
      link: `/project/${projectId}`
    });
  } catch (error) {
    console.error('Error creating project progress update notification:', error);
    return { success: false, error: 'Failed to create notification' };
  }
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(notificationId: string) {
  try {
    await Notification.findByIdAndUpdate(notificationId, { isRead: true });
    return { success: true };
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return { success: false, error: 'Failed to mark notification as read' };
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: string) {
  try {
    await Notification.updateMany(
      { recipientId: new mongoose.Types.ObjectId(userId), isRead: false },
      { isRead: true }
    );
    return { success: true };
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return { success: false, error: 'Failed to mark all notifications as read' };
  }
}