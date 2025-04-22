import React from "react"

const NewProjectModal = ({ isOpen, onClose, onSubmit }) => {
  return (
    <div>
      
    </div>
  )
}

function NewProjectButton() {
  return (
    //ปุ่มโพสต์งานใหม่ สำหรับให้อาจารย์และศิษย์เก่าโพสต์งานในหน้าโปรเจกต์บอร์ด โดยเมื่อกดแล้วจะมีป๊อปอัพให้กรอกข้อมูลของโปรเจกต์ก่อนแล้วจึงกดโพสต์
    <div>
        <button className="btn-primary w-full md:w-fit">
            โพสต์งานใหม่
        </button>
    </div>
  )
}
export default NewProjectButton