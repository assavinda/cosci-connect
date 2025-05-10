import Link from "next/link"
import React from "react"

function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 pt-6 pb-6 px-[40px] text-start flex flex-col gap-4">
        <img src="/logo/cosci-connect-logo.png" alt="cosci:connect" className="w-[136px]"/>
        <p className="text-xs text-gray-500">© 2025 cosci-connect bros , College of Social Communication Innovation Srinakharinwirot University.</p>
    </footer>
  )
}
export default Footer