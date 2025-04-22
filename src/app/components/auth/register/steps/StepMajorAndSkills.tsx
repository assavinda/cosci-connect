import React, { useState } from 'react';
import { RegisterData } from '../RegisterForm';
import MajorDropdown from './MajorDropdown';

interface StepMajorAndSkillsProps {
  data: RegisterData;
  updateData: (data: Partial<RegisterData>) => void;
  skillCategories: Record<string, string[]>;
}

function StepMajorAndSkills({ data, updateData, skillCategories }: StepMajorAndSkillsProps) {
  const [activeCategory, setActiveCategory] = useState(Object.keys(skillCategories)[0]);
  
  // Array of majors for dropdown
  const majors = [
    { value: "คอมพิวเตอร์เพื่อการสื่อสาร", label: "คอมพิวเตอร์เพื่อการสื่อสาร" },
    { value: "การจัดการธุรกิจไซเบอร์", label: "การจัดการธุรกิจไซเบอร์" },
    { value: "การออกแบบส่ื่อปฏิสัมพันธ์และมัลติมีเดีย", label: "การออกแบบส่ื่อปฏิสัมพันธ์และมัลติมีเดีย" },
    { value: "การสื่อสารเพื่อการท่องเที่ยว", label: "การสื่อสารเพื่อการท่องเที่ยว" },
    { value: "การสื่อสารเพื่อสุขภาพ", label: "การสื่อสารเพื่อสุขภาพ" },
  ];

  const handleMajorChange = (value: string) => {
    updateData({ major: value });
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
        <MajorDropdown
          id="major"
          options={majors}
          value={data.major}
          onChange={handleMajorChange}
          placeholder="เลือกวิชาเอก"
          required
        />
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