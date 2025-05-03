// src/app/api/projects/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectToDatabase from '@/libs/mongodb';
import Project from '@/models/Project';
import User from '@/models/User';
import mongoose from 'mongoose';

// GET - List projects with flexible filtering
export async function GET(req: NextRequest) {
  try {
    // Parse query parameters
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '12', 10);
    const searchQuery = url.searchParams.get('q');
    const skills = url.searchParams.get('skills')?.split(',');
    const status = url.searchParams.get('status') || 'open'; // Default to open projects
    const minPrice = parseInt(url.searchParams.get('minPrice') || '0', 10);
    const maxPrice = parseInt(url.searchParams.get('maxPrice') || '10000', 10);
    const owner = url.searchParams.get('owner'); // Optional owner filter
    
    // พารามิเตอร์ใหม่: noRequest - สำหรับกรองโปรเจกต์ที่ไม่มี requestToFreelancer
    const noRequest = url.searchParams.get('noRequest') === 'true';
    
    // Connect to the database
    await connectToDatabase();
    
    // Build query
    const query: any = {};
    
    // Add status filter (if not set to 'all')
    if (status !== 'all') {
      query.status = status;
    }
    
    // Add owner filter if provided
    if (owner) {
      query.owner = new mongoose.Types.ObjectId(owner);
    }
    
    // Add noRequest filter - ดึงเฉพาะโปรเจกต์ที่ไม่มี requestToFreelancer
    if (noRequest) {
      query.$or = [
        { requestToFreelancer: { $exists: false } },
        { requestToFreelancer: null }
      ];
    }
    
    // Add search query filter
    if (searchQuery) {
      query.$or = [
        { title: { $regex: searchQuery, $options: 'i' } },
        { description: { $regex: searchQuery, $options: 'i' } },
        { ownerName: { $regex: searchQuery, $options: 'i' } },
        { requiredSkills: { $in: [new RegExp(searchQuery, 'i')] } }
      ];
    }
    
    // Add skill filter
    if (skills && skills.length > 0 && skills[0] !== '') {
      query.requiredSkills = { $in: skills };
    }
    
    // Add budget range filter
    if (minPrice > 0 || maxPrice < 10000) {
      query.budget = {
        $gte: minPrice,
        $lte: maxPrice
      };
    }
    
    // Calculate skip for pagination
    const skip = (page - 1) * limit;
    
    // Get total count for pagination
    const totalCount = await Project.countDocuments(query);
    
    // Get projects with pagination
    const projects = await Project.find(query)
      .sort({ createdAt: -1 }) // Sort by newest first
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();
    
    // ดึงข้อมูลผู้ใช้ที่เกี่ยวข้องกับโปรเจกต์ (ไม่จำเป็นต้องทำการ populate เพราะเราเรียกใช้ lean())
    const userIds = new Set();
    
    // รวบรวม ID ผู้ใช้ทั้งหมดที่เกี่ยวข้อง
    projects.forEach(project => {
      if (project.assignedTo) userIds.add(project.assignedTo.toString());
      if (project.requestToFreelancer) userIds.add(project.requestToFreelancer.toString());
      project.freelancersRequested.forEach(id => userIds.add(id.toString()));
    });
    
    // ดึงข้อมูลผู้ใช้ทั้งหมดในคำขอเดียว
    const users = await User.find({
      _id: { $in: Array.from(userIds).map((id: string) => new mongoose.Types.ObjectId(id)) }
    }).select('_id name').lean();
    
    // สร้าง Map ของ userId => userName
    const userMap = new Map();
    users.forEach(user => {
      userMap.set(user._id.toString(), user.name);
    });
    
    // Map projects to a clean format with user names
    const mappedProjects = projects.map(project => {
      const assignedToId = project.assignedTo ? project.assignedTo.toString() : null;
      const requestToFreelancerId = project.requestToFreelancer ? project.requestToFreelancer.toString() : null;
      
      return {
        id: project._id.toString(),
        title: project.title,
        description: project.description,
        budget: project.budget,
        deadline: project.deadline,
        requiredSkills: project.requiredSkills,
        ownerName: project.ownerName,
        owner: project.owner.toString(),
        status: project.status,
        progress: project.progress || 0,
        createdAt: project.createdAt,
        assignedTo: assignedToId,
        assignedFreelancerName: assignedToId ? userMap.get(assignedToId) || "ฟรีแลนซ์" : null,
        requestToFreelancer: requestToFreelancerId,
        requestToFreelancerName: requestToFreelancerId ? userMap.get(requestToFreelancerId) || "ฟรีแลนซ์" : null,
        freelancersRequested: project.freelancersRequested.map(id => id.toString())
      };
    });
    
    // Return response with pagination info
    return NextResponse.json({
      projects: mappedProjects,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit)
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

// POST - Create a new project
export async function POST(req: NextRequest) {
  try {
    // Get the authenticated user
    const session = await getServerSession();
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized - Please login to create a project' },
        { status: 401 }
      );
    }

    // Connect to the database
    await connectToDatabase();

    // Get the user from the database
    const user = await User.findOne({ email: session.user.email }).exec();
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user is allowed to create projects (teachers and alumni)
    if (user.role !== 'teacher' && user.role !== 'alumni') {
      return NextResponse.json(
        { error: 'Only teachers and alumni can create projects' },
        { status: 403 }
      );
    }

    // Get the project data from request
    const data = await req.json();
    
    // Validate required fields
    if (!data.title || !data.description || !data.budget || !data.deadline || !data.requiredSkills || data.requiredSkills.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create the project
    const project = new Project({
      title: data.title,
      description: data.description,
      budget: parseInt(data.budget, 10),
      deadline: new Date(data.deadline),
      requiredSkills: data.requiredSkills,
      owner: user._id,
      ownerName: user.name,
      status: 'open', // Initial status
      progress: 0,
      createdAt: new Date(),
      // ตั้งค่าเริ่มต้น requestToFreelancer เป็น null ชัดเจน
      requestToFreelancer: null
    });

    // Save the project
    await project.save();

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Project created successfully',
      project: {
        id: project._id.toString(),
        title: project.title,
        description: project.description,
        budget: project.budget,
        deadline: project.deadline,
        requiredSkills: project.requiredSkills,
        ownerName: project.ownerName,
        owner: project.owner.toString(),
        status: project.status,
        progress: project.progress,
        createdAt: project.createdAt,
        requestToFreelancer: null
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    
    // Check for specific MongoDB errors
    if (error instanceof mongoose.Error) {
      return NextResponse.json(
        { error: 'Database error', details: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}