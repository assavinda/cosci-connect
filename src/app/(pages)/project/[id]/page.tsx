import ApplyButton from "../../../components/buttons/ApplyButton"
import ProjectManageButtons from "../../../components/buttons/ProjectManageButtons"
import React from "react"

export default function ProjectPage({ params }: { params: { id: string } }) {
  return (
    <div>
        <h1>project {params.id}</h1>
        <ApplyButton/>
        <ProjectManageButtons/>
    </div>
  )
}
