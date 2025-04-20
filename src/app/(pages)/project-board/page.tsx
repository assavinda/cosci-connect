import ProjectBoardList from "../../components/lists/ProjectBoardList";
import React from "react"

function ProjectBoardPage() {

    const totalProjects = 56;

  return (
    <div className="flex flex-col gap-3">
        {/* page title */}
        <section className="mt-6 flex gap-6 flex-col md:flex-row justify-between place-items-end">
            <div className="flex flex-col gap-2">
                <h1 className="font-medium text-xl text-primary-blue-500 whitespace-nowrap">
                    โปรเจกต์บอร์ด
                </h1>
                <p className="text-gray-400 font-light text-wrap">
                    โพสต์งานหรือโปรเจกต์เพื่อหาฟรีแลนซ์สำหรับทำโปรเจกต์ของคุณ
                </p>
            </div>
            <button className="btn-primary w-full md:w-fit">
                โพสต์งานใหม่
            </button>
        </section>

        {/* filter */}
        <section className="mt-6 flex flex-col">
            <p className="font-light text-gray-400">Filtered by</p>
        </section>

        <hr className="text-gray-300"/>

        <ProjectBoardList 
          totalItems={totalProjects} 
        />
    </div>
  )
}
export default ProjectBoardPage