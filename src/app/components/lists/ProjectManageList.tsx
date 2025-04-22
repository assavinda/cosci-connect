import React from "react";
import ProjectManageCard from "../cards/ProjectManageCard";

interface Project {
  id: string;
  title: string;
  owner: string;
  status: string;
  progress: number;
}

interface ProjectManageListProps {
  title: string;
  status: string;
  projects: Project[];
  emptyMessage: string;
  onUpdateProgress: (id: string, progress: number) => void;
}

function ProjectManageList({ 
  title, 
  status, 
  projects, 
  emptyMessage, 
  onUpdateProgress 
}: ProjectManageListProps) {
  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-medium text-gray-700">{title}</h2>
        <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">
          {projects.length}
        </span>
      </div>
      
      {projects.length > 0 ? (
        <div className="space-y-3">
          {projects.map((project) => (
            <ProjectManageCard 
              key={project.id} 
              {...project} 
              onUpdateProgress={onUpdateProgress}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg p-6 text-center text-gray-500 border border-dashed border-gray-300">
          <p>{emptyMessage}</p>
        </div>
      )}
    </div>
  );
}

export default ProjectManageList;