import HireButton from "../../../components/buttons/HireButton"
import React from "react"

export default function UserProfilePage() {
  return (

    <div>
        <h1>ชื่อ นามสกุล</h1>
        <p>บทบาท</p>
        {/* ถ้า user คนนี้เป็นฟรีแลนซ์ ให้ขึ้นปุ่มนี้*/}
        <HireButton/>
        
        portfolio

        ภาพตัวอย่างผลงาน 6 รูป
    </div>
  )
}
