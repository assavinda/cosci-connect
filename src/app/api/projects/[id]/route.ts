// src/app/api/projects/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/libs/mongodb';
import Project from '@/models/Project';
import mongoose from 'mongoose';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get project ID from route params
    const id = params.id;
    
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
      assignedFreelancerName: project.assignedFreelancerName || null,
      applicants: project.applicants ? project.applicants.map(id => id.toString()) : [],
      applicantNames: project.applicantNames || [],
      invitations: project.invitations ? project.invitations.map(id => id.toString()) : [],
      invitationNames: project.invitationNames || [],
      messages: project.messages || []
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