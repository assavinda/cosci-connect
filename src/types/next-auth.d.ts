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
      basePrice?: number;  // เพิ่มฟิลด์ราคาเริ่มต้น
      galleryImages?: string[];  // เพิ่มฟิลด์รูปภาพตัวอย่างผลงาน
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