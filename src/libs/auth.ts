// src/libs/auth.ts
import { getToken, JWT } from 'next-auth/jwt';
import { NextRequest } from 'next/server';

/**
 * ฟังก์ชันช่วยสำหรับการดึง session จาก next-auth/jwt
 * ใช้แทน getServerSession จาก next-auth ในกรณีที่มีปัญหา
 */
export async function getServerSession({ req }: { req: NextRequest }): Promise<JWT | null> {
  const secret = process.env.NEXTAUTH_SECRET;

  if (!secret) {
    console.error('NEXTAUTH_SECRET is not set in environment variables');
    return null;
  }

  try {
    const token = await getToken({ req, secret });
    return token;
  } catch (error) {
    console.error('Error getting JWT token:', error);
    return null;
  }
}

/**
 * ฟังก์ชันช่วยในการดึง userId จาก session
 */
export function getUserIdFromSession(session: JWT | null): string | null {
  if (!session) return null;
  
  // next-auth/jwt ใช้ sub สำหรับ user ID
  return session.sub || null;
}

/**
 * ฟังก์ชันตรวจสอบว่า user มีสิทธิ์เข้าถึงข้อมูลหรือไม่
 */
export function isAuthorized(session: JWT | null, requiredRoles?: string[]): boolean {
  if (!session) return false;
  
  // ถ้าไม่กำหนด roles ที่ต้องการ แสดงว่าแค่ต้องการให้ login เท่านั้น
  if (!requiredRoles || requiredRoles.length === 0) return true;
  
  // ตรวจสอบว่า user มี role ที่ต้องการหรือไม่
  const userRole = session.role as string;
  return requiredRoles.includes(userRole);
}

/**
 * ฟังก์ชันสร้าง Error Response สำหรับกรณีไม่มีสิทธิ์
 */
export function createUnauthorizedResponse(message: string = 'Unauthorized - Please login to continue') {
  return Response.json(
    { error: message },
    { status: 401 }
  );
}