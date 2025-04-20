'use client'
import Link from "next/link"
import { usePathname } from "next/navigation"
import React from "react";
import { useState, useEffect } from "react"

interface NavItem {
  name: string;
  path: string;
}

interface BurgerIconProps {
  isMenuOpen: boolean;
}

const navItems: NavItem[] = [
  { name: 'หน้าหลัก', path: '/' },
  { name: 'ค้นหาฟรีแลนซ์', path: '/find-freelance' },
  { name: 'โปรเจกต์บอร์ด', path: '/project-board' },
  { name: 'จัดการโปรเจกต์', path: '/manage-projects'},
  { name: 'เกี่ยวกับเรา', path: '/about-us'}
]

function BurgerIcon({ isMenuOpen }: BurgerIconProps) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-gray-400 transition-all duration-500"
    >
      {isMenuOpen ? (
        // X icon when menu is open
        <>
          <line
            x1="5"
            y1="5"
            x2="19"
            y2="19"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="transition-all duration-300 ease-in-out"
          />
          <line
            x1="19"
            y1="5"
            x2="5"
            y2="19"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="transition-all duration-300 ease-in-out"
          />
        </>
      ) : (
        // Burger icon when menu is closed
        <>
          <line
            x1="4"
            y1="6"
            x2="20"
            y2="6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="transition-all duration-300 ease-in-out"
          />
          <line
            x1="4"
            y1="12"
            x2="20"
            y2="12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="transition-all duration-300 ease-in-out"
          />
          <line
            x1="4"
            y1="18"
            x2="20"
            y2="18"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="transition-all duration-300 ease-in-out"
          />
        </>
      )}
    </svg>
  )
}

function BellIcon() {
  return (
    <svg
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-gray-400 transition-transform duration-300 hover:rotate-12 hover:scale-110"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* กระดิ่ง - เส้นเดียวแบบมินิมอล */}
      <path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" />
      {/* ส่วนที่แกว่งไปมาข้างใน */}
      <path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21" />
    </svg>
  );
}

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false)
  const [isScrolled, setIsScrolled] = useState<boolean>(false)
  const [navHeight, setNavHeight] = useState<number>(72) // ประมาณความสูงของ navbar
  
  const toggleMenuOpen = (): void => {
    setIsMenuOpen(!isMenuOpen)
    // Prevent scrolling when menu is open
    if (!isMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'auto'
    }
  }
  
  const pathname = usePathname()
  
  // Get navbar height on mount and resize
  useEffect(() => {
    const updateNavHeight = (): void => {
      const navElement = document.getElementById('main-navbar')
      if (navElement) {
        setNavHeight(navElement.offsetHeight)
      }
    }
    // Initial measurement
    updateNavHeight()
    // Update on resize
    window.addEventListener('resize', updateNavHeight)
    return () => window.removeEventListener('resize', updateNavHeight)
  }, [])
  
  // Add scroll effect
  useEffect(() => {
    const handleScroll = (): void => {
      if (window.scrollY > 20) {
        setIsScrolled(true)
      } else {
        setIsScrolled(false)
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])
  
  // Clean up body style when component unmounts
  useEffect(() => {
    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [])
  
  return (
    <>
      <nav
        id="main-navbar"
        className={`w-screen h-fit backdrop-blur-xs shadow py-4 px-4 md:px-4 lg:px-4 xl:px-12 fixed top-0 flex justify-between z-50 ${
          isScrolled
            ? 'bg-white/90 shadow-md shadow-gray-400/25 rounded-b-xl'
            : 'bg-white/80'
        }`}
      >
        <div className="flex place-items-center gap-8">
          <button
            onClick={toggleMenuOpen}
            className="sm:hidden hover:text-primary-blue-400 transition-colors p-1 rounded-full hover:bg-gray-100"
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          >
            <BurgerIcon isMenuOpen={isMenuOpen}/>
          </button>
          <Link href={'/'} className="transform transition-transform hover:scale-105">
            <h1 className="text-2xl font-medium">connect</h1>
          </Link>
          <div className="hidden gap-8 sm:flex">
            {navItems.map((item) => (
              <Link
              key={item.path}
              href={item.path}
              className={`text-s font-normal hover:text-primary-blue-400 transition-all duration-200 relative after:absolute after:bottom-[-5px] after:left-0 after:h-[2px] after:bg-primary-blue-400 after:transition-all after:duration-300 ${
                pathname === item.path
                ? 'text-primary-blue-400 after:w-full'
                : 'text-gray-400 after:w-0 hover:after:w-full'
              } ${!isMenuOpen && item.path === '/' ? 'hidden' : ''}`}
              >
              {item.name}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex place-items-center gap-6">
          <button className="p-1 rounded-full hover:bg-gray-100 transition-all duration-200">
            <BellIcon/>
          </button>
          {/* profile Image */}
          <div className="rounded-full bg-gray-400 size-10 hover:shadow-md transition-all duration-300 cursor-pointer hover:scale-105"></div>
        </div>
      </nav>
      {/* Overlay when mobile menu is open - ตอนนี้จะเริ่มต้นจากด้านล่างของ navbar */}
      <div
        style={{ top: `${navHeight}px` }}
        className={`fixed left-0 right-0 bottom-0 bg-black/10 backdrop-blur-sm transition-opacity duration-300 sm:hidden z-30 ${
          isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={toggleMenuOpen}
      ></div>
      {/* Mobile Menu - slide-in animation */}
      <div
        style={{ top: `${navHeight}px` }}
        className={`fixed left-0 w-full max-h-[calc(100vh-${navHeight}px)] bg-white shadow-lg rounded-b-2xl z-40 sm:hidden transition-all duration-500 ease-in-out overflow-auto ${
          isMenuOpen ? 'translate-y-0 opacity-100' : 'translate-y-[-20px] opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex flex-col p-2">
          {navItems.map((item, index) => (
            <Link
              key={item.path}
              href={item.path}
              className={`py-3 px-4 text-s font-normal hover:bg-gray-100 rounded-xl transition-all duration-100 ${pathname === item.path ? 'text-primary-blue-400' : 'text-gray-400'}`}
              onClick={() => setIsMenuOpen(false)}
              style={{
                transitionDelay: `${index * 50}ms`,
                opacity: isMenuOpen ? 1 : 0,
                transform: isMenuOpen
                  ? 'translateY(0)'
                  : 'translateY(-20px)'
              }}
            >
              {item.name}
            </Link>
          ))}
        </div>
      </div>
    </>
  )
}

export default Navbar