'use client'

import LoginForm from "../../components/auth/login/LoginForm"
import RegisterForm from "../../components/auth/register/RegisterForm"
import React, { useState } from "react"

function LoginPage() {
    const [authState, setAuthState] = useState<'login' | 'register'>('login')

    const toggleAuthState = () => {
        setAuthState(authState === 'login' ? 'register' : 'login')
    }

    return (
        <div className="w-screen h-screen bg-gradient-to-t from-slate-800 to-primary-blue-500 fixed inset-0 z-[200] flex justify-center place-items-center">
            {authState === 'login' ? (
                <LoginForm onRegisterClick={toggleAuthState} />
            ) : (
                <RegisterForm onLoginClick={toggleAuthState} />
            )}
        </div>
    )
}
export default LoginPage