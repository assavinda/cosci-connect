// src/app/api/customers/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/libs/mongodb';
import User from '@/models/User';
import mongoose from 'mongoose';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // รับไอดีผู้ใช้จากพารามิเตอร์ของเส้นทาง
    const { id } =  await params;
    
    // ตรวจสอบรูปแบบไอดี
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'รูปแบบไอดีผู้ใช้ไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    // เชื่อมต่อกับฐานข้อมูล
    await connectToDatabase();
    
    // ค้นหาผู้ใช้ตามไอดี
    const user = await User.findById(id).lean().exec();
    
    if (!user) {
      return NextResponse.json(
        { error: 'ไม่พบผู้ใช้' },
        { status: 404 }
      );
    }
    
    // ตรวจสอบว่าผู้ใช้เป็นอาจารย์หรือศิษย์เก่า (ลูกค้า)
    if (user.role !== 'teacher' && user.role !== 'alumni') {
      return NextResponse.json(
        { error: 'ผู้ใช้นี้ไม่ใช่ลูกค้า (อาจารย์หรือศิษย์เก่า)' },
        { status: 400 }
      );
    }
    
    // เตรียมข้อมูลผู้ใช้สำหรับส่งกลับ (ตัดข้อมูลส่วนตัวที่ไม่ควรเปิดเผยออก)
    const customerData = {
      id: user._id.toString(),
      name: user.name,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      major: user.major,
      bio: user.bio || '',
      profileImageUrl: user.profileImageUrl,
      // เพิ่มข้อมูลอื่นๆ ที่ต้องการให้แสดงในหน้าโปรไฟล์ลูกค้า
    };
    
    return NextResponse.json(customerData);
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการดึงข้อมูลลูกค้า:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลลูกค้า' },
      { status: 500 }
    );
  }
}