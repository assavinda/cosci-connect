'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import Link from 'next/link';
import Loading from '../../../../components/common/Loading';
import SendMessageButton from '../../../../components/buttons/SendMessageButton';

interface CustomerProject {
  id: string;
  title: string;
  description: string;
  budget: number;
  status: string;
  createdAt: string;
  deadline: string;
}

export default function CustomerProfilePage() {
  const { id } = useParams();
  const customerId = Array.isArray(id) ? id[0] : id; // แปลงจาก ParamValue เป็น string
  const { data: session } = useSession();
  const [customer, setCustomer] = useState(null);
  const [customerProjects, setCustomerProjects] = useState<CustomerProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('open'); // ปรับค่าเริ่มต้นเป็น 'open'

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // ดึงข้อมูลลูกค้า
        const customerResponse = await axios.get(`/api/customers/${customerId}`);
        setCustomer(customerResponse.data);
        
        // ดึงข้อมูลโปรเจกต์ที่ลูกค้าเป็นเจ้าของ
        const projectsResponse = await axios.get('/api/projects', {
          params: {
            status: 'all',
            owner: customerId,
            limit: 100
          }
        });
        
        // ตั้งค่าโปรเจกต์
        setCustomerProjects(projectsResponse.data.projects || []);
        
        setError('');
      } catch (err) {
        console.error('Error fetching customer data:', err);
        setError('ไม่สามารถโหลดข้อมูลลูกค้าได้ กรุณาลองใหม่อีกครั้ง');
      } finally {
        setLoading(false);
      }
    };

    if (customerId) {
      fetchData();
    }
  }, [customerId]);

  // ฟอร์แมตราคาเป็นสกุลเงินบาท
  const formatPrice = (price) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };
  
  // ฟังก์ชันฟอร์แมตวันที่
  const formatDate = (dateString) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString('th-TH', options);
  };
  
  // แปลงสถานะเป็นภาษาไทย
  const getStatusText = (status) => {
    const statusMap = {
      'open': 'เปิดรับสมัคร',
      'in_progress': 'กำลังดำเนินการ',
      'revision': 'กำลังแก้ไข',
      'awaiting': 'รอการยืนยัน',
      'completed': 'เสร็จสิ้น'
    };
    return statusMap[status] || status;
  };
  
  // รับสีสำหรับสถานะ
  const getStatusColor = (status) => {
    const colorMap = {
      'open': 'bg-green-100 text-green-800',
      'in_progress': 'bg-yellow-100 text-yellow-800',
      'revision': 'bg-orange-100 text-orange-800',
      'awaiting': 'bg-indigo-100 text-indigo-800',
      'completed': 'bg-blue-100 text-blue-800'
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  // กรองโปรเจกต์ตาม active tab
  const filteredProjects = customerProjects.filter(project => {
    if (activeTab === 'open') {
      // แสดงโปรเจกต์ที่มีสถานะ 'open'
      return project.status === 'open';
    } else if (activeTab === 'ongoing') {
      // แสดง in_progress, revision, awaiting
      return ['in_progress', 'revision', 'awaiting'].includes(project.status);
    } else {
      // แสดง completed
      return project.status === 'completed';
    }
  });

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
      <div className="max-w-5xl mx-auto p-6 bg-red-50 border border-red-200 rounded-xl my-6 shadow-sm">
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
      <div className="max-w-5xl mx-auto p-6 bg-gray-50 border border-gray-200 rounded-xl my-6 shadow-sm">
        <h2 className="text-lg font-medium mb-4">ไม่พบข้อมูลลูกค้า</h2>
        <p className="text-gray-600 mb-4">ไม่พบข้อมูลลูกค้าที่คุณต้องการดู หรืออาจไม่มีอยู่ในระบบ</p>
        <Link href="/" className="btn-secondary inline-block">
          กลับไปยังหน้าแรก
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto pt-6">
      {/* หัวข้อและปุ่มย้อนกลับ */}
      <div className="flex justify-between items-center">
        <Link href="/" className="text-primary-blue-500 hover:text-primary-blue-600 flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
          กลับไปยังหน้าแรก
        </Link>
      </div>

      {/* Hero section - แสดงข้อมูลสำคัญ (ปรับปรุงตามหน้า freelancer profile) */}
      <div className="relative p-8 overflow-hidden border-b border-gray-200 mb-6 place-items-cente">
        <div className="flex flex-col md:flex-row gap-6 items-center md:items-start relative z-10">
          {/* รูปโปรไฟล์ */}
          <div className="w-24 h-24 lg:w-32 lg:h-32 rounded-full overflow-hidden bg-white flex items-center justify-center outline-8 outline-double outline-primary-blue-500 shadow-lg">
            {customer.profileImageUrl ? (
              <img
                src={customer.profileImageUrl}
                alt={customer.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-primary-blue-300 flex items-center justify-center">
                <span className="text-4xl font-semibold text-white">
                  {customer.name?.charAt(0).toUpperCase() || '?'}
                </span>
              </div>
            )}
          </div>
          
          {/* ข้อมูลพื้นฐาน */}
          <div className="flex-1 text-center md:text-left flex flex-col items-center md:items-start">
            <h1 className="text-l md:text-xl font-semibold">{customer.name}</h1>
            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
              <span className="py-1 rounded-full text-sm text-gray-500">
                {customer.major}
              </span>
            </div>
            <span className="bg-blue-500/20 px-3 py-1 rounded-full text-sm flex items-center gap-1 justify-center md:justify-start mx-auto md:mx-0 w-fit mt-2">
              <span className="w-2 h-2 bg-blue-400 rounded-full inline-block"></span>
              {customer.role === 'teacher' ? 'อาจารย์' : 'ศิษย์เก่า'}
            </span>
          </div>
          
          {/* ปุ่มส่งข้อความ */}
          <div className="flex place-items-center gap-2 self-center md:self-start">
            <div className="flex flex-col gap-2 self-end">
              <div className="w-[263.31px] h-full border border-gray-300 rounded-xl py-3 text-center flex items-center justify-center">
                <p>
                  ราคาโปรเจกต์เฉลี่ย
                  {customerProjects.length > 0 ? (
                    <span className="text-primary-blue-500 font-semibold text-xl block">
                      {formatPrice(customerProjects.reduce((sum, project) => sum + project.budget, 0) / customerProjects.length)}
                    </span>
                  ) : (
                    <span className="text-gray-300 italic text-lg block p-2">
                      ยังไม่มีโปรเจกต์
                    </span>
                  )}
                </p>
              </div>
              
              {session?.user?.id && session.user.id !== customerId && (
                <div className="w-full">
                  <SendMessageButton 
                    recipientId={customerId} 
                    recipientName={customer.name} 
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main content - แสดงข้อมูลและโปรเจกต์ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* คอลัมน์ซ้าย - ข้อมูลส่วนตัว */}
        <div className="lg:col-span-1 space-y-6">
          {/* ข้อมูลพื้นฐาน */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center mb-4 gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary-blue-500">
                <circle cx="12" cy="8" r="5"></circle>
                <path d="M20 21a8 8 0 1 0-16 0"></path>
              </svg>
              <h2 className="text-lg font-semibold">ข้อมูลติดต่อ</h2>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <p className="text-gray-700">{customer.email}</p>
            </div>
          </div>
          
          {/* สถิติโปรเจกต์ */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center mb-4 gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary-blue-500">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
              </svg>
              <h2 className="text-lg font-semibold">สถิติโปรเจกต์</h2>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">โปรเจกต์ทั้งหมด</span>
                  <span className="font-medium">{customerProjects.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">เปิดรับสมัคร</span>
                  <span className="font-medium">
                    {customerProjects.filter(p => p.status === 'open').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">กำลังดำเนินการ</span>
                  <span className="font-medium">
                    {customerProjects.filter(p => ['in_progress', 'revision', 'awaiting'].includes(p.status)).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">เสร็จสิ้น</span>
                  <span className="font-medium">{customerProjects.filter(p => p.status === 'completed').length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* คอลัมน์ขวา - ประวัติและรายละเอียด */}
        <div className="lg:col-span-2 space-y-6">
          {/* ประวัติและคำอธิบาย */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center mb-4 gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary-blue-500">
                <circle cx="12" cy="8" r="5"></circle>
                <path d="M20 21a8 8 0 1 0-16 0"></path>
              </svg>
              <h2 className="text-lg font-semibold">เกี่ยวกับ</h2>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <p className={`${customer.bio ? 'text-gray-700' : 'text-gray-400 italic'}`}>
                {customer.bio || 'ไม่มีข้อมูลเพิ่มเติม'}
              </p>
            </div>
          </div>
          
          {/* แท็บโปรเจกต์ */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {/* Tab navigation - เพิ่มแท็บ "เปิดรับสมัคร" */}
            <div className="flex border-b border-gray-200">
              <button
                className={`flex-1 py-3 px-4 font-medium text-center transition-colors ${
                  activeTab === 'open'
                    ? 'border-b-2 border-primary-blue-500 text-primary-blue-500'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
                onClick={() => setActiveTab('open')}
              >
                โปรเจกต์ที่เปิดรับสมัคร 
                {customerProjects.filter(p => p.status === 'open').length > 0 && (
                  <span className="ml-1 bg-primary-blue-100 text-primary-blue-600 text-xs px-1.5 py-0.5 rounded-full">
                    {customerProjects.filter(p => p.status === 'open').length}
                  </span>
                )}
              </button>
              <button
                className={`flex-1 py-3 px-4 font-medium text-center transition-colors ${
                  activeTab === 'ongoing'
                    ? 'border-b-2 border-primary-blue-500 text-primary-blue-500'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
                onClick={() => setActiveTab('ongoing')}
              >
                กำลังดำเนินการ 
                {customerProjects.filter(p => ['in_progress', 'revision', 'awaiting'].includes(p.status)).length > 0 && (
                  <span className="ml-1 bg-primary-blue-100 text-primary-blue-600 text-xs px-1.5 py-0.5 rounded-full">
                    {customerProjects.filter(p => ['in_progress', 'revision', 'awaiting'].includes(p.status)).length}
                  </span>
                )}
              </button>
              <button
                className={`flex-1 py-3 px-4 font-medium text-center transition-colors ${
                  activeTab === 'completed'
                    ? 'border-b-2 border-primary-blue-500 text-primary-blue-500'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
                onClick={() => setActiveTab('completed')}
              >
                เสร็จสิ้น 
                {customerProjects.filter(p => p.status === 'completed').length > 0 && (
                  <span className="ml-1 bg-primary-blue-100 text-primary-blue-600 text-xs px-1.5 py-0.5 rounded-full">
                    {customerProjects.filter(p => p.status === 'completed').length}
                  </span>
                )}
              </button>
            </div>
            
            {/* Tab content */}
            <div className="p-6">
              {filteredProjects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredProjects.map((project) => (
                    <Link 
                      key={project.id} 
                      href={`/project/${project.id}`}
                      className="block bg-gray-50 rounded-lg p-4 border border-gray-100 hover:border-primary-blue-300 hover:shadow-md transition-all"
                    >
                      <div className="flex justify-between items-start">
                        <h3 className="font-semibold text-primary-blue-500">{project.title}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(project.status)}`}>
                          {getStatusText(project.status)}
                        </span>
                      </div>
                      
                      <div className="mt-3 space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">งบประมาณ</span>
                          <span className="font-medium text-green-600">{formatPrice(project.budget)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">วันที่สร้าง</span>
                          <span className="font-medium">{formatDate(project.createdAt)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">กำหนดส่งงาน</span>
                          <span className="font-medium">{formatDate(project.deadline)}</span>
                        </div>
                      </div>
                      
                      <p className="mt-3 text-gray-600 line-clamp-2 text-sm">{project.description}</p>
                      <div className="mt-2 text-primary-blue-500 text-right text-sm font-medium">
                        ดูรายละเอียด →
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-100">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-gray-400 mb-4">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                  </svg>
                  <p className="text-gray-500 mb-2">
                    {activeTab === 'open' 
                      ? 'ไม่พบโปรเจกต์ที่เปิดรับสมัคร' 
                      : activeTab === 'ongoing'
                      ? 'ไม่พบโปรเจกต์ที่กำลังดำเนินการ'
                      : 'ไม่พบโปรเจกต์ที่เสร็จสิ้น'}
                  </p>
                  <p className="text-gray-400 text-sm">
                    {activeTab === 'open'
                      ? 'คุณสามารถดูโปรเจกต์ที่กำลังดำเนินการในแท็บ "กำลังดำเนินการ"'
                      : activeTab === 'ongoing'
                      ? 'คุณสามารถดูโปรเจกต์ที่เสร็จสิ้นในแท็บ "เสร็จสิ้น"'
                      : 'คุณสามารถดูโปรเจกต์ที่เปิดรับสมัครในแท็บ "เปิดรับสมัคร"'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}