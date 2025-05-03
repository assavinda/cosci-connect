'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import Link from 'next/link';
import Loading from '../../../../components/common/Loading';
import SendMessageButton from '../../../../components/buttons/SendMessageButton';

export default function CustomerProfilePage() {
  const { id } = useParams();
  const customerId = Array.isArray(id) ? id[0] : id; // แปลงจาก ParamValue เป็น string
  const { data: session } = useSession();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCustomerData = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`/api/customers/${customerId}`);
        setCustomer(response.data);
        setError('');
      } catch (err) {
        console.error('Error fetching customer data:', err);
        setError('ไม่สามารถโหลดข้อมูลลูกค้าได้ กรุณาลองใหม่อีกครั้ง');
      } finally {
        setLoading(false);
      }
    };

    if (customerId) {
      fetchCustomerData();
    }
  }, [customerId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Loading size="large" color="primary" />
        <p className="mt-4 text-gray-500">กำลังโหลดข้อมูลลูกค้า...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto p-6 bg-red-50 border border-red-200 rounded-xl my-6">
        <h2 className="text-red-600 text-lg font-medium mb-4">เกิดข้อผิดพลาด</h2>
        <p className="text-red-600 mb-4">{error}</p>
        <Link href="/" className="btn-secondary inline-block">
          กลับไปยังหน้าแรก
        </Link>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="max-w-5xl mx-auto p-6 bg-gray-50 border border-gray-200 rounded-xl my-6">
        <h2 className="text-lg font-medium mb-4">ไม่พบข้อมูลลูกค้า</h2>
        <p className="text-gray-600 mb-4">ไม่พบข้อมูลลูกค้าที่คุณต้องการดู หรืออาจไม่มีอยู่ในระบบ</p>
        <Link href="/" className="btn-secondary inline-block">
          กลับไปยังหน้าแรก
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* หัวข้อและปุ่มย้อนกลับ */}
      <div className="flex justify-between items-center mb-6">
        <Link href="/" className="text-primary-blue-500 hover:text-primary-blue-600 flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
          กลับไปยังหน้าแรก
        </Link>
        
        {/* แสดงปุ่ม SendMessageButton ถ้าล็อกอินและไม่ใช่โปรไฟล์ของตัวเอง */}
        {session?.user?.id && session.user.id !== customerId && (
          <SendMessageButton 
            recipientId={customerId} 
            recipientName={customer.name} 
          />
        )}
      </div>

      {/* ข้อมูลลูกค้า */}
      <div className="bg-white shadow-md rounded-xl overflow-hidden">
        {/* ส่วนหัว - ข้อมูลพื้นฐาน */}
        <div className="bg-primary-blue-500 p-6 text-white">
          <div className="flex flex-col md:flex-row gap-4 items-center md:items-start">
            {/* รูปโปรไฟล์ */}
            <div className="w-24 h-24 rounded-full overflow-hidden bg-white/30 flex items-center justify-center">
              {customer.profileImageUrl ? (
                <img
                  src={customer.profileImageUrl}
                  alt={customer.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl font-medium">
                  {customer.name?.charAt(0) || '?'}
                </span>
              )}
            </div>
            
            {/* ข้อมูลส่วนตัว */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-2xl font-medium">{customer.name}</h1>
              <p className="text-white/80">{customer.role === 'teacher' ? 'อาจารย์' : 'ศิษย์เก่า'}</p>
            </div>
          </div>
        </div>

        {/* ข้อมูลรายละเอียด */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* คอลัมน์ซ้าย - ข้อมูลการติดต่อ */}
            <div className="lg:col-span-1 space-y-6">
              {/* ข้อมูลพื้นฐาน */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h2 className="text-lg font-medium mb-3 text-gray-800">ข้อมูลติดต่อ</h2>
                <p className="text-gray-600">{customer.email}</p>
              </div>
              
              {/* ข้อมูลวิชาเอก */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h2 className="text-lg font-medium mb-3 text-gray-800">วิชาเอก</h2>
                <p className="text-gray-600">{customer.major || 'ไม่ระบุ'}</p>
              </div>
            </div>
            
            {/* คอลัมน์ขวา - ประวัติและรายละเอียด */}
            <div className="lg:col-span-2 space-y-6">
              {/* ประวัติและคำอธิบาย */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h2 className="text-lg font-medium mb-3 text-gray-800">เกี่ยวกับ</h2>
                <p className="text-gray-700">
                  {customer.bio || 'ไม่มีข้อมูลเพิ่มเติม'}
                </p>
              </div>
              
              {/* โปรเจกต์ที่กำลังดำเนินการ */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h2 className="text-lg font-medium mb-3 text-gray-800">โปรเจกต์</h2>
                {/* ในส่วนนี้สามารถแสดงรายการโปรเจกต์ที่ลูกค้ามีได้ ถ้ามีข้อมูล */}
                <p className="text-gray-600">
                  สามารถดูโปรเจกต์ของ {customer.name} ได้ที่หน้าโปรเจกต์บอร์ด
                </p>
                <Link href="/project-board" className="btn-secondary mt-2 inline-block">
                  ไปที่โปรเจกต์บอร์ด
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}