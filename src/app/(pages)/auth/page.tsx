'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import LoginForm from "../../components/auth/login/LoginForm"
import RegisterForm from "../../components/auth/register/RegisterForm"
import React, { useEffect, useState } from "react"

function AuthPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const state = searchParams.get('state') // login หรือ register

    const [authState, setAuthState] = useState<'login' | 'register'>('login')

    useEffect(() => {
        // ถ้าไม่มี query state เลย → redirect เป็น ?state=login
        if (!state) {
            router.replace('?state=login')  // ใช้ replace เพื่อไม่เพิ่มใน history stack
        } else if (state === 'register' || state === 'login') {
            setAuthState(state)
        }
    }, [state, router])

    const toggleAuthState = () => {
        const newState = authState === 'login' ? 'register' : 'login'
        setAuthState(newState)
        router.replace(`?state=${newState}`)
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
export default AuthPage
