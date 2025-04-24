// src/app/api/users/check-student-id/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/libs/mongodb';
import User from '@/models/User';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const studentId = url.searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      );
    }

    // เชื่อมต่อกับฐานข้อมูล
    await connectToDatabase();

    // ตรวจสอบว่ารหัสนิสิตมีในระบบหรือไม่
    const user = await User.findOne({ studentId }).exec();
    
    // ส่งผลลัพธ์การตรวจสอบ (มี/ไม่มี)
    return NextResponse.json({ 
      exists: !!user 
    });
  } catch (error) {
    console.error('Error checking student ID:', error);
    return NextResponse.json(
      { error: 'Something went wrong while checking student ID' },
      { status: 500 }
    );
  }
}