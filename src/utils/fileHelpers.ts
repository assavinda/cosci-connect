// src/utils/fileHelpers.ts
export function addPDFTransformation(url: string): string {
    if (!url) return url;
    
    // ตรวจสอบว่าเป็นลิงก์ PDF หรือไม่
    const isProbablyPDF = url.includes('portfolio') || url.endsWith('.pdf');
    
    if (isProbablyPDF) {
      // แก้ไข URL เพื่อให้เข้าถึงไฟล์ PDF ได้ถูกต้อง
      if (url.includes('/image/upload/')) {
        // เปลี่ยนจาก image เป็น raw
        url = url.replace('/image/upload/', '/raw/upload/');
      }
      
      // เพิ่ม fl_attachment เพื่อบังคับให้ดาวน์โหลดหากยังไม่มี
      if (!url.includes('fl_attachment')) {
        const segments = url.split('/upload/');
        if (segments.length === 2) {
          url = `${segments[0]}/upload/fl_attachment/${segments[1]}`;
        }
      }
    }
    
    return url;
  }