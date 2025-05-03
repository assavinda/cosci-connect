// src/app/api/messages/unread/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectToDatabase from '@/libs/mongodb';
import Message from '@/models/Message';
import User from '@/models/User';

// GET - ดึงจำนวนข้อความที่ยังไม่ได้อ่าน
export async function GET(req: NextRequest) {
  try {
    // ตรวจสอบการล็อกอิน
    const session = await getServerSession();
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'ไม่ได้รับอนุญาต - กรุณาเข้าสู่ระบบเพื่อดูข้อความแชท' },
        { status: 401 }
      );
    }

    // เชื่อมต่อฐานข้อมูล
    await connectToDatabase();
    
    // ค้นหาข้อมูลผู้ใช้
    const user = await User.findOne({ email: session.user.email }).exec();
    
    if (!user) {
      return NextResponse.json(
        { error: 'ไม่พบข้อมูลผู้ใช้' },
        { status: 404 }
      );
    }
    
    // นับจำนวนข้อความที่ยังไม่ได้อ่าน
    const unreadCount = await Message.countDocuments({
      receiverId: user._id,
      isRead: false
    });
    
    return NextResponse.json({
      unreadCount
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการนับจำนวนข้อความที่ยังไม่ได้อ่าน' },
      { status: 500 }
    );
  }
}