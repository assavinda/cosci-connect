import React from "react"

function AboutUsPage() {
  return (
    <section className="pt-6 flex flex-col gap-12 lg:px-24">
      <div>
        <h2 className="text-l font-medium mb-4">เกี่ยวกับ <span className="text-primary-blue-500">COSCI:CONNECT</span></h2>
        <p className="text-s text-gray-400">
        COSCI : CONNECT คือแพลตฟอร์มฟรีแลนซ์ที่สร้างขึ้นโดยนิสิตจาก วิทยาลัยนวัตกรรมสื่อสารสังคม มหาวิทยาลัยศรีนครินทรวิโรฒ 
        เป็นส่วนหนึ่งของโครงการวิทยานิพนธ์ เรามุ่งมั่นที่จะเชื่อมต่อเครือข่ายระหว่างนิสิต ศิษย์เก่า และอาจารย์ เข้าด้วยกัน เพื่อสร้างโอกาสใน
        การทำงาน พัฒนาทักษะ และ สร้างรายได้ ผ่านโปรเจกต์ที่ตรงกับความสามารถของแต่ละบุคคลสอดคล้องกับทักษะที่ได้ศึกษามา
        </p>
      </div>

      <div>
        <h2 className="text-l font-medium mb-4">จุดมุ่งหมายของเรา</h2>
        <ul className="text-s text-gray-400">
          <li className="list-disc list-inside">
            เพื่อช่วยให้นิสิตค้นหา งานฟรีแลนซ์ ที่ตรงกับทักษะของตน
          </li>
          <li className="list-disc list-inside">
            เปิดโอกาสให้ อาจารย์และศิษย์เก่า สามารถโพสต์งานและหาฟรีแลนซ์ที่เหมาะสม
          </li>
          <li className="list-disc list-inside">
            สร้างคอมมูนิตี้ สำหรับนิสิตที่ต้องการฝึกฝนและต่อยอดความสามารถในสายงาน
          </li>
          <li className="list-disc list-inside">
            เป็นพื้นที่ที่ช่วยให้นิสิตสามารถ สร้างพอร์ตโฟลิโอ และสะสมประสบการณ์จริง รวมถึงหารายได้เสริม
          </li>
        </ul>
      </div>

      <hr className="text-gray-200"/>

      <div className="text-center">
        <h2 className="text-l font-medium mb-4 text-primary-blue-500">ทีมผู้พัฒนา</h2>
        <p className="text-s text-gray-400">
          วิทยาลัยนวัตกรรมสื่อสารสังคม มหาวิทยาลัยศรีนครินทรวิโรฒ <br />
          วิชาเอกนวัตกรรมคอมพิวเตอร์เพื่อการสื่อสารรุ่นที่ 14
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10 md:px-20">
          <div className="shadow-sm rounded-xl">
            <div className="bg-radial from-primary-blue-400 to-primary-blue-600 flex justify-center pt-10 rounded-t-xl">
              <img src="/images/bros/313.png" alt="313" className="h-[360px] object-cover"/>
            </div>
            <div className="flex flex-col gap-2 justify-center text-center p-3">
              <p className="font-medium text-m">พฤหัส อัศวะศิริจินดา</p>
              <p className="text-gray-400">Full-Stack Developer</p>
            </div>
          </div>

          <div className="shadow-sm rounded-xl">
            <div className="bg-radial from-primary-blue-400 to-primary-blue-600 flex justify-center pt-10 rounded-t-xl">
              <img src="/images/bros/304.png" alt="304" className="h-[360px] object-cover"/>
            </div>
            <div className="flex flex-col gap-2 justify-center text-center p-3">
              <p className="font-medium text-m">ณัฐภัทร อังชวาลา</p>
              <p className="text-gray-400">UX/UI Designer</p>
            </div>
          </div>

          <div className="shadow-sm rounded-xl">
            <div className="bg-radial from-primary-blue-400 to-primary-blue-600 flex justify-center pt-10 rounded-t-xl">
              <img src="/images/bros/408.png" alt="408" className="h-[360px] object-cover"/>
            </div>
            <div className="flex flex-col gap-2 justify-center text-center p-3">
              <p className="font-medium text-m">ปรัชญ์ เติมศรีสุข</p>
              <p className="text-gray-400">UX/UI Designer</p>
            </div>
          </div>
          
        </div>
      </div>
    </section>
  )
}
export default AboutUsPage