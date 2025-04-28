// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import EmailProvider from 'next-auth/providers/email';
import CredentialsProvider from 'next-auth/providers/credentials';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import { getMongoClient } from '@/libs/mongodb';
import User from '@/models/User';
import { Adapter } from 'next-auth/adapters';
import mongoose from 'mongoose';
import connectToDatabase from '@/libs/mongodb';

// Define NextAuth configuration with custom adapter for MongoDB
const handler = NextAuth({
  adapter: MongoDBAdapter(getMongoClient()) as Adapter,
  providers: [
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM || `"COSCI-CONNECT" <${process.env.EMAIL_SERVER_USER}>`,
    }),
    // เพิ่ม CredentialsProvider สำหรับล็อกอินหลังจากยืนยัน OTP
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
      },
      async authorize(credentials) {
        if (!credentials?.email) {
          return null;
        }

        try {
          // เชื่อมต่อกับฐานข้อมูล
          await connectToDatabase();
          
          // ค้นหาผู้ใช้จากอีเมล
          const user = await User.findOne({ email: credentials.email }).exec();
          
          // ถ้าไม่พบผู้ใช้
          if (!user) {
            console.log('User not found:', credentials.email);
            return null;
          }
          
          // ตรวจสอบว่าอีเมลได้รับการยืนยันแล้วหรือไม่
          if (!user.emailVerified) {
            console.log('Email not verified:', credentials.email);
            throw new Error("Email not verified");
          }
          
          // คืนค่าข้อมูลผู้ใช้สำหรับล็อกอิน
          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            firstName: user.firstName,
            lastName: user.lastName,
            emailVerified: user.emailVerified,
            profileImageUrl: user.profileImageUrl,
            isOpen: user.role === 'student' ? user.isOpen : undefined,
            basePrice: user.role === 'student' ? user.basePrice : undefined,
            galleryImages: user.role === 'student' ? user.galleryImages : undefined,
          };
        } catch (error) {
          console.error('Error authorizing user:', error);
          return null;
        }
      }
    })
  ],
  pages: {
    signIn: '/auth?state=login',
    verifyRequest: '/auth/verify-request',
    newUser: '/auth?state=register',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {

    // Update the session callback to include skills
    async session({ session, token }) {
    if (token.sub && session.user) {
      // Add user ID to the session
      session.user.id = token.sub;
      
      // Add additional user data from token
      if (token.role) session.user.role = token.role as any;
      if (token.firstName) session.user.firstName = token.firstName as string;
      if (token.lastName) session.user.lastName = token.lastName as string;
      if (token.skills) session.user.skills = token.skills as string[]; // Added skills
      
      // Handle emailVerified - convert to boolean safely
      if (token.emailVerified !== undefined) {
        // Force convert to boolean - if it's a Date or any truthy value, consider it as verified
        session.user.emailVerified = Boolean(token.emailVerified);
      }
      
      if (token.profileImageUrl) session.user.profileImageUrl = token.profileImageUrl as string;
      if (token.isOpen !== undefined && token.role === 'student') session.user.isOpen = Boolean(token.isOpen);
      if (token.basePrice !== undefined && token.role === 'student') session.user.basePrice = Number(token.basePrice);
      if (token.galleryImages && token.role === 'student') session.user.galleryImages = token.galleryImages as string[];
      
      // เพิ่มข้อมูลเพิ่มเติมจาก MongoDB หากข้อมูลใน token ไม่ครบถ้วน
      try {
        await import('@/libs/mongodb').then(({ connectToDatabase }) => connectToDatabase());
        
        // Use mongoose findById which is type-safe
        const userId = new mongoose.Types.ObjectId(token.sub);
        const userData = await User.findById(userId).lean().exec();
        
        if (userData) {
          if (!session.user.role) session.user.role = userData.role;
          if (!session.user.firstName) session.user.firstName = userData.firstName;
          if (!session.user.lastName) session.user.lastName = userData.lastName;
          if (!session.user.name) session.user.name = userData.name;
          if (!session.user.skills) session.user.skills = userData.skills; // Added skills
          
          // Handle emailVerified from database - convert to boolean safely
          if (session.user.emailVerified === undefined && userData.emailVerified !== undefined) {
            session.user.emailVerified = Boolean(userData.emailVerified);
          }
          
          if (!session.user.profileImageUrl) session.user.profileImageUrl = userData.profileImageUrl || null;
          
          if (session.user.isOpen === undefined && userData.role === 'student') {
            session.user.isOpen = Boolean(userData.isOpen);
          }
          
          if (session.user.basePrice === undefined && userData.role === 'student') {
            session.user.basePrice = userData.basePrice;
          }
          
          if (!session.user.galleryImages && userData.role === 'student') {
            session.user.galleryImages = userData.galleryImages;
          }
        }
      } catch (error) {
        console.error('Error fetching user data for session:', error);
      }
    }
    return session;
  },
  
  // Update the JWT callback to include skills
  async jwt({ token, user, account }) {
    // เพิ่มข้อมูลผู้ใช้ลงใน token เมื่อล็อกอิน
    if (user) {
      token.role = user.role;
      token.firstName = user.firstName;
      token.lastName = user.lastName;
      token.skills = user.skills; // Added skills
      token.emailVerified = Boolean(user.emailVerified);
      token.profileImageUrl = user.profileImageUrl;
      if (user.role === 'student') {
        token.isOpen = user.isOpen;
        token.basePrice = user.basePrice;
        token.galleryImages = user.galleryImages;
      }
    }
    return token;
  }
  },
  debug: process.env.NODE_ENV === 'development',
});

export { handler as GET, handler as POST };