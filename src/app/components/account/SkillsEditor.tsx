'use client';

import React, { useState } from 'react';
import { skillCategories } from '../auth/register/RegisterForm';

interface SkillsEditorProps {
  selectedSkills: string[];
  onSkillsChange: (skills: string[]) => void;
}

const SkillsEditor: React.FC<SkillsEditorProps> = ({ selectedSkills, onSkillsChange }) => {
  const [activeCategory, setActiveCategory] = useState(Object.keys(skillCategories)[0]);

  // Toggle skill selection
  const toggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      onSkillsChange(selectedSkills.filter(s => s !== skill));
    } else {
      onSkillsChange([...selectedSkills, skill]);
    }
  };

  return (
    <div>
      <h3 className="text-lg font-medium mb-3">ทักษะ</h3>
      
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
                checked={selectedSkills.includes(skill)}
                onChange={() => toggleSkill(skill)}
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
      
      {/* Selected skills */}
      <div className="mt-3">
        <p className="text-sm text-gray-500 mb-2">ทักษะที่เลือก ({selectedSkills.length})</p>
        <div className="flex flex-wrap gap-2">
          {selectedSkills.map(skill => (
            <span 
              key={skill}
              className="bg-primary-blue-100 text-primary-blue-600 text-xs px-2 py-1 rounded-lg flex items-center"
            >
              {skill}
              <button 
                type="button"
                onClick={() => toggleSkill(skill)} 
                className="ml-1 text-primary-blue-600 hover:text-primary-blue-800 transition-colors"
                aria-label={`ลบทักษะ ${skill}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SkillsEditor;