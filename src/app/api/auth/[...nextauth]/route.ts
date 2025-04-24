// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import EmailProvider from 'next-auth/providers/email';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import { getMongoClient } from '@/libs/mongodb';
import User from '@/models/User';
import { Adapter } from 'next-auth/adapters';
import mongoose from 'mongoose';

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
      from: process.env.EMAIL_FROM,
    }),
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
    async session({ session, token }) {
      if (token.sub && session.user) {
        // Add user ID to the session
        session.user.id = token.sub;
        
        // Get additional user data from MongoDB
        try {
          await import('@/libs/mongodb').then(({ connectToDatabase }) => connectToDatabase());
          
          // Use mongoose findById which is type-safe
          const userId = new mongoose.Types.ObjectId(token.sub);
          const userData = await User.findById(userId).lean().exec();
          
          if (userData) {
            session.user.role = userData.role;
            session.user.firstName = userData.firstName;
            session.user.lastName = userData.lastName;
            session.user.name = userData.name;
            session.user.emailVerified = userData.emailVerified;
            session.user.profileImageUrl = userData.profileImageUrl || null;
          }
        } catch (error) {
          console.error('Error fetching user data for session:', error);
        }
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
  },
  events: {
    async createUser({ user }) {
      // Note: This event fires after a user is created by NextAuth
      // but we'll create our own extended user model in the registration API
      console.log('User created:', user.id);
    },
  },
});

export { handler as GET, handler as POST };