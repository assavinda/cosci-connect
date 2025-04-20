import Link from "next/link"
import React from "react"
import OTP from "../otp/OTP"

function LoginForm() {
  return (
    <div className="max-w-[520px] max-h-[640px] w-full h-full bg-white m-3 p-6 flex flex-col gap-4 rounded-xl shadow-md">
        <div>
            <h1 className="text-xl font-medium">ลงชื่อเข้าใช้งาน</h1>
        </div>

        <hr className="text-gray-300"/>

        <form className="flex flex-col gap-4">
            <div>
                <label className="label">อีเมล</label>
                <input type="email" className="input" placeholder="example@g.swu.ac.th"/>
            </div>
            

            <button type="button" className="btn-primary w-full">
                ลงชื่อเข้าใช้
            </button>
            <div className="flex gap-2">
                <p>ยังไม่มีบัญชี ?</p>
                <button type="button" className="text-primary-blue-500 hover:text-primary-blue-400 hover:underline">
                    สร้างบัญชี
                </button>
            </div>
        </form>
    </div>
  )
}
export default LoginForm