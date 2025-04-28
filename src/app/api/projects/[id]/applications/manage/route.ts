// src/app/api/projects/[id]/applications/manage/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectToDatabase from '@/libs/mongodb';
import Application from '@/models/Application';
import Project from '@/models/Project';
import User from '@/models/User';
import mongoose from 'mongoose';

// GET - List all applications for a project
export async function GET(
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
    
    // Get the project
    const project = await Project.findById(projectId).exec();
    
    if (!project) {
      return NextResponse.json(
        { error: 'ไม่พบโปรเจกต์' },
        { status: 404 }
      );
    }
    
    // Check if user is the project owner
    if (project.owner.toString() !== user._id.toString()) {
      return NextResponse.json(
        { error: 'คุณไม่มีสิทธิ์ดูข้อมูลการสมัครงานของโปรเจกต์นี้' },
        { status: 403 }
      );
    }
    
    // Get all applications for this project
    const applications = await Application.find({
      projectId: project._id
    })
    .sort({ createdAt: -1 })
    .lean()
    .exec();
    
    // Map applications to clean format
    const mappedApplications = applications.map(app => ({
      id: app._id.toString(),
      projectId: app.projectId.toString(),
      projectTitle: app.projectTitle,
      freelancerId: app.freelancerId.toString(),
      freelancerName: app.freelancerName,
      message: app.message,
      status: app.status,
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
      respondedAt: app.respondedAt
    }));
    
    // Return applications
    return NextResponse.json({
      applications: mappedApplications,
      totalCount: mappedApplications.length
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลการสมัครงาน' },
      { status: 500 }
    );
  }
}

// PATCH - Accept or reject an application
export async function PATCH(
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

    // Get request data
    const data = await req.json();
    const { applicationId, status } = data;
    
    if (!applicationId || !status) {
      return NextResponse.json(
        { error: 'กรุณาระบุ ID การสมัครงานและสถานะ' },
        { status: 400 }
      );
    }
    
    // Validate application ID format
    if (!mongoose.Types.ObjectId.isValid(applicationId)) {
      return NextResponse.json(
        { error: 'รูปแบบ ID การสมัครงานไม่ถูกต้อง' },
        { status: 400 }
      );
    }
    
    // Validate status
    if (status !== 'accepted' && status !== 'rejected') {
      return NextResponse.json(
        { error: 'สถานะไม่ถูกต้อง ต้องเป็น accepted หรือ rejected เท่านั้น' },
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
    
    // Get the project
    const project = await Project.findById(projectId).exec();
    
    if (!project) {
      return NextResponse.json(
        { error: 'ไม่พบโปรเจกต์' },
        { status: 404 }
      );
    }
    
    // Check if user is the project owner
    if (project.owner.toString() !== user._id.toString()) {
      return NextResponse.json(
        { error: 'คุณไม่มีสิทธิ์จัดการการสมัครงานของโปรเจกต์นี้' },
        { status: 403 }
      );
    }
    
    // Check if project is still open
    if (project.status !== 'open') {
      return NextResponse.json(
        { error: 'โปรเจกต์นี้ไม่ได้เปิดรับสมัครแล้ว' },
        { status: 400 }
      );
    }
    
    // Get the application
    const application = await Application.findById(applicationId).exec();
    
    if (!application) {
      return NextResponse.json(
        { error: 'ไม่พบข้อมูลการสมัครงาน' },
        { status: 404 }
      );
    }
    
    // Check if application belongs to this project
    if (application.projectId.toString() !== project._id.toString()) {
      return NextResponse.json(
        { error: 'การสมัครงานนี้ไม่ได้อยู่ในโปรเจกต์นี้' },
        { status: 400 }
      );
    }
    
    // Check if application is pending
    if (application.status !== 'pending') {
      return NextResponse.json(
        { error: 'การสมัครงานนี้ได้รับการตอบรับหรือปฏิเสธไปแล้ว' },
        { status: 400 }
      );
    }
    
    // Start a database transaction
    const session_db = await mongoose.startSession();
    session_db.startTransaction();
    
    try {
      // If accepting the application
      if (status === 'accepted') {
        // Update project status and assign the freelancer
        await Project.updateOne(
          { _id: project._id },
          {
            status: 'assigned',
            assignedTo: application.freelancerId,
            assignedFreelancerName: application.freelancerName,
            updatedAt: new Date()
          },
          { session: session_db }
        );
        
        // Reject all other pending applications for this project
        await Application.updateMany(
          { 
            projectId: project._id, 
            _id: { $ne: application._id },
            status: 'pending'
          },
          {
            status: 'rejected',
            respondedAt: new Date(),
            updatedAt: new Date()
          },
          { session: session_db }
        );
      }
      
      // Update the application status
      await Application.updateOne(
        { _id: application._id },
        {
          status: status,
          respondedAt: new Date(),
          updatedAt: new Date()
        },
        { session: session_db }
      );
      
      // Commit the transaction
      await session_db.commitTransaction();
    } catch (error) {
      // Abort transaction on error
      await session_db.abortTransaction();
      throw error;
    } finally {
      // End the session
      session_db.endSession();
    }
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: status === 'accepted' ? 
        `ยอมรับการสมัครงานของ ${application.freelancerName} เรียบร้อยแล้ว` : 
        `ปฏิเสธการสมัครงานของ ${application.freelancerName} เรียบร้อยแล้ว`,
      applicationStatus: status
    });
  } catch (error) {
    console.error('Error managing application:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการจัดการการสมัครงาน' },
      { status: 500 }
    );
  }
}