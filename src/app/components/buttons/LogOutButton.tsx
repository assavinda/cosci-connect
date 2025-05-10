// src/app/components/buttons/LogOutButton.tsx
'use client';

import { signOut } from "next-auth/react";
import React, { useState } from "react";

function LogOutButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    await signOut({ callbackUrl: '/' });
  };

  return (
    <button
      onClick={handleLogout}
      className="btn-danger flex items-center justify-center gap-2"
      disabled={isLoading}
    >
      {isLoading ? (
        <span className="inline-block h-4 w-4 border-2 border-gray-500 border-r-transparent rounded-full animate-spin"></span>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
          <polyline points="16 17 21 12 16 7"></polyline>
          <line x1="21" y1="12" x2="9" y2="12"></line>
        </svg>
      )}
      ออกจากระบบ
    </button>
  );
}

export default LogOutButton;