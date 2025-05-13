// src/libs/auth.ts
import { getToken, JWT } from 'next-auth/jwt';
import { NextRequest } from 'next/server';

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