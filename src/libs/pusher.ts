// src/libs/pusher.ts
import Pusher from 'pusher';
import {
  sendNotificationToUser,
  sendProjectStatusNotification,
  sendProjectRequestNotification,
  sendProjectInvitationNotification
} from './notification-helpers';

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
export async function triggerStatusChange(
  projectId: string, 
  newStatus: string, 
  ownerId: string, 
  freelancerId?: string,
  projectTitle?: string
) {
  try {
    // ใช้ฟังก์ชันใหม่ที่บันทึกการแจ้งเตือนลงฐานข้อมูล
    await sendProjectStatusNotification(
      projectId,
      newStatus,
      ownerId,
      freelancerId,
      projectTitle
    );
    
    return true;
  } catch (error) {
    console.error('Status change notification error:', error);
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