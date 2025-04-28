// src/app/api/projects/[id]/applications/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectToDatabase from '@/libs/mongodb';
import Application from '@/models/Application';
import Project from '@/models/Project';
import User from '@/models/User';
import mongoose from 'mongoose';

// POST - Create a new application
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession();
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'กรุณาเข้าสู่ระบบก่อนสมัครงาน' },
        { status: 401 }
      );
    }

    // Get project ID from params
    const projectId = params.id;
    
    // Validate the ID format
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return NextResponse.json(
        { error: 'รูปแบบ ID โปรเจกต์ไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectToDatabase();
    
    // Get the current user
    const user = await User.findOne({ email: session.user.email }).exec();
    
    if (!user) {
      return NextResponse.json(
        { error: 'ไม่พบข้อมูลผู้ใช้' },
        { status: 404 }
      );
    }
    
    // Check if user is a student (freelancer)
    if (user.role !== 'student') {
      return NextResponse.json(
        { error: 'เฉพาะนิสิตเท่านั้นที่สามารถสมัครงานได้' },
        { status: 403 }
      );
    }
    
    // Check if user's status is open
    if (user.isOpen === false) {
      return NextResponse.json(
        { error: 'คุณได้ตั้งค่าสถานะเป็นไม่พร้อมรับงาน กรุณาเปลี่ยนสถานะในหน้าโปรไฟล์' },
        { status: 400 }
      );
    }
    
    // Get the project
    const project = await Project.findById(projectId).exec();
    
    if (!project) {
      return NextResponse.json(
        { error: 'ไม่พบโปรเจกต์' },
        { status: 404 }
      );
    }
    
    // Check if project is open for applications
    if (project.status !== 'open') {
      return NextResponse.json(
        { error: 'โปรเจกต์นี้ไม่ได้เปิดรับสมัครแล้ว' },
        { status: 400 }
      );
    }
    
    // Check if user is not the project owner
    if (project.owner.toString() === user._id.toString()) {
      return NextResponse.json(
        { error: 'คุณไม่สามารถสมัครงานของตัวเองได้' },
        { status: 400 }
      );
    }
    
    // Check if user has already applied
    const existingApplication = await Application.findOne({
      projectId: project._id,
      freelancerId: user._id
    }).exec();
    
    if (existingApplication) {
      return NextResponse.json(
        { error: 'คุณได้สมัครงานนี้ไปแล้ว' },
        { status: 400 }
      );
    }
    
    // Check if user has matching skills
    const userSkills = user.skills || [];
    const requiredSkills = project.requiredSkills || [];
    
    const hasMatchingSkills = requiredSkills.some(skill => 
      userSkills.includes(skill)
    );
    
    if (!hasMatchingSkills) {
      return NextResponse.json(
        { error: 'คุณไม่มีทักษะที่ตรงกับที่โปรเจกต์ต้องการ' },
        { status: 400 }
      );
    }
    
    // Check if project budget meets user's base price
    if (project.budget < (user.basePrice || 0)) {
      return NextResponse.json(
        { error: `งบประมาณของโปรเจกต์ต่ำกว่าราคาขั้นต่ำของคุณ (${user.basePrice} บาท)` },
        { status: 400 }
      );
    }
    
    // Get application data from request
    const data = await req.json();
    const { message } = data;
    
    if (!message || message.trim() === '') {
      return NextResponse.json(
        { error: 'กรุณากรอกข้อความถึงเจ้าของโปรเจกต์' },
        { status: 400 }
      );
    }
    
    // Create new application
    const application = new Application({
      projectId: project._id,
      projectTitle: project.title,
      freelancerId: user._id,
      freelancerName: user.name,
      ownerId: project.owner,
      ownerName: project.ownerName,
      message: message,
      status: 'pending',
      createdAt: new Date()
    });
    
    // Save application
    await application.save();
    
    // Update project's applicants
    await Project.updateOne(
      { _id: project._id },
      { 
        $addToSet: { 
          applicants: user._id,
          applicantNames: user.name
        } 
      }
    );
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: 'ส่งคำขอร่วมงานเรียบร้อยแล้ว',
      application: {
        id: application._id.toString(),
        projectId: application.projectId.toString(),
        projectTitle: application.projectTitle,
        freelancerId: application.freelancerId.toString(),
        freelancerName: application.freelancerName,
        status: application.status,
        createdAt: application.createdAt
      }
    });
  } catch (error) {
    console.error('Error creating application:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการส่งคำขอร่วมงาน' },
      { status: 500 }
    );
  }
}

// DELETE - Cancel an application
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession();
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      );
    }

    // Get project ID from params
    const projectId = params.id;
    
    // Validate the ID format
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return NextResponse.json(
        { error: 'รูปแบบ ID โปรเจกต์ไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectToDatabase();
    
    // Get the current user
    const user = await User.findOne({ email: session.user.email }).exec();
    
    if (!user) {
      return NextResponse.json(
        { error: 'ไม่พบข้อมูลผู้ใช้' },
        { status: 404 }
      );
    }
    
    // Find the application
    const application = await Application.findOne({
      projectId: new mongoose.Types.ObjectId(projectId),
      freelancerId: user._id
    }).exec();
    
    if (!application) {
      return NextResponse.json(
        { error: 'ไม่พบคำขอร่วมงานของคุณสำหรับโปรเจกต์นี้' },
        { status: 404 }
      );
    }
    
    // Check if user is the applicant
    if (application.freelancerId.toString() !== user._id.toString()) {
      return NextResponse.json(
        { error: 'คุณไม่มีสิทธิ์ยกเลิกคำขอร่วมงานนี้' },
        { status: 403 }
      );
    }
    
    // Check if application can be canceled (only pending applications can be canceled)
    if (application.status !== 'pending') {
      return NextResponse.json(
        { error: 'ไม่สามารถยกเลิกคำขอร่วมงานที่ได้รับการตอบรับหรือปฏิเสธแล้ว' },
        { status: 400 }
      );
    }
    
    // Delete the application
    await Application.deleteOne({ _id: application._id });
    
    // Update project's applicants list
    await Project.updateOne(
      { _id: new mongoose.Types.ObjectId(projectId) },
      { 
        $pull: { 
          applicants: user._id,
          applicantNames: user.name
        } 
      }
    );
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: 'ยกเลิกคำขอร่วมงานเรียบร้อยแล้ว'
    });
  } catch (error) {
    console.error('Error canceling application:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการยกเลิกคำขอร่วมงาน' },
      { status: 500 }
    );
  }
}