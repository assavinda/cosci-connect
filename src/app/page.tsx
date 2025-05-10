import Link from "next/link";
import React from "react";
// ใช้ img tag ธรรมดาตามโค้ดเดิม

// แยกข้อมูลเป็น Constants เพื่อให้ง่ายต่อการจัดการและบำรุงรักษา
const FEATURES = [
  {
    id: "search",
    title: "ค้นหา",
    description: "ครอบคลุมทั้งฟรีแลนซ์และผู้ว่าจ้าง มีการกรองหมวดหมู่งานอย่างชัดเจน",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
    bgColor: "bg-blue-100",
  },
  {
    id: "project-board",
    title: "โปรเจกต์บอร์ด",
    description: "ผู้จ้างสามารถโพสต์ประกาศหางาน โดยกำหนดทักษะและงบประมาณ",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    bgColor: "bg-indigo-100",
  },
  {
    id: "chat",
    title: "แชทในแพลตฟอร์ม",
    description: "ผู้ว่าจ้างและฟรีแลนซ์สามารถพูดคุยรายละเอียดงานได้โดยตรงผ่านแชทในตัว",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    ),
    bgColor: "bg-purple-100",
  },
  {
    id: "dashboard",
    title: "แดชบอร์ด",
    description: "ผู้ว่าจ้างและฟรีแลนซ์สามารถดูสถานะงานรวมถึง คำขอร่วมงานได้ในแดชบอร์ด",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
      </svg>
    ),
    bgColor: "bg-green-100",
  },
];

const CATEGORIES = [
  {
    id: "creative",
    title: "Creative & Design",
    description: "Graphic Design, Motion Graphics, UI/UX Design, Branding & Logo Design",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-pink-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
    ),
    bgColor: "bg-pink-100",
  },
  {
    id: "it-dev",
    title: "IT & Development",
    description: "Web Development , Mobile App Development , Game Development , AI & Machine Learning",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
    bgColor: "bg-blue-100",
  },
  {
    id: "media",
    title: "Media Production",
    description: "Photography, Video Editing, Animation (2D/3D), Content Creation, Film & Movie",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
    bgColor: "bg-red-100",
  },
  {
    id: "marketing",
    title: "Sales & Marketing",
    description: "Social Media Management, Digital Marketing, Content Marketing, SEO/SEM Services",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    bgColor: "bg-yellow-100",
  },
  {
    id: "education",
    title: "Education & Training",
    description: "Online Tutoring, Educational Content Creation, E-Learning Course",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    bgColor: "bg-green-100",
  },
  {
    id: "research",
    title: "Research & Analysis",
    description: "Graphic Design, Motion Graphics, UI/UX Design, Branding & Logo Design",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    bgColor: "bg-purple-100",
  },
  {
    id: "writing",
    title: "Writing & Translation",
    description: "Graphic Design, Motion Graphics, UI/UX Design, Branding & Logo Design",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
    bgColor: "bg-indigo-100",
  },
];

const HOW_TO_CLIENT = [
  {
    id: "client-1",
    title: "ค้นหาฟรีแลนซ์",
    description: "เลือกหมวดหมู่งานที่สนใจ ค้นหาฟรีแลนซ์ผ่านโปรไฟล์ฟรีแลนซ์ตามทักษะความสามารถและผลงานที่แสดง",
    image: "/images/howto/howto1.png",
  },
  {
    id: "client-2",
    title: "สร้างโปรเจกต์ในโปรเจกต์บอร์ด",
    description: "ระบุประเภทงาน งบประมาณประมาณค่าจ้าง ทักษะความสามารถที่ต้องการ รอคำขอจากฟรีแลนซ์",
    image: "/images/howto/howto2.png",
  },
  {
    id: "client-3",
    title: "ค้นหาฟรีแลนซ์",
    description: "พูดคุยกับฟรีแลนซ์ผ่านแชท ตรวจสอบสถานะงาน และกดยืนยันงานเสร็จสิ้นหลังได้รับงานที่พอใจ",
    image: "/images/howto/howto3.png",
  },
];

const HOW_TO_FREELANCER = [
  {
    id: "freelancer-1",
    title: "สร้างโปรไฟล์",
    description: "กรอกข้อมูล ชื่อ-สกุล ทักษะ ค่าจ้าง เพิ่มพอร์ตโฟลิโอและอัปโหลดผลงานที่เคยทำลงหน้าแก้ไขโปรไฟล์",
    image: "/images/howto/howto4.png",
  },
  {
    id: "freelancer-2",
    title: "วิธีหางาน",
    description: "โพสผลงานในหน้าโปรไฟล์เพื่อให้แสดงในหน้าค้นหาฟรีแลนซ์หรือค้นหางานจากโปรเจกต์บอร์ด",
    image: "/images/howto/howto5.png",
  },
  {
    id: "freelancer-3",
    title: "อัพเดทสถานะงาน",
    description: "อัพเดทสถานะงานให้ลูกค้าอย่างต่อเนื่องผ่านแดชบอร์ดพูดคุยรายละเอียดงานผ่านแชท และกดยืนยันเมื่องานเสร็จ",
    image: "/images/howto/howto6.png",
  },
];

// แยกเป็น Components ย่อย
const FeatureCard = ({ title, description, icon, bgColor }) => (
  <div className="bg-white shadow-md text-start rounded-lg w-full p-6 flex flex-col border-[0.1px] border-gray-300 gap-3 hover:bg-gray-50 transition-colors duration-200">
    <div className="flex flex-col items-center mb-3">
      <div className={`${bgColor} rounded-full p-3 mb-2`}>
        {icon}
      </div>
      <h4 className="text-m font-medium text-primary-blue-500">{title}</h4>
    </div>
    <p className="text-gray-400 text-sm">{description}</p>
  </div>
);

const HowToCard = ({ title, description, image }) => (
  <div className="bg-white shadow-md text-start place-items-center rounded-lg w-full p-3 flex flex-col lg:flex-row border-[0.1px] border-gray-300 gap-3 hover:bg-gray-50 transition-colors duration-200">
          <img src={image} alt="cosci:connect" className="w-80"/>
    <div>
      <h4 className="text-m font-medium text-primary-blue-500">{title}</h4>
      <p className="text-gray-400 text-sm">{description}</p>
    </div>
  </div>
);

export default function Home() {
  return (
    <div className="mt-6 lg:px-24">
      {/* Hero section */}
      <section className="grid grid-cols-1 md:grid-cols-2 border-b border-gray-200 pb-6">
        <div className="flex justify-center place-items-center">
          <div className="flex flex-col items-center text-center md:items-start md:text-start w-fit">
            <h1 className="text-l md:text-xl font-medium">
              <span className="text-primary-blue-500">COSCI-CONNECT</span> ฟรีแลนซ์แพลตฟอร์ม <br className="hidden md:block"/>
              สำหรับนิสิต อาจารย์ และศิษย์เก่าชาวนวัต
            </h1>
            <p className="mt-4 text-s text-gray-400">
              แพลตฟอร์มหางาน/จ้างงาน สำหรับนิสิตนวัตกรรมสื่อสารสังคม <br className="hidden md:block"/>
              เพื่อเป็นช่องทางในการหารายได้เสริมระหว่างศึกษา <br className="hidden md:block"/>
              รวมถึงแสดงผลงานและทักษะความสามารถเพื่อใช้ในการหางานในอนาคต
            </p>
            <div className="flex gap-4 mt-6">
              <Link href="/find-freelance">
                <button className="btn-primary transition-all hover:opacity-90">
                  จ้างฟรีแลนซ์
                </button>
              </Link>
              
              <Link href="/project-board">
                <button className="btn-secondary transition-all hover:opacity-90">
                  ค้นหาโปรเจกต์
                </button>
              </Link>
            </div>
          </div>
        </div>
        <div className="hidden md:flex justify-center">
          <img src="/images/heroImage.png" alt="cosci:connect" className="w-full"/>
        </div>
      </section>

      {/* Features section */}
      <section className="w-full flex flex-col gap-6 mt-20 justify-center text-center">
        <h2 className="text-l font-medium text-primary-blue-500">ฟีเจอร์ของเรา</h2>
        <p className="text-s text-gray-400">
          เราต้องการให้เว็บไซต์ของเราใช้งานได้ง่าย สะดวกต่อการใช้งาน ทั้งสำหรับ
          ฝั่งนิสิต ศิษย์เก่า รวมถึงอาจารย์ <br /> โดยมีฟีเจอรหลักที่เอื้ออำนวยต่อการ
          โพสประกาศทั้งฝ่ายหางานและจ้างงาน ช่องแชทในตัวและการแจ้งเตือน <br />
          รวมถึงแดชบอร์ดที่เอาไว้ใช้ในการติดตามสถานะงาน รวมถึงคำขอร่วมงาน
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {FEATURES.map((feature) => (
            <FeatureCard 
              key={feature.id}
              title={feature.title}
              description={feature.description}
              icon={feature.icon}
              bgColor={feature.bgColor}
            />
          ))}
        </div>
      </section>

      {/* Categories section */}
      <section className="w-full flex flex-col gap-4 mt-20 justify-center text-center">
        <h2 className="text-l font-medium mb-4 text-primary-blue-500">หมวดหมู่งานที่น่าสนใจ</h2>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {CATEGORIES.slice(0, 4).map((category) => (
            <FeatureCard 
              key={category.id}
              title={category.title}
              description={category.description}
              icon={category.icon}
              bgColor={category.bgColor}
            />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:mx-28">
          {CATEGORIES.slice(4, 7).map((category) => (
            <FeatureCard 
              key={category.id}
              title={category.title}
              description={category.description}
              icon={category.icon}
              bgColor={category.bgColor}
            />
          ))}
        </div>
      </section>

      {/* How to use section */}
      <section className="w-full flex flex-col gap-4 mt-20 justify-center text-center">
        <h2 className="text-l font-medium mb-4 text-primary-blue-500">แนะนำการใช้งาน</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <h3 className="text-s mb-8 text-primary-blue-500 w-full bg-primary-blue-100 rounded-lg p-3 font-medium">
              สำหรับผู้ว่าจ้าง
            </h3>
            <div className="grid grid-rows-3 gap-4">
              {HOW_TO_CLIENT.map((item) => (
                <HowToCard 
                  key={item.id}
                  title={item.title}
                  description={item.description}
                  image={item.image}
                />
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-s mb-8 text-primary-blue-500 w-full bg-primary-blue-100 rounded-lg p-3 font-medium">
              สำหรับฟรีแลนซ์
            </h3>
            <div className="grid grid-rows-3 gap-4">
              {HOW_TO_FREELANCER.map((item) => (
                <HowToCard 
                  key={item.id}
                  title={item.title}
                  description={item.description}
                  image={item.image}
                />
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}