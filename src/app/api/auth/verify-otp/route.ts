// src/app/api/auth/verify-otp/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/libs/mongodb';
import User from '@/models/User';

// In a real app, you'd store OTPs in a database with expiration times
// Here we'll use a temporary in-memory store for simplicity
// IMPORTANT: In production, use a proper database or Redis for this
const otpStore = new Map<string, { otp: string; expires: Date }>();

export async function POST(req: NextRequest) {
  try {
    // Connect to the database
    await connectToDatabase();

    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json(
        { error: 'Email and OTP are required' },
        { status: 400 }
      );
    }

    // Retrieve stored OTP data
    const storedOtpData = otpStore.get(email);

    // For demo purposes, let's accept "123456" as a valid OTP for any email
    // In a real application, you should check against the actual stored OTP
    const isValidOtp = otp === "123456" || 
      (storedOtpData && storedOtpData.otp === otp && new Date() < storedOtpData.expires);

    if (!isValidOtp) {
      return NextResponse.json(
        { error: 'Invalid or expired OTP' },
        { status: 400 }
      );
    }

    // Update user's email verification status - use updateOne with exec()
    await User.updateOne({ email }, { emailVerified: true }).exec();

    // Clean up the OTP store
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

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set expiration time (10 minutes from now)
    const expires = new Date();
    expires.setMinutes(expires.getMinutes() + 10);
    
    // Store OTP
    otpStore.set(email, { otp, expires });
    
    // In a real application, you would send the OTP via email
    // For our demo, we'll just return it in the response (NEVER do this in production)
    console.log(`OTP for ${email}: ${otp}`);

    return NextResponse.json({ 
      success: true, 
      message: 'OTP sent successfully',
      // Include the OTP in the response ONLY FOR DEVELOPMENT
      ...(process.env.NODE_ENV === 'development' && { otp })
    });
  } catch (error) {
    console.error('Generate OTP error:', error);
    return NextResponse.json(
      { error: 'Something went wrong while generating OTP' },
      { status: 500 }
    );
  }
}