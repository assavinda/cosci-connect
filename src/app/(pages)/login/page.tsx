'use client'

import LoginForm from "../../components/auth/login/LoginForm"
import React, { useState } from "react"

function LoginPage() {
    const [state,setState] = useState('Login')

    return (
        <div className="w-screen h-screen bg-gradient-to-t from-slate-800 to-primary-blue-500 fixed inset-0 z-[200] flex justify-center place-items-center">
            <LoginForm/>
        </div>
    )
}
export default LoginPage