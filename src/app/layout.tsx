import React from "react";
import Navbar from "./components/nav/Navbar";
import "./css/globals.css";
import { ReactNode } from "react";
import Footer from "./components/footer/Footer";
import InboxButton from "./components/float/InboxButton";

export const metadata = {
  title: "COSCI-CONNECT",
  description: "ระบบจับคู่นักศึกษาและอาจารย์กับฟรีแลนซ์",
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="th">
      <body>
        <Navbar />
        <div className="py-20 px-4 md:px-4 lg:px-4 xl:px-12 min-h-screen">
          {children}
        </div>
        <Footer/>
        <InboxButton/>
      </body>
    </html>
  );
}