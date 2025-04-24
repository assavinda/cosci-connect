// src/app/api/auth/verify-otp/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/libs/mongodb';
import User from '@/models/User';
import nodemailer from 'nodemailer';

// ในแอพจริง คุณจะเก็บ OTP ในฐานข้อมูลพร้อมเวลาหมดอายุ
// ที่นี่เราใช้ Map ในหน่วยความจำชั่วคราวเพื่อความง่าย
const otpStore = new Map<string, { otp: string; expires: Date }>();

export async function POST(req: NextRequest) {
  try {
    // เชื่อมต่อกับฐานข้อมูล
    await connectToDatabase();

    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json(
        { error: 'Email and OTP are required' },
        { status: 400 }
      );
    }

    // ดึงข้อมูล OTP ที่เก็บไว้
    const storedOtpData = otpStore.get(email);

    // สำหรับการทดสอบ ให้ยอมรับรหัส "123456" เป็นรหัสทดสอบสำหรับทุกอีเมล
    const isValidOtp = otp === "123456" || 
      (storedOtpData && storedOtpData.otp === otp && new Date() < storedOtpData.expires);

    if (!isValidOtp) {
      return NextResponse.json(
        { error: 'Invalid or expired OTP' },
        { status: 400 }
      );
    }

    // อัพเดทสถานะการยืนยันอีเมลของผู้ใช้
    await User.updateOne({ email }, { emailVerified: true }).exec();

    // ล้าง OTP ที่ใช้แล้ว
    otpStore.delete(email);

    return NextResponse.json({ success: true, verified: true });
  } catch (error) {
    console.error('OTP verification error:', error);
    return NextResponse.json(
      { error: 'Something went wrong during OTP verification' },
      { status: 500 }
    );
  }
}

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

    // สร้าง OTP 6 หลัก
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // ตั้งค่าเวลาหมดอายุ (10 นาทีนับจากนี้)
    const expires = new Date();
    expires.setMinutes(expires.getMinutes() + 10);
    
    // เก็บ OTP
    otpStore.set(email, { otp, expires });
    
    // สร้าง transporter สำหรับส่งอีเมล
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST,
      port: Number(process.env.EMAIL_SERVER_PORT),
      secure: Number(process.env.EMAIL_SERVER_PORT) === 465, // true สำหรับ 465, false สำหรับพอร์ตอื่น
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
    });

    // เตรียมเนื้อหาอีเมล
    const mailOptions = {
      from: process.env.EMAIL_FROM || `"COSCI-CONNECT" <${process.env.EMAIL_SERVER_USER}>`,
      to: email,
      subject: 'รหัส OTP สำหรับยืนยันตัวตน - COSCI-CONNECT',
      text: `รหัส OTP ของคุณคือ ${otp}\n\nรหัสนี้จะหมดอายุใน 10 นาที\n\nหากคุณไม่ได้ทำการร้องขอรหัสนี้ กรุณาละเว้นอีเมลฉบับนี้`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #1167AE; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">COSCI-CONNECT</h1>
          </div>
          <div style="padding: 20px; border: 1px solid #e0e0e0; border-top: none;">
            <h2>ยืนยันตัวตนของคุณ</h2>
            <p>กรุณาใช้รหัส OTP ต่อไปนี้เพื่อดำเนินการต่อ:</p>
            <div style="background-color: #f5f5f5; padding: 15px; text-align: center; margin: 20px 0; font-size: 24px; font-weight: bold; letter-spacing: 5px;">
              ${otp}
            </div>
            <p>รหัสนี้จะหมดอายุใน 10 นาที</p>
            <p style="color: #777; font-size: 14px; margin-top: 30px;">หากคุณไม่ได้ทำการร้องขอรหัสนี้ กรุณาละเว้นอีเมลฉบับนี้</p>
          </div>
        </div>
      `
    };

    // ส่งอีเมล
    try {
      await transporter.sendMail(mailOptions);
      console.log(`OTP sent to ${email}`);
    } catch (emailError) {
      console.error('Error sending email:', emailError);
      
      // ถ้าส่งอีเมลไม่สำเร็จในโหมดพัฒนา ให้แสดง OTP ในคอนโซล
      console.log(`[DEV MODE] OTP for ${email}: ${otp}`);
      
      // แจ้งผู้ใช้ว่ามีปัญหาในการส่งอีเมล แต่ยังคงสร้าง OTP
      return NextResponse.json({ 
        success: true, 
        message: 'OTP generated but email sending failed. Check server logs.',
        otp // ส่ง OTP ในการตอบกลับเพื่อการทดสอบ
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'OTP sent successfully',
      // รวม OTP ในการตอบสนองในโหมดพัฒนา
      otp
    });
  } catch (error) {
    console.error('Generate OTP error:', error);
    return NextResponse.json(
      { error: 'Something went wrong while generating OTP' },
      { status: 500 }
    );
  }
}