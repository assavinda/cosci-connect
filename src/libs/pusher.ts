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
export async function triggerStatusChange(projectId: string, newStatus: string, ownerId: string, freelancerId?: string) {
  try {
    // ข้อมูลที่จะส่ง
    const data = {
      projectId,
      newStatus,
      updatedAt: new Date().toISOString()
    };
    
    // ส่งข้อมูลไปยัง channel ของเจ้าของโปรเจกต์
    await pusherServer.trigger(`user-${ownerId}`, 'project-status-changed', data);
    
    // ส่งข้อมูลไปยัง channel ของฟรีแลนซ์ถ้ามี
    if (freelancerId) {
      await pusherServer.trigger(`user-${freelancerId}`, 'project-status-changed', data);
    }
    
    // ส่งข้อมูลให้ทุกคนที่กำลังดูโปรเจกต์นี้อยู่
    await pusherServer.trigger('project-updates', `project-${projectId}-status-changed`, data);
    
    return true;
  } catch (error) {
    console.error('Pusher trigger error:', error);
    return false;
  }
}

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

// เพิ่มฟังก์ชัน: ส่งการแจ้งเตือนถึงผู้ใช้โดยตรง
export async function triggerUserNotification(userId: string, notification: any) {
  try {
    // ส่งการแจ้งเตือนไปยัง channel ของผู้ใช้คนนั้น
    await pusherServer.trigger(`notifications-${userId}`, 'new-notification', {
      notification,
      timestamp: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    console.error('Pusher notification error:', error);
    return false;
  }
}

// เพิ่มฟังก์ชันสำหรับส่งการแจ้งเตือนระบบ (เช่น การบำรุงรักษา)
export async function triggerSystemNotification(message: string, link?: string) {
  try {
    // ส่งการแจ้งเตือนไปยัง channel ทั้งหมด
    await pusherServer.trigger('system-notifications', 'system-message', {
      message,
      link,
      timestamp: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    console.error('Pusher system notification error:', error);
    return false;
  }
}

// เพิ่มฟังก์ชันใหม่: ส่งข้อความแชทแบบเรียลไทม์
export async function triggerChatMessage(senderId: string, receiverId: string, message: any) {
  try {
    // ส่งข้อความไปยังผู้รับ
    await pusherServer.trigger(`chat-${receiverId}`, 'new-message', {
      message,
      senderId,
      timestamp: new Date().toISOString()
    });
    
    // อัปเดตรายการแชทของผู้รับ
    await pusherServer.trigger(`user-${receiverId}`, 'chat-list-updated', {
      sender: {
        id: senderId,
        ...message.sender
      },
      lastMessage: message.content,
      timestamp: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    console.error('Pusher chat message error:', error);
    return false;
  }
}

// เพิ่มฟังก์ชันใหม่: อัปเดตสถานะการอ่านข้อความ
export async function triggerMessageRead(senderId: string, receiverId: string) {
  try {
    // แจ้งผู้ส่งว่าข้อความถูกอ่านแล้ว
    await pusherServer.trigger(`chat-${senderId}`, 'messages-read', {
      by: receiverId,
      timestamp: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    console.error('Pusher message read error:', error);
    return false;
  }
}