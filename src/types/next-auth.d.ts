// src/types/next-auth.d.ts
import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role?: 'student' | 'alumni' | 'teacher';
      firstName?: string;
      lastName?: string;
      emailVerified?: boolean;
      profileImageUrl?: string | null;
      isOpen?: boolean;
      basePrice?: number;
      galleryImages?: string[];
      skills?: string[]; // Added skills property
    } & DefaultSession['user'];
  }

  interface User {
    role?: 'student' | 'alumni' | 'teacher';
    firstName?: string;
    lastName?: string;
    emailVerified?: boolean;
    profileImageUrl?: string;
    isOpen?: boolean;
    basePrice?: number;
    galleryImages?: string[];
    skills?: string[]; // Added skills property
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: 'student' | 'alumni' | 'teacher';
    firstName?: string;
    lastName?: string;
    emailVerified?: boolean;
    profileImageUrl?: string;
    isOpen?: boolean;
    basePrice?: number;
    galleryImages?: string[];
    skills?: string[]; // Added skills property
  }
}

// Add global augmentation for mongoose caching
declare global {
  var mongoose: {
    conn: any | null;
    promise: Promise<any> | null;
  };
  var mongoClient: {
    conn: any | null;
    promise: Promise<any> | null;
  };
}