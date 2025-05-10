'use client'

import { useRouter } from 'next/navigation'
import LoginForm from "../../components/auth/login/LoginForm"
import RegisterForm from "../../components/auth/register/RegisterForm"
import React, { Suspense, useState, useEffect } from "react"

// Create a client component wrapper for useSearchParams
function AuthStateHandler({ onStateChange }: { onStateChange: (state: 'login' | 'register') => void }) {
  const searchParams = useSearchParams()
  
  useEffect(() => {
    const state = searchParams.get('state') 
    if (state === 'login' || state === 'register') {
      onStateChange(state)
    }
  }, [searchParams, onStateChange])
  
  return null
}

// Import useSearchParams in a separate component to use with Suspense
import { useSearchParams } from 'next/navigation'

function AuthPage() {
  const router = useRouter()
  const [authState, setAuthState] = useState<'login' | 'register'>('login')
  
  useEffect(() => {
    // Default to login if no state is present initially
    if (window.location.search === '') {
      router.replace('?state=login', { scroll: false }) 
    }
  }, [router])

  const handleStateChange = (state: 'login' | 'register') => {
    setAuthState(state)
  }
  
  const toggleAuthState = () => {
    const newState = authState === 'login' ? 'register' : 'login'
    setAuthState(newState)
    router.replace(`?state=${newState}`, { scroll: false })
  }
  
  return (
    <div className="w-screen h-screen bg-gradient-to-t from-slate-800 to-primary-blue-500 fixed inset-0 z-[200] flex justify-center place-items-center">
      <Suspense fallback={null}>
        <AuthStateHandler onStateChange={handleStateChange} />
      </Suspense>
      
      {authState === 'login' ? (
        <LoginForm onRegisterClick={toggleAuthState} />
      ) : (
        <RegisterForm onLoginClick={toggleAuthState} />
      )}
    </div>
  )
}

export default AuthPage