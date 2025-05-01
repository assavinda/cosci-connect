// src/libs/pusher.ts
import Pusher from 'pusher';

// ตรวจสอบว่ามีค่า environment variables ที่จำเป็นหรือไม่
if (!process.env.PUSHER_APP_ID || 
    !process.env.PUSHER_KEY || 
    !process.env.PUSHER_SECRET || 
    !process.env.PUSHER_CLUSTER) {
  throw new Error('กรุณากำหนดค่า PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET และ PUSHER_CLUSTER ใน environment variables');
}

// สร้าง Pusher instance สำหรับส่งข้อมูลจาก server
const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true,
});

export default pusherServer;

// นิยามประเภทการแจ้งเตือน
export type NotificationType = 
  | 'project_request'       // คำขอร่วมโปรเจกต์จากฟรีแลนซ์
  | 'project_invitation'    // คำเชิญทำโปรเจกต์จากเจ้าของโปรเจกต์
  | 'project_accepted'      // การยอมรับโปรเจกต์
  | 'project_rejected'      // การปฏิเสธโปรเจกต์
  | 'project_completed'     // โปรเจกต์เสร็จสิ้น
  | 'project_status_change' // การเปลี่ยนสถานะโปรเจกต์
  | 'message';              // ข้อความใหม่

// นิยามโครงสร้างข้อมูลการแจ้งเตือน
export interface INotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: string;
  data?: {
    projectId?: string;
    projectTitle?: string;
    userId?: string;
    userName?: string;
    status?: string;
  };
}

// ฟังก์ชั่นสร้าง ID เฉพาะสำหรับการแจ้งเตือน
export function generateNotificationId(): string {
  return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ฟังก์ชันส่งการแจ้งเตือนไปยังผู้ใช้เฉพาะราย
export async function sendNotificationToUser(
  userId: string, 
  notification: INotification
): Promise<boolean> {
  try {
    await pusherServer.trigger(
      `notifications-${userId}`, 
      'new-notification', 
      notification
    );
    return true;
  } catch (error) {
    console.error('Error sending notification to user:', error);
    return false;
  }
}

// ฟังก์ชันส่งการอัปเดตโปรเจกต์
export async function triggerProjectUpdate(projectId: string, project: any) {
  try {
    // ส่งข้อมูลไปยัง 'project-updates' channel และระบุ event name ที่เฉพาะเจาะจงกับโปรเจกต์นั้น
    await pusherServer.trigger('project-updates', `project-${projectId}-updated`, {
      project,
      updatedAt: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    console.error('Pusher trigger error:', error);
    return false;
  }
}

// ฟังก์ชันส่งการอัปเดตสถานะโปรเจกต์ไปยังผู้ใช้ที่เกี่ยวข้อง
export async function triggerStatusChange(
  projectId: string, 
  newStatus: string, 
  ownerId: string, 
  freelancerId?: string,
  projectTitle?: string
) {
  try {
    // ข้อมูลที่จะส่ง
    const data = {
      projectId,
      projectTitle: projectTitle || 'โปรเจกต์',
      newStatus,
      updatedAt: new Date().toISOString()
    };
    
    // ส่งข้อมูลไปยัง channel ของเจ้าของโปรเจกต์
    await pusherServer.trigger(`user-${ownerId}`, 'project-status-changed', data);
    
    // ส่งการแจ้งเตือนไปยังเจ้าของโปรเจกต์
    const ownerNotification: INotification = {
      id: generateNotificationId(),
      type: 'project_status_change',
      title: `สถานะโปรเจกต์เปลี่ยนเป็น ${newStatus}`,
      message: `โปรเจกต์ "${projectTitle || 'โปรเจกต์'}" มีการเปลี่ยนสถานะเป็น ${newStatus}`,
      createdAt: new Date().toISOString(),
      data: {
        projectId,
        projectTitle,
        status: newStatus
      }
    };
    
    await sendNotificationToUser(ownerId, ownerNotification);
    
    // ส่งข้อมูลไปยัง channel ของฟรีแลนซ์ถ้ามี
    if (freelancerId) {
      await pusherServer.trigger(`user-${freelancerId}`, 'project-status-changed', data);
      
      // ส่งการแจ้งเตือนไปยังฟรีแลนซ์
      const freelancerNotification: INotification = {
        id: generateNotificationId(),
        type: 'project_status_change',
        title: `สถานะโปรเจกต์เปลี่ยนเป็น ${newStatus}`,
        message: `โปรเจกต์ "${projectTitle || 'โปรเจกต์'}" มีการเปลี่ยนสถานะเป็น ${newStatus}`,
        createdAt: new Date().toISOString(),
        data: {
          projectId,
          projectTitle,
          status: newStatus
        }
      };
      
      await sendNotificationToUser(freelancerId, freelancerNotification);
    }
    
    // ส่งข้อมูลให้ทุกคนที่กำลังดูโปรเจกต์นี้อยู่
    await pusherServer.trigger('project-updates', `project-${projectId}-status-changed`, data);
    
    return true;
  } catch (error) {
    console.error('Pusher trigger error:', error);
    return false;
  }
}

// ฟังก์ชันส่งการอัปเดตข้อมูลฟรีแลนซ์
export async function triggerFreelancerUpdate(freelancerId: string, freelancerData: any) {
  try {
    await pusherServer.trigger('freelancer-updates', `freelancer-${freelancerId}-updated`, {
      freelancer: freelancerData,
      updatedAt: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    console.error('Pusher trigger error:', error);
    return false;
  }
}

// ฟังก์ชันส่งการอัปเดตรายการโปรเจกต์ทั้งหมด
export async function triggerProjectListUpdate() {
  try {
    await pusherServer.trigger('project-updates', 'project-list-updated', {
      updatedAt: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    console.error('Pusher trigger error:', error);
    return false;
  }
}

// ฟังก์ชันส่งการอัปเดตรายการฟรีแลนซ์ทั้งหมด
export async function triggerFreelancerListUpdate() {
  try {
    await pusherServer.trigger('freelancer-updates', 'freelancer-list-updated', {
      updatedAt: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    console.error('Pusher trigger error:', error);
    return false;
  }
}

// ฟังก์ชันส่งการแจ้งเตือนคำขอร่วมงานโปรเจกต์ (จากฟรีแลนซ์ถึงเจ้าของโปรเจกต์)
export async function sendProjectRequestNotification(
  ownerId: string, 
  projectId: string, 
  projectTitle: string,
  freelancerId: string,
  freelancerName: string
) {
  try {
    // สร้างข้อมูลคำขอ
    const requestData = {
      projectId,
      projectTitle,
      freelancerId,
      freelancerName,
      timestamp: new Date().toISOString()
    };
    
    // ส่งการแจ้งเตือนคำขอไปยังเจ้าของโปรเจกต์
    await pusherServer.trigger(`user-${ownerId}`, 'project-request', requestData);
    
    // สร้างการแจ้งเตือนสำหรับเจ้าของโปรเจกต์
    const notification: INotification = {
      id: generateNotificationId(),
      type: 'project_request',
      title: 'คำขอร่วมงานใหม่',
      message: `${freelancerName || 'ฟรีแลนซ์'} ต้องการร่วมงานในโปรเจกต์ "${projectTitle || 'โปรเจกต์'}"`,
      createdAt: new Date().toISOString(),
      data: {
        projectId,
        projectTitle,
        userId: freelancerId,
        userName: freelancerName
      }
    };
    
    // ส่งการแจ้งเตือนไปยังเจ้าของโปรเจกต์
    await sendNotificationToUser(ownerId, notification);
    
    // แจ้งทุกคนที่กำลังดูรายการโปรเจกต์ว่ามีคำขอใหม่
    await pusherServer.trigger('project-updates', 'project-request-new', {
      ...requestData,
      projectOwnerId: ownerId
    });
    
    return true;
  } catch (error) {
    console.error('Error sending project request notification:', error);
    return false;
  }
}

// ฟังก์ชันส่งการแจ้งเตือนคำเชิญร่วมงานโปรเจกต์ (จากเจ้าของโปรเจกต์ถึงฟรีแลนซ์)
export async function sendProjectInvitationNotification(
  freelancerId: string, 
  projectId: string, 
  projectTitle: string,
  ownerId: string,
  ownerName: string
) {
  try {
    // สร้างข้อมูลคำเชิญ
    const invitationData = {
      projectId,
      projectTitle,
      ownerId,
      ownerName,
      timestamp: new Date().toISOString()
    };
    
    // ส่งการแจ้งเตือนคำเชิญไปยังฟรีแลนซ์
    await pusherServer.trigger(`user-${freelancerId}`, 'project-invitation', invitationData);
    
    // สร้างการแจ้งเตือนสำหรับฟรีแลนซ์
    const notification: INotification = {
      id: generateNotificationId(),
      type: 'project_invitation',
      title: 'คำเชิญทำงานใหม่',
      message: `${ownerName || 'เจ้าของโปรเจกต์'} เชิญคุณร่วมทำโปรเจกต์ "${projectTitle || 'โปรเจกต์'}"`,
      createdAt: new Date().toISOString(),
      data: {
        projectId,
        projectTitle,
        userId: ownerId,
        userName: ownerName
      }
    };
    
    // ส่งการแจ้งเตือนไปยังฟรีแลนซ์
    await sendNotificationToUser(freelancerId, notification);
    
    // แจ้งทุกคนที่กำลังดูรายการโปรเจกต์ว่ามีคำเชิญใหม่
    await pusherServer.trigger('project-updates', 'project-invitation-new', {
      ...invitationData,
      freelancerId
    });
    
    return true;
  } catch (error) {
    console.error('Error sending project invitation notification:', error);
    return false;
  }
}