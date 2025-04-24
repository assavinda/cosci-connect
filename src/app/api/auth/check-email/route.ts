// src/app/api/users/check-email/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/libs/mongodb';
import User from '@/models/User';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const email = url.searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // เชื่อมต่อกับฐานข้อมูล
    await connectToDatabase();

    // ตรวจสอบว่าอีเมลมีในระบบหรือไม่
    const user = await User.findOne({ email }).exec();
    
    // ส่งผลลัพธ์การตรวจสอบ (มี/ไม่มี)
    return NextResponse.json({ 
      exists: !!user 
    });
  } catch (error) {
    console.error('Error checking email:', error);
    return NextResponse.json(
      { error: 'Something went wrong while checking email' },
      { status: 500 }
    );
  }
}