import React from "react"

function FreelanceCard() {
  return (
    <div className="bg-white shadow-md rounded-xl w-full p-3 flex flex-col border-[0.1px] border-gray-300 gap-3 hover:bg-gray-50">
        <div className="flex place-items-center gap-3">
            <div className="bg-gray-400 size-10 rounded-full shadow-sm"></div>
            <div className="truncate">
                <p className="font-medium truncate">ชื่อจริง นามสกุล</p>
                <p className="text-xs text-gray-400">วิชาเอก</p>
            </div>
        </div>
        <hr className="text-gray-200"/>
        <p className="text-gray-400 text-xs">freelancer's skills</p>
        <div className="w-full h-44 rounded-xl bg-gray-400 flex justify-end place-items-end relative">
          <div className="absolute bg-gradient-to-t from-black/50 w-full rounded-b-xl">
            <p className="text-white m-2 text-end text-xs">ตัวอย่างผลงาน</p>
          </div>
          
        </div>
        <p className="text-gray-400 text-s">ราคาเริ่มต้น: <span className="text-primary-blue-400">600 ฿</span></p>
        <button className="btn-primary">
            ดูโปรไฟล์
        </button>
    </div>
  )
}
export default FreelanceCard