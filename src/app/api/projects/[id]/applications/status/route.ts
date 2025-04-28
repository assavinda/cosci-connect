// src/app/api/projects/[id]/applications/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectToDatabase from '@/libs/mongodb';
import Application from '@/models/Application';
import mongoose from 'mongoose';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession();
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized', hasApplied: false },
        { status: 401 }
      );
    }

    // Get project ID from params
    const projectId = params.id;
    
    // Validate the ID format
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return NextResponse.json(
        { error: 'Invalid project ID format', hasApplied: false },
        { status: 400 }
      );
    }

    // Connect to database
    await connectToDatabase();
    
    // Check if the user has already applied to this project
    const application = await Application.findOne({
      projectId: new mongoose.Types.ObjectId(projectId),
      freelancerId: new mongoose.Types.ObjectId(session.user.id)
    }).lean().exec();
    
    return NextResponse.json({
      hasApplied: !!application,
      applicationStatus: application ? application.status : null,
      applicationId: application ? application._id.toString() : null
    });
  } catch (error) {
    console.error('Error checking application status:', error);
    return NextResponse.json(
      { error: 'Failed to check application status', hasApplied: false },
      { status: 500 }
    );
  }
}