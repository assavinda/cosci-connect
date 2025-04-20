import React from "react"

function ManageProjectsPage() {
  return (
    <div className="flex flex-col">
        <section className="mt-6 p-3 flex flex-col gap-2 bg-primary-blue-500 rounded-xl">
          <h1 className="font-medium text-xl text-white whitespace-nowrap">
            จัดการโปรเจกต์
          </h1>
          <p className="text-white font-light text-wrap">
            จัดการทุกขั้นตอนในทุกโปรเจกต์ของคุณตั้งแต่รับงานจนถึงเสร็จงาน
          </p>
        </section>
    </div>
  )
}
export default ManageProjectsPage