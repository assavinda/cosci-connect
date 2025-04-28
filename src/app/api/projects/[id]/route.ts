// src/app/api/projects/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectToDatabase from '@/libs/mongodb';
import Project from '@/models/Project';
import User from '@/models/User';
import mongoose from 'mongoose';

// GET - Retrieve a specific project by ID
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
      assignedFreelancerName: project.assignedFreelancerName || null
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
  { params }: { params: { id: string } }
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
    
    // Check if user has permission to update the project
    const isOwner = project.owner.toString() === user._id.toString();
    const isAssignedFreelancer = project.assignedTo && project.assignedTo.toString() === user._id.toString();
    
    if (!isOwner && !isAssignedFreelancer) {
      return NextResponse.json(
        { error: 'Permission denied - You do not have permission to update this project' },
        { status: 403 }
      );
    }
    
    // Get update data from request
    const data = await req.json();
    const updateData: any = {};
    
    // Owner can update these fields
    if (isOwner) {
      // Basic project information
      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.budget !== undefined) updateData.budget = parseInt(data.budget, 10);
      if (data.deadline !== undefined) updateData.deadline = new Date(data.deadline);
      if (data.requiredSkills !== undefined) updateData.requiredSkills = data.requiredSkills;
      
      // Project flow control by owner
      if (data.status !== undefined) {
        // Owner can change status with some restrictions
        const currentStatus = project.status;
        const newStatus = data.status;
        
        const validTransitions: Record<string, string[]> = {
          'open': ['cancelled'],
          'assigned': ['in_progress', 'cancelled'],
          'in_progress': ['revision', 'completed', 'cancelled'],
          'revision': ['in_progress', 'completed', 'cancelled'],
          'awaiting': ['completed', 'revision']
        };
        
        if (!validTransitions[currentStatus]?.includes(newStatus)) {
          return NextResponse.json(
            { error: `Cannot change status from ${currentStatus} to ${newStatus}` },
            { status: 400 }
          );
        }
        
        updateData.status = newStatus;
        
        // If project is completed, set completedAt
        if (newStatus === 'completed' && !project.completedAt) {
          updateData.completedAt = new Date();
        }
      }
      
      // Handle freelancer assignment
      if (data.assignFreelancer === true && data.freelancerId) {
        // Validate freelancer ID
        if (!mongoose.Types.ObjectId.isValid(data.freelancerId)) {
          return NextResponse.json(
            { error: 'Invalid freelancer ID format' },
            { status: 400 }
          );
        }
        
        // Check if project is in a state that can be assigned
        if (project.status !== 'open') {
          return NextResponse.json(
            { error: 'This project is not open for assignment' },
            { status: 400 }
          );
        }
        
        // Get freelancer data
        const freelancer = await User.findById(data.freelancerId).exec();
        
        if (!freelancer) {
          return NextResponse.json(
            { error: 'Freelancer not found' },
            { status: 404 }
          );
        }
        
        // Check if freelancer is a student
        if (freelancer.role !== 'student') {
          return NextResponse.json(
            { error: 'Only students can be assigned to projects' },
            { status: 400 }
          );
        }
        
        // Update assignment
        updateData.assignedTo = freelancer._id;
        updateData.assignedFreelancerName = freelancer.name;
        updateData.status = 'assigned';
      }
      
      // Remove freelancer assignment
      if (data.removeFreelancer === true && project.assignedTo) {
        // Only allow removing if project is not completed
        if (project.status === 'completed') {
          return NextResponse.json(
            { error: 'Cannot remove freelancer from completed project' },
            { status: 400 }
          );
        }
        
        updateData.assignedTo = null;
        updateData.assignedFreelancerName = null;
        updateData.status = 'open';
      }
    }
    
    // Freelancer can update these fields
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
      }
      
      // Freelancer can change status with some restrictions
      if (data.status !== undefined) {
        const currentStatus = project.status;
        const newStatus = data.status;
        
        const validFreelancerTransitions: Record<string, string[]> = {
          'assigned': ['in_progress'],
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
      }
    }
    
    // Common updates (for both roles)
    updateData.updatedAt = new Date();
    
    // Check if there are any updates to apply
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid updates provided' },
        { status: 400 }
      );
    }
    
    // Perform the update
    const updatedProject = await Project.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    ).lean().exec();
    
    // Convert ObjectId to string for response
    const responseData = {
      ...updatedProject,
      id: updatedProject._id.toString(),
      owner: updatedProject.owner.toString(),
      assignedTo: updatedProject.assignedTo ? updatedProject.assignedTo.toString() : null,
      _id: undefined
    };
    
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

// DELETE - Delete a project by ID
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
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
    
    // Check if the project can be deleted
    if (['assigned', 'in_progress', 'revision', 'awaiting'].includes(project.status)) {
      return NextResponse.json(
        { error: 'Cannot delete a project that is currently in progress or assigned' },
        { status: 400 }
      );
    }
    
    // Delete the project
    await Project.findByIdAndDelete(id);
    
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
  { params }: { params: { id: string } }
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
    const responseData = {
      ...updatedProject,
      id: updatedProject._id.toString(),
      owner: updatedProject.owner.toString(),
      assignedTo: updatedProject.assignedTo ? updatedProject.assignedTo.toString() : null,
      _id: undefined
    };
    
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