import React, { useState } from 'react';
import { RegisterData } from '../RegisterForm';

interface StepMajorAndSkillsProps {
  data: RegisterData;
  updateData: (data: Partial<RegisterData>) => void;
  skillCategories: Record<string, string[]>;
}

function StepMajorAndSkills({ data, updateData, skillCategories }: StepMajorAndSkillsProps) {
  const [activeCategory, setActiveCategory] = useState(Object.keys(skillCategories)[0]);
  
  const majors = [
    "Computer Science",
    "Information Technology",
    "Software Engineering",
    "Business Information Systems",
    "Digital Media",
    "Cybersecurity",
    "Data Science",
    "Artificial Intelligence",
    "Computer Engineering",
    "Graphic Design",
  ];

  const handleMajorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateData({ major: e.target.value });
  };

  const handleSkillToggle = (skill: string) => {
    const updatedSkills = [...data.skills];
    
    if (updatedSkills.includes(skill)) {
      // Remove skill if already selected
      const index = updatedSkills.indexOf(skill);
      updatedSkills.splice(index, 1);
    } else {
      // Add skill if not already selected
      updatedSkills.push(skill);
    }
    
    updateData({ skills: updatedSkills });
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-medium text-gray-800">วิชาเอกและทักษะ</h2>
        <p className="text-gray-500 text-sm">
          {data.role === 'student' 
            ? 'ระบุวิชาเอกและทักษะที่คุณมี' 
            : 'ระบุวิชาเอกของคุณ'}
        </p>
      </div>

      <div>
        <label htmlFor="major" className="block text-gray-700 text-sm mb-1">
          วิชาเอก
        </label>
        <div className="relative">
          <select
            id="major"
            className="input w-full appearance-none pr-10 cursor-pointer bg-white"
            value={data.major}
            onChange={handleMajorChange}
            required
          >
            <option value="" disabled>เลือกวิชาเอก</option>
            {majors.map((major) => (
              <option key={major} value={major}>{major}</option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
            </svg>
          </div>
        </div>
      </div>

      {data.role === 'student' && (
        <div className="mt-2">
          <label className="block text-gray-700 text-sm mb-1">
            ทักษะ
            <span className="text-xs text-gray-500 ml-1">
              (เลือกอย่างน้อย 1 ทักษะ)
            </span>
          </label>
          
          {/* Category tabs */}
          <div className="flex overflow-x-auto pb-2 mb-2 gap-2">
            {Object.keys(skillCategories).map((category) => (
              <button
                key={category}
                type="button"
                className={`px-3 py-1 rounded-lg text-sm whitespace-nowrap ${
                  activeCategory === category
                    ? 'bg-primary-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
          
          {/* Skills selection */}
          <div className="border border-gray-200 rounded-lg p-3 h-45 max-h-45 overflow-y-scroll bg-white shadow-sm">
            <div className="grid grid-cols-2 gap-2">
              {skillCategories[activeCategory].map((skill) => (
                <div key={skill} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`skill-${skill}`}
                    checked={data.skills.includes(skill)}
                    onChange={() => handleSkillToggle(skill)}
                    className="w-4 h-4 text-primary-blue-500 ring-primary-blue-500 border-gray-300 rounded cursor-pointer focus:ring-primary-blue-500"
                  />
                  <label
                    htmlFor={`skill-${skill}`}
                    className="ml-2 text-sm text-gray-600"
                  >
                    {skill}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StepMajorAndSkills;