// src/app/api/freelancers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/libs/mongodb';
import User from '@/models/User';

export async function GET(req: NextRequest) {
  try {
    // Get query parameters
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '12', 10);
    const searchQuery = url.searchParams.get('q');
    const skills = url.searchParams.get('skills')?.split(',');
    const major = url.searchParams.get('major');
    const minPrice = parseInt(url.searchParams.get('minPrice') || '0', 10);
    const maxPrice = parseInt(url.searchParams.get('maxPrice') || '10000', 10);
    
    // Connect to database
    await connectToDatabase();
    
    // Build the query
    const query: any = {
      role: 'student',
      isOpen: true
    };
    
    // Add search query filter
    if (searchQuery) {
      query.$or = [
        { name: { $regex: searchQuery, $options: 'i' } },
        { firstName: { $regex: searchQuery, $options: 'i' } },
        { lastName: { $regex: searchQuery, $options: 'i' } },
        { major: { $regex: searchQuery, $options: 'i' } },
        { skills: { $in: [new RegExp(searchQuery, 'i')] } }
      ];
    }
    
    // Add skill filter if provided
    if (skills && skills.length > 0) {
      query.skills = { $in: skills };
    }
    
    // Add major filter if provided
    if (major) {
      query.major = major;
    }
    
    // Add price range filter
    if (minPrice > 0 || maxPrice !== null) {
      query.basePrice = {
        $gte: minPrice,
        $lte: maxPrice
      };
    }
    
    // Calculate the number of documents to skip
    const skip = (page - 1) * limit;
    
    // Get total count for pagination
    const totalCount = await User.countDocuments(query);
    
    // Get freelancers with pagination
    const freelancers = await User.find(query)
      .sort({ createdAt: -1 }) // Sort by newest first
      .skip(skip)
      .limit(limit)
      .lean() // Convert mongoose documents to plain JavaScript objects
      .exec();
    
    // Map the results to return only necessary data
    const mappedFreelancers = freelancers.map(user => ({
      id: user._id.toString(),
      name: user.name,
      firstName: user.firstName,
      lastName: user.lastName,
      major: user.major,
      skills: user.skills,
      profileImageUrl: user.profileImageUrl,
      basePrice: user.basePrice,
      galleryImages: user.galleryImages || []
    }));
    
    // Return the response
    return NextResponse.json({
      freelancers: mappedFreelancers,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit)
    });
  } catch (error) {
    console.error('Error fetching freelancers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch freelancers' },
      { status: 500 }
    );
  }
}

// API endpoint for getting just the count
export async function HEAD(req: NextRequest) {
  try {
    // Get query parameters for filtering
    const url = new URL(req.url);
    const searchQuery = url.searchParams.get('q');
    const skills = url.searchParams.get('skills')?.split(',');
    const major = url.searchParams.get('major');
    const minPrice = parseInt(url.searchParams.get('minPrice') || '0', 10);
    const maxPrice = url.searchParams.get('maxPrice') ? parseInt(url.searchParams.get('maxPrice')!, 10) : null;
    
    // Connect to database
    await connectToDatabase();
    
    // Build the query
    const query: any = {
      role: 'student',
      isOpen: true
    };
    
    // Add search query filter
    if (searchQuery) {
      query.$or = [
        { name: { $regex: searchQuery, $options: 'i' } },
        { firstName: { $regex: searchQuery, $options: 'i' } },
        { lastName: { $regex: searchQuery, $options: 'i' } },
        { major: { $regex: searchQuery, $options: 'i' } },
        { skills: { $in: [new RegExp(searchQuery, 'i')] } }
      ];
    }
    
    // Add skill filter if provided
    if (skills && skills.length > 0) {
      query.skills = { $in: skills };
    }
    
    // Add major filter if provided
    if (major) {
      query.major = major;
    }
    
    // Add price range filter
    if (minPrice > 0 || maxPrice !== null) {
      query.basePrice = {
        $gte: minPrice,
        $lte: maxPrice
      };
    }
    
    // Get total count only
    const totalCount = await User.countDocuments(query);
    
    // Return the count in headers
    const response = new NextResponse(null, { status: 200 });
    response.headers.set('X-Total-Count', totalCount.toString());
    return response;
  } catch (error) {
    console.error('Error fetching freelancers count:', error);
    return new NextResponse(null, { status: 500 });
  }
}