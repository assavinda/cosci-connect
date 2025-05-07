// src/utils/encryptionUtils.ts
import crypto from 'crypto';

// กุญแจลับสำหรับการเข้ารหัส (ควรเก็บไว้ในตัวแปรสภาพแวดล้อม)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-fallback-secret-key-at-least-32-chars';
const IV_LENGTH = 16; // สำหรับ AES จะมีความยาวเท่ากับ 16 ไบต์เสมอ

/**
 * เข้ารหัสข้อความด้วย AES-256-CBC
 * @param text - ข้อความธรรมดาที่ต้องการเข้ารหัส
 * @returns ข้อความที่เข้ารหัสแล้วในรูปแบบ base64 พร้อมกับ IV นำหน้า
 */
export function encrypt(text: string): string {
  // สร้าง initialization vector แบบสุ่ม
  const iv = crypto.randomBytes(IV_LENGTH);
  
  // สร้างตัวเข้ารหัสด้วยกุญแจและ iv
  const cipher = crypto.createCipheriv(
    'aes-256-cbc', 
    Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)), 
    iv
  );
  
  // เข้ารหัสข้อความ
  let encrypted = cipher.update(text, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  
  // นำ IV มาต่อหน้าข้อความที่เข้ารหัสแล้วเพื่อใช้ในการถอดรหัสในภายหลัง
  // เก็บ IV ในรูปแบบ hex และจะใช้ในการถอดรหัส
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * ถอดรหัสข้อความที่เข้ารหัสด้วยฟังก์ชัน encrypt
 * @param encryptedText - ข้อความที่เข้ารหัสแล้วพร้อม IV นำหน้า
 * @returns ข้อความธรรมดาที่ถอดรหัสแล้ว
 */
export function decrypt(encryptedText: string): string {
  try {
    // แยกข้อความที่เข้ารหัสแล้วเพื่อรับ IV และข้อความที่เข้ารหัสจริงๆ
    const parts = encryptedText.split(':');
    if (parts.length !== 2) {
      throw new Error('รูปแบบข้อความที่เข้ารหัสไม่ถูกต้อง');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    
    // สร้างตัวถอดรหัสด้วยกุญแจและ iv
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc', 
      Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)), 
      iv
    );
    
    // ถอดรหัสข้อความ
    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการถอดรหัสข้อความ:', error);
    return '[ไม่สามารถถอดรหัสข้อความได้]';
  }
}

/**
 * ฟังก์ชันตรวจสอบว่าข้อความได้รับการเข้ารหัสหรือไม่
 * @param text - ข้อความที่ต้องการตรวจสอบ
 * @returns true ถ้าข้อความดูเหมือนได้รับการเข้ารหัส
 */
export function isEncrypted(text: string): boolean {
  // ตรวจสอบว่าข้อความมีรูปแบบตามที่คาดหวังหรือไม่ (IV hex + ':' + base64 encrypted)
  const parts = text.split(':');
  if (parts.length !== 2) return false;
  
  // ตรวจสอบว่าส่วนแรกเป็น hex ที่มีความยาวถูกต้อง (IV มีขนาด 16 bytes = 32 hex chars)
  const ivHex = parts[0];
  if (ivHex.length !== IV_LENGTH * 2) return false;
  
  // ตรวจสอบว่า IV เป็น hex ที่ถูกต้อง
  const hexRegex = /^[0-9a-fA-F]+$/;
  if (!hexRegex.test(ivHex)) return false;
  
  // ตรวจสอบว่าส่วนที่สองเป็น base64 ที่ถูกต้อง
  const base64Regex = /^[A-Za-z0-9+/=]+$/;
  return base64Regex.test(parts[1]);
}