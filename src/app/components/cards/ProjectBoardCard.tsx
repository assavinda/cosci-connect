import Link from "next/link"
import React from "react"

function ProjectBoardCard() {
  return (
    <div className="bg-white shadow-md rounded-xl w-full p-3 flex flex-col border-[0.1px] border-gray-300 gap-3 hover:bg-gray-50">
        <div className="flex place-items-center gap-3">
            <div className="truncate">
                <p className="font-medium truncate">ชื่อโปรเจกต์</p>
                <p className="text-xs text-gray-400">
                    โดย: อาจารย์ชื่อ นามสกุล
                </p>
            </div>
        </div>
        <hr className="text-gray-200"/>
        <p className="text-gray-400 text-xs">required skills</p>
        <p className="text-gray-400 truncate">
            คำอธิบาย
        </p>
        <p className="text-gray-400 text-s">งบค่าจ้าง: <span className="text-primary-blue-400">600 ฿</span></p>
        <button className="btn-primary">
            ดูรายละเอียด
        </button>
    </div>
  )
}
export default ProjectBoardCard