import React from "react"

function InboxButton() {
  return (
    <div className="fixed bottom-0 right-0 m-10 hover:scale-[1.05]">
        <button className="bg-white/80 backdrop-blur-xs text-primary-blue-500 border-2 border-primary-blue-500 shadow-lg hover:text-primary-blue-400 hover:border-primary-blue-400 p-3 w-[56px] font-medium rounded-full">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="1.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                d="M3,12V19.4C3,19.9522 3.44772,20.4 4,20.4H20C20.5523,20.4 21,19.9522 21,19.4V12" 
              />
              <path 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="1.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                d="M3,12L5.394,5.1056C5.5101,4.77825 5.82755,4.6 6.17157,4.6H17.8284C18.1724,4.6 18.4899,4.77825 18.606,5.1056L21,12" 
              />
              <path 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="1.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                d="M9,12L10.8,14.4C11.2944,15.0666 12.2056,15.0666 12.7,14.4L14.5,12" 
              />
              <path 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="1.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                d="M3,12H8.5C8.77614,12 9,12.2239 9,12.5V12.5C9,12.7761 9.22386,13 9.5,13H14.5C14.7761,13 15,12.7761 15,12.5V12.5C15,12.2239 15.2239,12 15.5,12H21" 
              />
            </svg>
        </button>
    </div>
    
  )
}
export default InboxButton