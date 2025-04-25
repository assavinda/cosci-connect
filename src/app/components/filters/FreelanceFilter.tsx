'use client';

import React, { useState } from 'react';

interface PriceRange {
    min: number;
    max: number;
}

interface FreelanceFilterProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    selectedSkills: string[];
    onSkillsChange: (skills: string[]) => void;
    selectedMajor: string;
    onMajorChange: (major: string) => void;
    priceRange: PriceRange;
    onPriceRangeChange: (range: PriceRange) => void;
    onApplyFilters: () => void;
    onResetFilters: () => void;
    availableSkills: string[];
    availableMajors: string[];
}

const FreelanceFilter: React.FC<FreelanceFilterProps> = ({
    searchQuery,
    onSearchChange,
    selectedSkills,
    onSkillsChange,
    selectedMajor,
    onMajorChange,
    priceRange,
    onPriceRangeChange,
    onApplyFilters,
    onResetFilters,
    availableSkills,
    availableMajors
}) => {
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    
    const toggleFilter = () => {
        setIsFilterOpen(!isFilterOpen);
    };
    
    const handleSkillToggle = (skill: string) => {
        if (selectedSkills.includes(skill)) {
            onSkillsChange(selectedSkills.filter(s => s !== skill));
        } else {
            onSkillsChange([...selectedSkills, skill]);
        }
    };
    
    const handleMinPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value, 10) || 0;
        onPriceRangeChange({ ...priceRange, min: value });
    };
    
    const handleMaxPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value, 10) || 0;
        onPriceRangeChange({ ...priceRange, max: value });
    };
    
    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            onApplyFilters();
        }
    };
    
    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
            {/* Search bar - always visible */}
            <div className="p-4 flex flex-col md:flex-row gap-3">
                <div className="flex-1 relative">
                    <input 
                        type="text"
                        className="w-full p-2 pl-10 border border-gray-300 rounded-lg"
                        placeholder="ค้นหาฟรีแลนซ์..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        onKeyDown={handleSearchKeyDown}
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                    </div>
                </div>
                
                <div className="flex gap-2">
                    <button 
                        className="btn-secondary flex items-center gap-2"
                        onClick={toggleFilter}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="4" y1="21" x2="4" y2="14"></line>
                            <line x1="4" y1="10" x2="4" y2="3"></line>
                            <line x1="12" y1="21" x2="12" y2="12"></line>
                            <line x1="12" y1="8" x2="12" y2="3"></line>
                            <line x1="20" y1="21" x2="20" y2="16"></line>
                            <line x1="20" y1="12" x2="20" y2="3"></line>
                            <line x1="1" y1="14" x2="7" y2="14"></line>
                            <line x1="9" y1="8" x2="15" y2="8"></line>
                            <line x1="17" y1="16" x2="23" y2="16"></line>
                        </svg>
                        ตัวกรอง
                        {(selectedSkills.length > 0 || selectedMajor || priceRange.min > 0 || priceRange.max < 10000) && (
                            <span className="bg-primary-blue-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                                {selectedSkills.length + (selectedMajor ? 1 : 0) + (priceRange.min > 0 || priceRange.max < 10000 ? 1 : 0)}
                            </span>
                        )}
                    </button>
                    
                    <button 
                        className="btn-primary"
                        onClick={onApplyFilters}
                    >
                        ค้นหา
                    </button>
                </div>
            </div>
            
            {/* Advanced filters - collapsible */}
            {isFilterOpen && (
                <div className="p-4 bg-gray-50 border-t border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Skills filter */}
                        <div>
                            <h3 className="text-gray-700 font-medium mb-2">ทักษะ</h3>
                            <div className="bg-white border border-gray-300 rounded-lg p-3 h-40 overflow-y-auto">
                                <div className="grid grid-cols-2 gap-2">
                                    {availableSkills.map((skill) => (
                                        <div key={skill} className="flex items-center">
                                            <input
                                                type="checkbox"
                                                id={`skill-${skill}`}
                                                checked={selectedSkills.includes(skill)}
                                                onChange={() => handleSkillToggle(skill)}
                                                className="w-4 h-4 text-primary-blue-500 border-gray-300 rounded"
                                            />
                                            <label
                                                htmlFor={`skill-${skill}`}
                                                className="ml-2 text-sm text-gray-700"
                                            >
                                                {skill}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        
                        {/* Major filter */}
                        <div>
                            <h3 className="text-gray-700 font-medium mb-2">วิชาเอก</h3>
                            <select
                                className="w-full p-2 border border-gray-300 rounded-lg bg-white"
                                value={selectedMajor}
                                onChange={(e) => onMajorChange(e.target.value)}
                            >
                                <option value="">ทั้งหมด</option>
                                {availableMajors.map((major) => (
                                    <option key={major} value={major}>
                                        {major}
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        {/* Price range filter */}
                        <div>
                            <h3 className="text-gray-700 font-medium mb-2">ช่วงราคา</h3>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    min="0"
                                    step="100"
                                    className="w-full p-2 border border-gray-300 rounded-lg"
                                    placeholder="ราคาต่ำสุด"
                                    value={priceRange.min || ''}
                                    onChange={handleMinPriceChange}
                                />
                                <span className="text-gray-500">-</span>
                                <input
                                    type="number"
                                    min="0"
                                    step="100"
                                    className="w-full p-2 border border-gray-300 rounded-lg"
                                    placeholder="ราคาสูงสุด"
                                    value={priceRange.max || ''}
                                    onChange={handleMaxPriceChange}
                                />
                            </div>
                        </div>
                    </div>
                    
                    {/* Selected filters & reset button */}
                    <div className="flex justify-between items-center mt-6">
                        <div className="flex flex-wrap gap-2">
                            {selectedSkills.map((skill) => (
                                <span 
                                    key={skill}
                                    className="bg-primary-blue-100 text-primary-blue-600 text-xs px-2 py-1 rounded-lg flex items-center"
                                >
                                    {skill}
                                    <button 
                                        type="button"
                                        onClick={() => handleSkillToggle(skill)}
                                        className="ml-1 text-primary-blue-600 hover:text-primary-blue-800"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="18" y1="6" x2="6" y2="18"></line>
                                            <line x1="6" y1="6" x2="18" y2="18"></line>
                                        </svg>
                                    </button>
                                </span>
                            ))}
                            
                            {selectedMajor && (
                                <span className="bg-primary-blue-100 text-primary-blue-600 text-xs px-2 py-1 rounded-lg flex items-center">
                                    {selectedMajor}
                                    <button 
                                        type="button"
                                        onClick={() => onMajorChange('')}
                                        className="ml-1 text-primary-blue-600 hover:text-primary-blue-800"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="18" y1="6" x2="6" y2="18"></line>
                                            <line x1="6" y1="6" x2="18" y2="18"></line>
                                        </svg>
                                    </button>
                                </span>
                            )}
                            
                            {(priceRange.min > 0 || priceRange.max < 10000) && (
                                <span className="bg-primary-blue-100 text-primary-blue-600 text-xs px-2 py-1 rounded-lg flex items-center">
                                    {priceRange.min} - {priceRange.max} ฿
                                    <button 
                                        type="button"
                                        onClick={() => onPriceRangeChange({ min: 0, max: 10000 })}
                                        className="ml-1 text-primary-blue-600 hover:text-primary-blue-800"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="18" y1="6" x2="6" y2="18"></line>
                                            <line x1="6" y1="6" x2="18" y2="18"></line>
                                        </svg>
                                    </button>
                                </span>
                            )}
                        </div>
                        
                        {/* Reset all filters */}
                        {(selectedSkills.length > 0 || selectedMajor || priceRange.min > 0 || priceRange.max < 10000 || searchQuery) && (
                            <button 
                                className="text-gray-500 text-sm hover:text-red-500 flex items-center gap-1"
                                onClick={onResetFilters}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 6h18"></path>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
                                    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                </svg>
                                ล้างตัวกรอง
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default FreelanceFilter;