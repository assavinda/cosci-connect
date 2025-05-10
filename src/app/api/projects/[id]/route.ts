// src/app/api/projects/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectToDatabase from '@/libs/mongodb';
import Project from '@/models/Project';
import User from '@/models/User';
import mongoose from 'mongoose';
import pusherServer, { 
  triggerProjectUpdate, 
  triggerStatusChange,
  triggerProjectListUpdate
} from '@/libs/pusher';
import {
  createProjectRequestNotification,
  createProjectInvitationNotification,
  createProjectResponseNotification,
  createProjectStatusChangeNotification,
  createProjectProgressUpdateNotification,
  createFreelancerResponseNotification,
  notifyRejectedFreelancers
} from '@/utils/notificationUtils';
// GET - Retrieve a specific project by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get project ID from route params
    const { id } =  await params;
    
    // Validate the ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid project ID format' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectToDatabase();
    
    // Find project by ID
    const project = await Project.findById(id).lean().exec();
    
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }
    
    // Map to response object
    const projectData = {
      id: project._id.toString(),
      title: project.title,
      description: project.description,
      budget: project.budget,
      deadline: project.deadline,
      requiredSkills: project.requiredSkills || [],
      owner: project.owner.toString(),
      ownerName: project.ownerName,
      status: project.status,
      progress: project.progress || 0,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      completedAt: project.completedAt,
      assignedTo: project.assignedTo ? project.assignedTo.toString() : null,
      requestToFreelancer: project.requestToFreelancer ? project.requestToFreelancer.toString() : null,
      freelancersRequested: project.freelancersRequested ? project.freelancersRequested.map(id => id.toString()) : []
    };
    
    return NextResponse.json(projectData);
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project details' },
      { status: 500 }
    );
  }
}

// PATCH - Update a project by ID
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get authenticated user
    const session = await getServerSession();
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized - Please login to update a project' },
        { status: 401 }
      );
    }
    
    // Get project ID from route params
    const { id } =  await params;
    
    // Validate the ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid project ID format' },
        { status: 400 }
      );
    }
    
    // Connect to database
    await connectToDatabase();
    
    // Get the current user
    const user = await User.findOne({ email: session.user.email }).exec();
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Find the project
    const project = await Project.findById(id).exec();
    
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

     // Get update data from request
     const data = await req.json();
     console.log("Update request data:", data);
    
    // Check if user has permission to update the project
    const isOwner = project.owner.toString() === user._id.toString();
    const isAssignedFreelancer = project.assignedTo && project.assignedTo.toString() === user._id.toString();
    const isRequestedFreelancer = project.requestToFreelancer && 
                                project.requestToFreelancer.toString() === user._id.toString();
    const isAppliedFreelancer = project.freelancersRequested.some(
      freelancerId => freelancerId.toString() === user._id.toString()
    );

    // ตรวจสอบว่าเป็นการส่งคำขอร่วมงานจากฟรีแลนซ์หรือไม่
    const isApplyingToProject = data.applyToProject === true && user.role === 'student';

    // ต้องเป็นเจ้าของโปรเจกต์หรือฟรีแลนซ์ที่เกี่ยวข้อง หรือเป็นการสมัครเข้าร่วมโปรเจกต์ใหม่
    if (!isOwner && !isAssignedFreelancer && !isRequestedFreelancer && !isAppliedFreelancer && !isApplyingToProject) {
      return NextResponse.json(
        { error: 'Permission denied - You do not have permission to update this project' },
        { status: 403 }
      );
    }
    
    const updateData: any = {};
    let oldStatus = project.status;
    let statusChanged = false;
    
    // ===== เจ้าของโปรเจกต์สามารถอัปเดตได้ =====
    if (isOwner) {
      // Basic project information
      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.budget !== undefined) updateData.budget = parseInt(data.budget, 10);
      if (data.deadline !== undefined) updateData.deadline = new Date(data.deadline);
      if (data.requiredSkills !== undefined) updateData.requiredSkills = data.requiredSkills;
      
      // Project flow control by owner
      // แก้ไขไฟล์ src/app/api/projects/[id]/route.ts
// ในส่วนที่เจ้าของโปรเจกต์เปลี่ยนสถานะเป็น 'revision'

    // ในส่วนที่ดูแลการเปลี่ยนสถานะโปรเจกต์โดยเจ้าของโปรเจกต์
    if (data.status !== undefined) {
      // Owner can change status with some restrictions
      const currentStatus = project.status;
      const newStatus = data.status;
      
      const validTransitions: Record<string, string[]> = {
        'open': ['in_progress', 'completed'],
        'in_progress': ['revision', 'awaiting', 'completed'],
        'revision': ['in_progress', 'awaiting', 'completed'],
        'awaiting': ['completed', 'revision']
      };
      
      if (!validTransitions[currentStatus]?.includes(newStatus)) {
        return NextResponse.json(
          { error: `Cannot change status from ${currentStatus} to ${newStatus}` },
          { status: 400 }
        );
      }
      
      updateData.status = newStatus;
      statusChanged = true;
      
      // เพิ่มโค้ดตรงนี้: รีเซ็ตค่า progress เป็น 0 เมื่อเปลี่ยนสถานะเป็น 'revision'
      if (newStatus === 'revision') {
        updateData.progress = 0;
      }
      
      // If project is completed, set completedAt
      if (newStatus === 'completed' && !project.completedAt) {
        updateData.completedAt = new Date();
      }
      
      // สร้างการแจ้งเตือนเมื่อมีการเปลี่ยนสถานะโปรเจกต์
      try {
        if (project.assignedTo) {
          await createProjectStatusChangeNotification(
            id, 
            newStatus, 
            project.assignedTo.toString(),
            user._id.toString()
          );
        }
      } catch (notificationError) {
        console.error('Error creating status change notification:', notificationError);
      }
    }
      
      // เจ้าของโปรเจกต์กำหนดฟรีแลนซ์โดยตรง (เช่น การยอมรับคำขอจากฟรีแลนซ์)
      if (data.assignedTo && mongoose.Types.ObjectId.isValid(data.assignedTo)) {
        // ตรวจสอบว่าโปรเจกต์เปิดรับสมัครอยู่หรือไม่
        if (project.status !== 'open') {
          return NextResponse.json(
            { error: 'Cannot assign freelancer: project is not open' },
            { status: 400 }
          );
        }
        
        // ตรวจสอบว่าฟรีแลนซ์มีอยู่จริงและเป็น student
        const freelancer = await User.findById(data.assignedTo).exec();
        if (!freelancer) {
          return NextResponse.json(
            { error: 'Freelancer not found' },
            { status: 404 }
          );
        }
        
        if (freelancer.role !== 'student') {
          return NextResponse.json(
            { error: 'Only students can be assigned to projects' },
            { status: 400 }
          );
        }

        // เก็บรายชื่อฟรีแลนซ์ทั้งหมดที่เคยส่งคำขอไว้ก่อนที่จะล้างคำขอทั้งหมด
        const allFreelancerRequests = [...project.freelancersRequested.map(id => id.toString())];
        
        // อัปเดตโปรเจกต์
        updateData.assignedTo = new mongoose.Types.ObjectId(data.assignedTo);
        updateData.status = 'in_progress';  // เปลี่ยนเป็น 'in_progress'
        statusChanged = true;
        
        // ล้างคำขอทั้งหมด
        updateData.requestToFreelancer = null;
        updateData.freelancersRequested = [];
        
        // สร้างการแจ้งเตือนเมื่อยอมรับฟรีแลนซ์เข้าทำงาน
        try {
          await createProjectResponseNotification(id, data.assignedTo, true);
          await notifyRejectedFreelancers(id, data.assignedTo, allFreelancerRequests);
        } catch (notificationError) {
          console.error('Error creating project accepted notification:', notificationError);
          // ไม่ต้องหยุดการทำงานหลักหากการสร้างการแจ้งเตือนล้มเหลว
        }
      }
      
      // Handle freelancer request
      if (data.requestToFreelancer !== undefined) {
        // If null, remove the request
        if (data.requestToFreelancer === null) {
          updateData.requestToFreelancer = null;
        } 
        // If there's a new request, validate and set it
        else if (mongoose.Types.ObjectId.isValid(data.requestToFreelancer)) {
          // Ensure project is open
          if (project.status !== 'open') {
            return NextResponse.json(
              { error: 'Cannot send request to freelancer: project is not open' },
              { status: 400 }
            );
          }
          
          // Verify freelancer exists and is a student
          const freelancer = await User.findById(data.requestToFreelancer).exec();
          if (!freelancer) {
            return NextResponse.json(
              { error: 'Freelancer not found' },
              { status: 404 }
            );
          }
          
          if (freelancer.role !== 'student') {
            return NextResponse.json(
              { error: 'Can only send requests to student freelancers' },
              { status: 400 }
            );
          }
          
          updateData.requestToFreelancer = new mongoose.Types.ObjectId(data.requestToFreelancer);
          
          // สร้างการแจ้งเตือนเมื่อส่งคำขอไปยังฟรีแลนซ์
          try {
            await createProjectInvitationNotification(id, data.requestToFreelancer);
          } catch (notificationError) {
            console.error('Error creating project invitation notification:', notificationError);
            // ไม่ต้องหยุดการทำงานหลักหากการสร้างการแจ้งเตือนล้มเหลว
          }
        } else {
          return NextResponse.json(
            { error: 'Invalid freelancer ID format' },
            { status: 400 }
          );
        }
      }
      
      // ลบฟรีแลนซ์ออกจาก freelancersRequested (การปฏิเสธคำขอ)
      if (data.action === 'removeFreelancerRequest' && data.freelancerId) {
        // ตรวจสอบรูปแบบ ID
        if (!mongoose.Types.ObjectId.isValid(data.freelancerId)) {
          return NextResponse.json(
            { error: 'Invalid freelancer ID format' },
            { status: 400 }
          );
        }
        
        // ตรวจสอบว่าฟรีแลนซ์อยู่ในรายการคำขอจริงหรือไม่
        const freelancerIdObj = new mongoose.Types.ObjectId(data.freelancerId);
        const isInRequestList = project.freelancersRequested.some(id => id.equals(freelancerIdObj));
        
        if (!isInRequestList) {
          return NextResponse.json(
            { error: 'Freelancer is not in the request list' },
            { status: 400 }
          );
        }
        
        // ลบฟรีแลนซ์ออกจากรายการคำขอ
        await Project.updateOne(
          { _id: id },
          { $pull: { freelancersRequested: freelancerIdObj } }
        );
        
        // สร้างการแจ้งเตือนเมื่อปฏิเสธคำขอของฟรีแลนซ์
        try {
          await createProjectResponseNotification(id, data.freelancerId, false);
        } catch (notificationError) {
          console.error('Error creating project rejected notification:', notificationError);
          // ไม่ต้องหยุดการทำงานหลักหากการสร้างการแจ้งเตือนล้มเหลว
        }
        
        // หลังจากอัปเดตสำเร็จแล้ว ดึงโปรเจกต์ที่อัปเดตมาแล้วและส่งกลับ
        const updatedProject = await Project.findById(id).lean();
        
        const responseData = {
          success: true,
          message: 'Freelancer removed from request list',
          project: {
            ...updatedProject,
            id: updatedProject._id.toString(),
            owner: updatedProject.owner.toString(),
            assignedTo: updatedProject.assignedTo ? updatedProject.assignedTo.toString() : null,
            requestToFreelancer: updatedProject.requestToFreelancer ? updatedProject.requestToFreelancer.toString() : null,
            freelancersRequested: updatedProject.freelancersRequested.map(id => id.toString())
          }
        };
        
        // ส่งการอัปเดตแบบเรียลไทม์
        await triggerProjectUpdate(id, responseData.project);
        await triggerProjectListUpdate();
        
        // ถ้าไม่มีการอัปเดตอื่น ให้ส่งผลลัพธ์กลับเลย
        if (Object.keys(updateData).length === 0) {
          return NextResponse.json(responseData);
        }
      }
    }
    
    // ===== ฟรีแลนซ์ที่ได้รับการกำหนดให้ทำงานแล้วสามารถอัปเดตได้ =====
    if (isAssignedFreelancer) {
      // Update progress (restricted to freelancer and within 0-100)
      if (data.progress !== undefined) {
        const progress = parseInt(data.progress, 10);
        if (isNaN(progress) || progress < 0 || progress > 100) {
          return NextResponse.json(
            { error: 'Progress must be a number between 0 and 100' },
            { status: 400 }
          );
        }
        updateData.progress = progress;
        
        // สร้างการแจ้งเตือนเมื่อมีการอัปเดตความคืบหน้าที่สำคัญ
        try {
          // ส่งการแจ้งเตือนเฉพาะเมื่อความคืบหน้าเป็นเลขหลักสิบหรือ 100%
          if (progress) {
            await createProjectProgressUpdateNotification(
              id,
              progress,
              project.owner.toString(),
              user._id.toString()
            );
          }
        } catch (notificationError) {
          console.error('Error creating progress update notification:', notificationError);
          // ไม่ต้องหยุดการทำงานหลักหากการสร้างการแจ้งเตือนล้มเหลว
        }
      }
      
      // ฟรีแลนซ์ที่ได้รับมอบหมายงานแล้วสามารถเปลี่ยนสถานะได้
      if (data.status !== undefined) {
        const currentStatus = project.status;
        const newStatus = data.status;
        
        const validFreelancerTransitions: Record<string, string[]> = {
          'in_progress': ['awaiting'],
          'revision': ['awaiting']
        };
        
        if (!validFreelancerTransitions[currentStatus]?.includes(newStatus)) {
          return NextResponse.json(
            { error: `Freelancer cannot change status from ${currentStatus} to ${newStatus}` },
            { status: 400 }
          );
        }
        
        updateData.status = newStatus;
        statusChanged = true;
        
        // สร้างการแจ้งเตือนเมื่อฟรีแลนซ์เปลี่ยนสถานะโปรเจกต์
        try {
          await createProjectStatusChangeNotification(
            id, 
            newStatus, 
            project.owner.toString(),
            user._id.toString()
          );
        } catch (notificationError) {
          console.error('Error creating status change notification:', notificationError);
          // ไม่ต้องหยุดการทำงานหลักหากการสร้างการแจ้งเตือนล้มเหลว
        }
      }
    }
    
    // ===== ฟรีแลนซ์ที่ได้รับคำขอสามารถตอบรับหรือปฏิเสธได้ =====
    if (isRequestedFreelancer) {
      // ฟรีแลนซ์ตอบรับคำขอจากเจ้าของโปรเจกต์
      if (data.status === 'in_progress') {
        // ตรวจสอบว่าโปรเจกต์ยังเปิดรับอยู่หรือไม่
        if (project.status !== 'open') {
          return NextResponse.json(
            { error: 'Cannot accept request: project is not open' },
            { status: 400 }
          );
        }
        
        // อัปเดตสถานะโปรเจกต์เป็น in_progress
        updateData.status = 'in_progress';
        statusChanged = true;
        updateData.assignedTo = user._id;
        updateData.requestToFreelancer = null;
        updateData.freelancersRequested = [];
        
        try {
          // แจ้งเตือนเจ้าของโปรเจกต์ว่าฟรีแลนซ์ยอมรับคำขอแล้ว
          await createFreelancerResponseNotification(
            id,
            user._id.toString(),
            true // ตอบรับคำขอ
          );
          
          // ลบการเรียกใช้ createProjectStatusChangeNotification ตรงนี้
          // ไม่ต้องแจ้งเตือนเมื่อสถานะโปรเจกต์เปลี่ยน
        } catch (notificationError) {
          console.error('Error creating freelancer response notification:', notificationError);
          // ไม่ต้องหยุดการทำงานหลักหากการสร้างการแจ้งเตือนล้มเหลว
        }
      }
      
      // ฟรีแลนซ์ปฏิเสธคำขอจากเจ้าของโปรเจกต์
      if (data.requestToFreelancer === null || (data.action === 'rejectProject' && project.requestToFreelancer?.toString() === user._id.toString())) {
        // อัปเดต requestToFreelancer เป็น null
        updateData.requestToFreelancer = null;
        
        try {
          // แจ้งเตือนเจ้าของโปรเจกต์ว่าฟรีแลนซ์ปฏิเสธคำขอ
          await createFreelancerResponseNotification(
            id,
            user._id.toString(),
            false // ปฏิเสธคำขอ
          );
        } catch (notificationError) {
          console.error('Error creating freelancer rejection notification:', notificationError);
          // ไม่ต้องหยุดการทำงานหลักหากการสร้างการแจ้งเตือนล้มเหลว
        }
      }
    }
    
    // ===== ฟรีแลนซ์ที่ส่งคำขอเข้ามาสามารถยกเลิกได้ =====
    if (isAppliedFreelancer) {
      // ฟรีแลนซ์ยกเลิกคำขอของตนเอง
      if (data.action === 'removeFreelancerRequest' && data.freelancerId) {
        // ตรวจสอบว่า freelancerId ตรงกับ user._id หรือไม่
        if (data.freelancerId !== user._id.toString()) {
          return NextResponse.json(
            { error: 'You can only cancel your own application' },
            { status: 400 }
          );
        }
        
        // ลบฟรีแลนซ์ออกจากรายการคำขอ
        await Project.updateOne(
          { _id: id },
          { $pull: { freelancersRequested: user._id } }
        );
        
        // หลังจากอัปเดตสำเร็จแล้ว ดึงโปรเจกต์ที่อัปเดตมาแล้วและส่งกลับ
        const updatedProject = await Project.findById(id).lean();
        
        const responseData = {
          success: true,
          message: 'Application canceled successfully',
          project: {
            ...updatedProject,
            id: updatedProject._id.toString(),
            owner: updatedProject.owner.toString(),
            assignedTo: updatedProject.assignedTo ? updatedProject.assignedTo.toString() : null,
            requestToFreelancer: updatedProject.requestToFreelancer ? updatedProject.requestToFreelancer.toString() : null,
            freelancersRequested: updatedProject.freelancersRequested.map(id => id.toString())
          }
        };
        
        // ส่งการอัปเดตแบบเรียลไทม์
        await triggerProjectUpdate(id, responseData.project);
        await triggerProjectListUpdate();
        
        return NextResponse.json(responseData);
      }
    }
    
    // ฟรีแลนซ์ที่ยื่นคำขอร่วมงาน
    if (data.applyToProject === true && user.role === 'student') {
      // ตรวจสอบว่าโปรเจกต์ยังเปิดรับอยู่หรือไม่
      if (project.status !== 'open') {
        return NextResponse.json(
          { error: 'Cannot apply: project is not open' },
          { status: 400 }
        );
      }
      
      // ตรวจสอบว่าฟรีแลนซ์ได้ส่งคำขอไปแล้วหรือยัง
      const alreadyRequested = project.freelancersRequested.some(
        id => id.toString() === user._id.toString()
      );
      
      if (alreadyRequested) {
        return NextResponse.json(
          { error: 'You have already applied to this project' },
          { status: 400 }
        );
      }
      
      // เพิ่มฟรีแลนซ์เข้าไปในรายการคำขอ
      await Project.updateOne(
        { _id: id },
        { $push: { freelancersRequested: user._id } }
      );
      
      // สร้างการแจ้งเตือนเมื่อฟรีแลนซ์ส่งคำขอร่วมงาน
      try {
        await createProjectRequestNotification(id, user._id.toString());
      } catch (notificationError) {
        console.error('Error creating project request notification:', notificationError);
        // ไม่ต้องหยุดการทำงานหลักหากการสร้างการแจ้งเตือนล้มเหลว
      }
      
      // หลังจากอัปเดตสำเร็จแล้ว ดึงโปรเจกต์ที่อัปเดตมาแล้วและส่งกลับ
      const updatedProject = await Project.findById(id).lean();
      
      const responseData = {
        success: true,
        message: 'Applied to project successfully',
        project: {
          ...updatedProject,
          id: updatedProject._id.toString(),
          owner: updatedProject.owner.toString(),
          assignedTo: updatedProject.assignedTo ? updatedProject.assignedTo.toString() : null,
          requestToFreelancer: updatedProject.requestToFreelancer ? updatedProject.requestToFreelancer.toString() : null,
          freelancersRequested: updatedProject.freelancersRequested.map(id => id.toString())
        }
      };
      
      // ส่งการอัปเดตแบบเรียลไทม์
      await triggerProjectUpdate(id, responseData.project);
      await triggerProjectListUpdate();
      
      return NextResponse.json(responseData);
    }
    
    // Common updates (for all roles)
    updateData.updatedAt = new Date();
    
    // Check if there are any updates to apply
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid updates provided' },
        { status: 400 }
      );
    }
    
    console.log("Final update data:", updateData);
    
    // Perform the update
    const updatedProject = await Project.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    ).lean().exec();
    
    console.log("Updated project result:", updatedProject);
    
    // Convert ObjectId to string for response
    const responseData: any = { ...updatedProject };
    responseData.id = updatedProject._id.toString();
    responseData.owner = updatedProject.owner.toString();
    
    if (updatedProject.assignedTo) {
      responseData.assignedTo = updatedProject.assignedTo.toString();
    } else {
      responseData.assignedTo = null;
    }
    
    if (updatedProject.requestToFreelancer) {
      responseData.requestToFreelancer = updatedProject.requestToFreelancer.toString();
    } else {
      responseData.requestToFreelancer = null;
    }
    
    responseData.freelancersRequested = updatedProject.freelancersRequested.map(id => id.toString());
    
    delete responseData._id;
    
    // ส่งการอัปเดตแบบเรียลไทม์
    await triggerProjectUpdate(id, responseData);

    // หากมีการเปลี่ยนสถานะโปรเจกต์ ให้แจ้งเตือนผู้ที่เกี่ยวข้องโดยตรง
    if (statusChanged) {
      const freelancerId = responseData.assignedTo;
      await triggerStatusChange(
        id, 
        responseData.status, 
        responseData.owner,
        freelancerId  // ส่งเฉพาะเมื่อมีฟรีแลนซ์ที่ได้รับมอบหมาย
      );
    }

    // อัปเดตรายการโปรเจกต์ทั้งหมด
    await triggerProjectListUpdate();
    
    return NextResponse.json({
      success: true,
      message: 'Project updated successfully',
      project: responseData
    });
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { error: 'Failed to update project: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}

// DELETE - Delete a project by ID
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get authenticated user
    const session = await getServerSession();
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized - Please login to delete a project' },
        { status: 401 }
      );
    }
    
    // Get project ID from route params
    const { id } =  await params;
    
    // Validate the ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid project ID format' },
        { status: 400 }
      );
    }
    
    // Connect to database
    await connectToDatabase();
    
    // Get the current user
    const user = await User.findOne({ email: session.user.email }).exec();
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Find the project
    const project = await Project.findById(id).exec();
    
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }
    
    // Check if user is the project owner
    if (project.owner.toString() !== user._id.toString()) {
      return NextResponse.json(
        { error: 'Permission denied - Only the project owner can delete this project' },
        { status: 403 }
      );
    }
    
    // Check if the project can be deleted - must have 'open' status
    if (project.status !== 'open') {
      return NextResponse.json(
        { error: 'Cannot delete a project that is not open - only projects with open status can be deleted' },
        { status: 400 }
      );
    }
    
    // Delete the project
    await Project.findByIdAndDelete(id);
    
    // แจ้งเตือนการลบโปรเจกต์ผ่าน Pusher
    await triggerProjectListUpdate();
    
    return NextResponse.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}

// PUT - Update a project in a more idempotent way or handle bulk updates
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get authenticated user
    const session = await getServerSession();
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized - Please login to update a project' },
        { status: 401 }
      );
    }
    
    // Get project ID from route params
    const { id } =  await params;
    
    // Validate the ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid project ID format' },
        { status: 400 }
      );
    }
    
    // Connect to database
    await connectToDatabase();
    
    // Get the current user
    const user = await User.findOne({ email: session.user.email }).exec();
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Find the project
    const project = await Project.findById(id).exec();
    
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }
    
    // Check if user is the project owner
    if (project.owner.toString() !== user._id.toString()) {
      return NextResponse.json(
        { error: 'Permission denied - Only the project owner can perform complete updates' },
        { status: 403 }
      );
    }
    
    // Get complete project data from request
    const data = await req.json();
    
    // Validate required fields
    if (!data.title || !data.description || !data.budget || !data.deadline || !data.requiredSkills) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Prepare update object
    const updateData = {
      title: data.title,
      description: data.description,
      budget: parseInt(data.budget, 10),
      deadline: new Date(data.deadline),
      requiredSkills: data.requiredSkills,
      updatedAt: new Date()
    };
    
    // Validate budget
    if (isNaN(updateData.budget) || updateData.budget < 100) {
      return NextResponse.json(
        { error: 'Budget must be at least 100' },
        { status: 400 }
      );
    }
    
    // Validate deadline is in the future
    if (updateData.deadline < new Date()) {
      return NextResponse.json(
        { error: 'Deadline must be in the future' },
        { status: 400 }
      );
    }
    
    // Restrict updating some fields if project is already assigned
    if (project.status !== 'open') {
      return NextResponse.json(
        { error: 'Cannot perform complete update on a project that is not open' },
        { status: 400 }
      );
    }
    
    // Update the project
    const updatedProject = await Project.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    ).lean().exec();
    
    // Convert ObjectId to string for response
    const responseData: any = { ...updatedProject };
    responseData.id = updatedProject._id.toString();
    responseData.owner = updatedProject.owner.toString();
    
    if (updatedProject.assignedTo) {
      responseData.assignedTo = updatedProject.assignedTo.toString();
    } else {
      responseData.assignedTo = null;
    }
    
    if (updatedProject.requestToFreelancer) {
      responseData.requestToFreelancer = updatedProject.requestToFreelancer.toString();
    } else {
      responseData.requestToFreelancer = null;
    }
    
    responseData.freelancersRequested = updatedProject.freelancersRequested.map(id => id.toString());
    
    delete responseData._id;
    
    // ส่งการอัปเดตแบบเรียลไทม์
    await triggerProjectUpdate(id, responseData);
    await triggerProjectListUpdate();
    
    return NextResponse.json({
      success: true,
      message: 'Project updated successfully',
      project: responseData
    });
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}