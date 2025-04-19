import React from "react";
import FreelanceList from "../../components/lists/FreelanceList";

export default function FindFreelancePage() {
    return (
      <div className="flex flex-col gap-3">
        {/* page title */}
        <section className="mt-6 flex flex-col gap-2">
          <h1 className="font-medium text-xl text-primary-blue-500 whitespace-nowrap">
            ค้นหาฟรีแลนซ์
          </h1>
          <p className="text-gray-400 font-light text-wrap">
            ค้นหาฟรีแลนซ์จากทักษะความสามารถที่ตอบโจทย์ไอเดียของคุณ
          </p>
        </section>

        {/* filter */}
        <section className="mt-6 flex flex-col">

          <p className="font-medium">Filtered by:</p>
        </section>

        <hr className="text-gray-300"/>

        {/* freelance list */}
        <FreelanceList/>
      </div>
    );
}