// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/libs/mongodb';
import User from '@/models/User';
import { uploadToCloudinary } from '@/libs/cloudinary';
import mongoose from 'mongoose';

export async function POST(req: NextRequest) {
  try {
    // Connect to the database
    await connectToDatabase();

    // Parse the request body
    const formData = await req.formData();
    
    const email = formData.get('email') as string;
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const name = `${firstName} ${lastName}`;
    const role = formData.get('role') as 'student' | 'alumni' | 'teacher';
    const major = formData.get('major') as string;
    const bio = formData.get('bio') as string || '';
    
    if (!email || !firstName || !lastName || !role || !major) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email }).exec();
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // สร้างอ็อบเจกต์ข้อมูลผู้ใช้พื้นฐาน
    const userData: any = {
      name,
      firstName,
      lastName,
      email,
      role,
      major,
      bio,
      emailVerified: true, // Set to true since we verify via OTP
    };

    // เพิ่มข้อมูลเฉพาะสำหรับนิสิตเท่านั้น
    if (role === 'student') {
      // รับค่า studentId
      const studentId = formData.get('studentId') as string;
      if (!studentId) {
        return NextResponse.json(
          { error: 'Student ID is required for students' },
          { status: 400 }
        );
      }
      
      // ตรวจสอบว่ารหัสนิสิตไม่ซ้ำ
      const existingStudentId = await User.findOne({ studentId }).exec();
      if (existingStudentId) {
        return NextResponse.json(
          { error: 'Student ID is already registered' },
          { status: 400 }
        );
      }
      
      userData.studentId = studentId;
      
      // รับค่า basePrice
      const basePriceStr = formData.get('basePrice') as string;
      if (basePriceStr) {
        const basePrice = parseInt(basePriceStr, 10);
        userData.basePrice = !isNaN(basePrice) && basePrice >= 100 ? basePrice : 500;
      } else {
        userData.basePrice = 500; // ค่าเริ่มต้น
      }
      
      // รับค่า isOpen
      const isOpenStr = formData.get('isOpen') as string;
      userData.isOpen = isOpenStr !== 'false'; // ค่าเริ่มต้นเป็น true
      
      // รับค่า skills
      const skillsString = formData.get('skills') as string;
      if (skillsString) {
        try {
          userData.skills = JSON.parse(skillsString);
          if (!Array.isArray(userData.skills)) {
            userData.skills = []; // ถ้าไม่ใช่ array ให้ใช้ array ว่าง
          }
        } catch (e) {
          userData.skills = [];
        }
      } else {
        userData.skills = [];
      }
    }

    console.log("Creating user with data:", userData);

    // สร้างผู้ใช้ใหม่
    const user = new User(userData);
    await user.save();
    
    // Get the user ID from the saved user
    const userId = user._id.toString();

    // Handle profile image upload if provided
    const profileImage = formData.get('profileImage') as File | null;
    if (profileImage) {
      // Convert the file to a buffer and then to base64
      const bytes = await profileImage.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64Image = `data:${profileImage.type};base64,${buffer.toString('base64')}`;
      
      // Upload to Cloudinary
      const profileImageUrl = await uploadToCloudinary(base64Image, userId, 'profileImage');
      
      // Update the user with the profile image URL
      user.profileImageUrl = profileImageUrl;
    }

    // เพิ่มไฟล์เฉพาะสำหรับนิสิตเท่านั้น
    if (role === 'student') {
      // Handle portfolio upload if provided
      const portfolio = formData.get('portfolio') as File | null;
      if (portfolio) {
        // Convert the file to a buffer and then to base64
        const bytes = await portfolio.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64File = `data:${portfolio.type};base64,${buffer.toString('base64')}`;
        
        // Upload to Cloudinary
        const portfolioUrl = await uploadToCloudinary(base64File, userId, 'portfolio');
        
        // Update the user with the portfolio URL
        user.portfolioUrl = portfolioUrl;
      }

      // Handle gallery images upload if provided
      const galleryImages: string[] = [];
      
      // Process up to 6 gallery images
      for (let i = 0; i < 6; i++) {
        const galleryImage = formData.get(`galleryImage${i}`) as File | null;
        
        if (galleryImage) {
          // Convert the file to a buffer and then to base64
          const bytes = await galleryImage.arrayBuffer();
          const buffer = Buffer.from(bytes);
          const base64Image = `data:${galleryImage.type};base64,${buffer.toString('base64')}`;
          
          // Upload to Cloudinary with a unique subfolder for gallery images
          const galleryImageUrl = await uploadToCloudinary(
            base64Image, 
            userId, 
            'profileImage', // Use the same folder but with a unique public_id
            `gallery_${Date.now()}_${i}` // Create a unique ID for each image
          );
          
          galleryImages.push(galleryImageUrl);
        }
      }
      
      if (galleryImages.length > 0) {
        user.galleryImages = galleryImages;
      }
    }

    // Save the updated user if files were uploaded
    if (profileImage || (role === 'student' && (formData.get('portfolio') || formData.get('galleryImage0')))) {
      await user.save();
    }

    // สร้างข้อมูลสำหรับการตอบกลับโดยส่งข้อมูลเฉพาะตามบทบาท
    const responseData: any = {
      success: true, 
      user: {
        id: userId,
        name,
        email,
        role,
        profileImageUrl: user.profileImageUrl
      } 
    };
    
    // เพิ่มข้อมูลสำหรับนิสิตเท่านั้น
    if (role === 'student') {
      responseData.user.isOpen = user.isOpen;
      responseData.user.basePrice = user.basePrice;
      responseData.user.galleryImages = user.galleryImages;
    }

    return NextResponse.json(responseData, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    
    // Check if it's a MongoDB duplicate key error
    if (error instanceof mongoose.Error.ValidationError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.message },
        { status: 400 }
      );
    }
    
    // ส่งข้อความผิดพลาดที่ชัดเจน
    const errorMessage = error instanceof Error ? error.message : 'Something went wrong during registration';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}