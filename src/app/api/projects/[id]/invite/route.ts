// src/app/api/projects/[id]/invite/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectToDatabase from '@/libs/mongodb';
import Project from '@/models/Project';
import User from '@/models/User';
import Invitation from '@/models/Invitation';
import mongoose from 'mongoose';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // ตรวจสอบการล็อกอิน
    const session = await getServerSession();
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'กรุณาเข้าสู่ระบบก่อนเชิญฟรีแลนซ์' },
        { status: 401 }
      );
    }

    // รับ ID โปรเจกต์จาก URL parameter
    const projectId = params.id;
    
    // ตรวจสอบรูปแบบของ ID
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return NextResponse.json(
        { error: 'รูปแบบ ID โปรเจกต์ไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    // รับข้อมูลฟรีแลนซ์จาก request body
    const data = await req.json();
    const { freelancerId, freelancerName } = data;
    
    if (!freelancerId || !freelancerName) {
      return NextResponse.json(
        { error: 'ข้อมูลฟรีแลนซ์ไม่ครบถ้วน' },
        { status: 400 }
      );
    }
    
    // ตรวจสอบรูปแบบของ ID ฟรีแลนซ์
    if (!mongoose.Types.ObjectId.isValid(freelancerId)) {
      return NextResponse.json(
        { error: 'รูปแบบ ID ฟรีแลนซ์ไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    // เชื่อมต่อกับฐานข้อมูล
    await connectToDatabase();

    // ดึงข้อมูลผู้ใช้ปัจจุบัน
    const user = await User.findOne({ email: session.user.email }).exec();
    
    if (!user) {
      return NextResponse.json(
        { error: 'ไม่พบข้อมูลผู้ใช้' },
        { status: 404 }
      );
    }

    // ตรวจสอบว่าเป็นอาจารย์หรือศิษย์เก่า
    if (user.role !== 'teacher' && user.role !== 'alumni') {
      return NextResponse.json(
        { error: 'คุณไม่มีสิทธิ์ในการเชิญฟรีแลนซ์' },
        { status: 403 }
      );
    }

    // ดึงข้อมูลโปรเจกต์
    const project = await Project.findById(projectId).exec();
    
    if (!project) {
      return NextResponse.json(
        { error: 'ไม่พบโปรเจกต์' },
        { status: 404 }
      );
    }

    // ตรวจสอบว่าเป็นเจ้าของโปรเจกต์
    if (project.owner.toString() !== user._id.toString()) {
      return NextResponse.json(
        { error: 'คุณไม่ใช่เจ้าของโปรเจกต์นี้' },
        { status: 403 }
      );
    }

    // ตรวจสอบสถานะโปรเจกต์
    if (project.status !== 'open') {
      return NextResponse.json(
        { error: 'โปรเจกต์นี้ไม่ได้อยู่ในสถานะเปิดรับสมัคร' },
        { status: 400 }
      );
    }

    // ดึงข้อมูลฟรีแลนซ์
    const freelancer = await User.findById(freelancerId).exec();
    
    if (!freelancer) {
      return NextResponse.json(
        { error: 'ไม่พบข้อมูลฟรีแลนซ์' },
        { status: 404 }
      );
    }

    // ตรวจสอบว่าฟรีแลนซ์เป็นนิสิต
    if (freelancer.role !== 'student') {
      return NextResponse.json(
        { error: 'ผู้ใช้นี้ไม่ใช่ฟรีแลนซ์' },
        { status: 400 }
      );
    }

    // ตรวจสอบสถานะการรับงานของฟรีแลนซ์
    if (freelancer.isOpen === false) {
      return NextResponse.json(
        { error: 'ฟรีแลนซ์ไม่พร้อมรับงานในขณะนี้' },
        { status: 400 }
      );
    }

    // ตรวจสอบราคาโปรเจกต์กับราคาขั้นต่ำของฟรีแลนซ์
    if (project.budget < freelancer.basePrice) {
      return NextResponse.json(
        { error: `งบประมาณโปรเจกต์ต่ำกว่าราคาขั้นต่ำของฟรีแลนซ์ (${freelancer.basePrice} บาท)` },
        { status: 400 }
      );
    }

    // ตรวจสอบว่าทักษะตรงกันอย่างน้อย 1 ทักษะ
    const matchingSkills = project.requiredSkills.filter(skill => 
      freelancer.skills.includes(skill)
    );
    
    if (matchingSkills.length === 0) {
      return NextResponse.json(
        { error: 'ทักษะของฟรีแลนซ์ไม่ตรงกับทักษะที่ต้องการของโปรเจกต์' },
        { status: 400 }
      );
    }

    // ตรวจสอบว่ามีคำเชิญอยู่แล้วหรือไม่โดยตรวจสอบจากตาราง Invitation
    const existingInvitation = await Invitation.findOne({
      projectId: project._id,
      freelancerId: freelancer._id
    }).exec();
    
    if (existingInvitation) {
      return NextResponse.json(
        { error: 'คุณได้เชิญฟรีแลนซ์คนนี้ไปแล้ว' },
        { status: 400 }
      );
    }

    // สร้างคำเชิญใหม่
    const invitation = new Invitation({
      projectId: project._id,
      projectTitle: project.title,
      freelancerId: freelancer._id,
      freelancerName: freelancer.name,
      ownerId: user._id,
      ownerName: user.name,
      status: 'pending',
      createdAt: new Date()
    });
    
    // บันทึกคำเชิญลงฐานข้อมูล
    await invitation.save();

    // ส่ง response กลับไป
    return NextResponse.json({
      success: true,
      message: `ส่งคำขอให้ ${freelancerName} เรียบร้อยแล้ว`,
      invitation: {
        id: invitation._id,
        projectId: invitation.projectId,
        projectTitle: invitation.projectTitle,
        freelancerId: invitation.freelancerId,
        freelancerName: invitation.freelancerName,
        status: invitation.status,
        createdAt: invitation.createdAt
      }
    });
  } catch (error) {
    console.error('Error inviting freelancer:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในระบบ' },
      { status: 500 }
    );
  }
}

// GET endpoint สำหรับดึงรายการคำเชิญทั้งหมดของโปรเจกต์
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // ตรวจสอบการล็อกอิน
    const session = await getServerSession();
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      );
    }
    
    // รับ ID โปรเจกต์จาก URL parameter
    const projectId = params.id;
    
    // ตรวจสอบรูปแบบของ ID
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return NextResponse.json(
        { error: 'รูปแบบ ID โปรเจกต์ไม่ถูกต้อง' },
        { status: 400 }
      );
    }
    
    // เชื่อมต่อกับฐานข้อมูล
    await connectToDatabase();
    
    // ดึงข้อมูลผู้ใช้ปัจจุบัน
    const user = await User.findOne({ email: session.user.email }).exec();
    
    if (!user) {
      return NextResponse.json(
        { error: 'ไม่พบข้อมูลผู้ใช้' },
        { status: 404 }
      );
    }
    
    // ดึงข้อมูลโปรเจกต์
    const project = await Project.findById(projectId).exec();
    
    if (!project) {
      return NextResponse.json(
        { error: 'ไม่พบโปรเจกต์' },
        { status: 404 }
      );
    }
    
    // ตรวจสอบว่าเป็นเจ้าของโปรเจกต์หรือเป็นฟรีแลนซ์ที่ได้รับเชิญ (ตรวจสอบจากตาราง Invitation)
    const isOwner = project.owner.toString() === user._id.toString();
    
    // ตรวจสอบว่าเป็นฟรีแลนซ์ที่ได้รับเชิญจากตาราง Invitation
    const invitationExists = await Invitation.findOne({
      projectId: project._id,
      freelancerId: user._id
    }).exec();
    
    const isInvitedFreelancer = !!invitationExists;
    
    if (!isOwner && !isInvitedFreelancer) {
      return NextResponse.json(
        { error: 'คุณไม่มีสิทธิ์ดูข้อมูลคำเชิญของโปรเจกต์นี้' },
        { status: 403 }
      );
    }
    
    // ดึงข้อมูลคำเชิญจากตาราง Invitation
    let invitations;
    
    if (isOwner) {
      // เจ้าของโปรเจกต์สามารถดูคำเชิญทั้งหมดของโปรเจกต์ได้
      invitations = await Invitation.find({ projectId: project._id }).sort({ createdAt: -1 }).exec();
    } else {
      // ฟรีแลนซ์สามารถดูคำเชิญของตัวเองเท่านั้น
      invitations = await Invitation.find({ 
        projectId: project._id,
        freelancerId: user._id
      }).sort({ createdAt: -1 }).exec();
    }
    
    // แปลงข้อมูลเป็นรูปแบบที่ต้องการส่งกลับ
    const formattedInvitations = invitations.map(invitation => ({
      id: invitation._id,
      projectId: invitation.projectId,
      projectTitle: invitation.projectTitle,
      freelancerId: invitation.freelancerId,
      freelancerName: invitation.freelancerName,
      ownerId: invitation.ownerId,
      ownerName: invitation.ownerName,
      status: invitation.status,
      createdAt: invitation.createdAt,
      updatedAt: invitation.updatedAt,
      respondedAt: invitation.respondedAt
    }));
    
    return NextResponse.json({
      invitations: formattedInvitations,
      totalCount: formattedInvitations.length,
      isOwner
    });
  } catch (error) {
    console.error('Error fetching invitations:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในระบบ' },
      { status: 500 }
    );
  }
}