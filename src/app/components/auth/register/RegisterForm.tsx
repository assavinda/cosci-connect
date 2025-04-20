import React from "react"

function RegisterForm() {
  return (
    <div className="max-w-[520px] max-h-[640px] w-full h-full bg-white m-3 p-6 flex flex-col gap-4 rounded-xl shadow-md">
        <div>
            <h1 className="text-xl font-medium">สร้างบัญชีใหม่</h1>
        </div>

        <hr className="text-gray-300"/>

        <form>
            
            <div className="flex gap-2">
                <p>มีบัญชีอยู่แล้ว ?</p>
                <button type="button" className="text-primary-blue-500 hover:text-primary-blue-400 hover:underline">
                    ลงชื่อเข้าใช้
                </button>
            </div>
        </form>
    </div>
  )
}
export default RegisterForm