// src/app/api/auth/check-student-id/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/libs/mongodb';
import User from '@/models/User';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const studentId = url.searchParams.get('studentId');

    // Check if student ID is provided
    if (!studentId) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      );
    }

    // Basic validation before database check
    // Must be 11 digits
    if (studentId.length !== 11) {
      return NextResponse.json(
        { error: 'Student ID must be 11 digits', exists: false, isValid: false },
        { status: 400 }
      );
    }
    
    // Must be all digits
    if (!/^\d+$/.test(studentId)) {
      return NextResponse.json(
        { error: 'Student ID must contain only digits', exists: false, isValid: false },
        { status: 400 }
      );
    }
    
    // Must have the correct faculty code (assuming 30010 for COSCI)
    if (studentId.substring(3, 8) !== '30010') {
      return NextResponse.json(
        { 
          error: 'Invalid student ID format (must be a COSCI student)', 
          exists: false, 
          isValid: false 
        },
        { status: 400 }
      );
    }

    // Connect to the database
    await connectToDatabase();

    // Check if this student ID is already registered
    const user = await User.findOne({ studentId }).exec();
    
    // Return the result with more detailed information
    return NextResponse.json({ 
      exists: !!user,
      isValid: true,  // The ID passed all format validations
      message: user ? 'Student ID is already registered' : 'Student ID is available',
    });
  } catch (error) {
    console.error('Error checking student ID:', error);
    return NextResponse.json(
      { error: 'Something went wrong while checking student ID' },
      { status: 500 }
    );
  }
}