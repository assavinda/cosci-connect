'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PriceRange {
    min: number;
    max: number | null;
}

interface ProjectFilterProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    selectedSkills: string[];
    onSkillsChange: (skills: string[]) => void;
    priceRange: PriceRange;
    onPriceRangeChange: (range: PriceRange) => void;
    onApplyFilters: () => void;
    onResetFilters: () => void;
    availableSkills: string[];
}

const ProjectFilter: React.FC<ProjectFilterProps> = ({
    searchQuery,
    onSearchChange,
    selectedSkills,
    onSkillsChange,
    priceRange,
    onPriceRangeChange,
    onApplyFilters,
    onResetFilters,
    availableSkills
}) => {
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [skillSearch, setSkillSearch] = useState('');
    const [filteredSkills, setFilteredSkills] = useState<string[]>(availableSkills);
    
    // ใช้ useEffect เพื่อกรองทักษะเมื่อมีการเปลี่ยนแปลง skillSearch หรือ availableSkills
    useEffect(() => {
        if (skillSearch) {
            setFilteredSkills(availableSkills.filter(skill => 
                skill.toLowerCase().includes(skillSearch.toLowerCase())
            ));
        } else {
            setFilteredSkills(availableSkills);
        }
    }, [skillSearch, availableSkills]);
    
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
        const inputValue = e.target.value.trim();
        const value = inputValue === '' ? null : parseInt(inputValue, 10) || 0;
        onPriceRangeChange({ ...priceRange, max: value });
    };
    
    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            onApplyFilters();
        }
    };
    
    return (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden mb-6 transition-all duration-300">
            {/* Search bar - always visible */}
            <div className="p-2 flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative group">
                    <input 
                        type="text"
                        className="w-full p-1.5 pl-12 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white transition-all duration-300 focus:ring-2 focus:ring-primary-blue-300 focus:border-primary-blue-500 focus:outline-none placeholder:text-gray-400"
                        placeholder="ค้นหาโปรเจกต์..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        onKeyDown={handleSearchKeyDown}
                    />
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-blue-500 transition-colors duration-300">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                    </div>
                </div>
                
                <div className="flex gap-3">
                    <button 
                        className={`flex items-center gap-2 px-5 rounded-xl transition-all duration-300 ${
                            isFilterOpen 
                            ? 'bg-primary-blue-50 text-primary-blue-600 bg-primary-blue-100' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
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
                        {(selectedSkills.length > 0 || priceRange.min > 0 || priceRange.max !== null) && (
                            <span className="flex items-center justify-center ml-1 w-5 h-5 bg-primary-blue-500 text-white text-xs font-semibold rounded-full">
                                {selectedSkills.length + ((priceRange.min > 0 || priceRange.max !== null) ? 1 : 0)}
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
            <AnimatePresence>
                {isFilterOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                    >
                        <div className="p-5 bg-gray-50 border-t border-gray-100">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Skills filter */}
                                <div>
                                    <h3 className="text-gray-700 font-medium mb-3 flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-primary-blue-500">
                                            <polygon points="14 2 18 6 7 17 3 17 3 13 14 2"></polygon>
                                            <line x1="3" y1="22" x2="21" y2="22"></line>
                                        </svg>
                                        ทักษะที่ต้องการ
                                    </h3>
                                    <div className="flex flex-col bg-white border border-gray-200 rounded-xl overflow-hidden">
                                        <div className="p-1.5 border-b border-gray-100">
                                            <input
                                                type="text"
                                                className="w-full p-2 pl-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-blue-300 placeholder:text-gray-400 text-sm"
                                                placeholder="ค้นหาทักษะ..."
                                                value={skillSearch}
                                                onChange={(e) => setSkillSearch(e.target.value)}
                                            />
                                        </div>
                                        <div className="p-1.5 h-40 overflow-y-auto">
                                            {filteredSkills.length > 0 ? (
                                                <div className="grid grid-cols-2 gap-2">
                                                    {filteredSkills.map((skill) => (
                                                        <div key={skill} className="flex items-center">
                                                            <div className="relative flex items-center">
                                                                <input
                                                                    type="checkbox"
                                                                    id={`skill-${skill}`}
                                                                    checked={selectedSkills.includes(skill)}
                                                                    onChange={() => handleSkillToggle(skill)}
                                                                    className="w-4 h-4 opacity-0 absolute"
                                                                />
                                                                <div className={`w-4 h-4 flex items-center justify-center mr-2 border rounded transition-all ${
                                                                    selectedSkills.includes(skill) 
                                                                    ? 'bg-primary-blue-500 border-primary-blue-600' 
                                                                    : 'border-gray-300 bg-white'
                                                                }`}>
                                                                    {selectedSkills.includes(skill) && (
                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                                            <polyline points="20 6 9 17 4 12"></polyline>
                                                                        </svg>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <label
                                                                htmlFor={`skill-${skill}`}
                                                                className="text-sm text-gray-700 cursor-pointer hover:text-primary-blue-600"
                                                            >
                                                                {skill}
                                                            </label>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                                                    ไม่พบทักษะที่ค้นหา
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Price range filter */}
                                <div>
                                    <h3 className="text-gray-700 font-medium mb-3 flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-primary-blue-500">
                                            <circle cx="12" cy="12" r="10"></circle>
                                            <line x1="12" y1="8" x2="12" y2="12"></line>
                                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                        </svg>
                                        ช่วงงบประมาณ (บาท)
                                    </h3>
                                    <div className="flex items-center gap-3">
                                        <div className="relative flex-1">
                                            <input
                                                type="number"
                                                min="0"
                                                step="100"
                                                className="w-full p-2 pl-8 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary-blue-300 focus:border-primary-blue-500"
                                                placeholder="ต่ำสุด"
                                                value={priceRange.min || ''}
                                                onChange={handleMinPriceChange}
                                            />
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                                ฿
                                            </div>
                                        </div>
                                        <span className="text-gray-500">-</span>
                                        <div className="relative flex-1">
                                            <input
                                                type="number"
                                                min="0"
                                                step="100"
                                                className="w-full p-2 pl-8 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary-blue-300 focus:border-primary-blue-500"
                                                placeholder="ไม่จำกัด"
                                                value={priceRange.max === null ? '' : priceRange.max}
                                                onChange={handleMaxPriceChange}
                                            />
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                                ฿
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Selected filters & reset button */}
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-6 pt-4 border-t border-gray-200">
                                <div className="flex flex-wrap gap-2 mb-3 sm:mb-0">
                                    {selectedSkills.length > 0 || priceRange.min > 0 || priceRange.max !== null ? (
                                        <>
                                            <span className="text-sm text-gray-500 py-1">ตัวกรองที่เลือก:</span>
                                            
                                            {selectedSkills.map((skill) => (
                                                <span 
                                                    key={skill}
                                                    className="bg-primary-blue-50 text-primary-blue-600 text-sm px-3 py-1 rounded-lg flex items-center group transition-all"
                                                >
                                                    {skill}
                                                    <button 
                                                        type="button"
                                                        onClick={() => handleSkillToggle(skill)}
                                                        className="ml-2 text-primary-blue-400 group-hover:text-primary-blue-600 transition-colors"
                                                        aria-label="ลบทักษะ"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <line x1="18" y1="6" x2="6" y2="18"></line>
                                                            <line x1="6" y1="6" x2="18" y2="18"></line>
                                                        </svg>
                                                    </button>
                                                </span>
                                            ))}
                                            
                                            {(priceRange.min > 0 || priceRange.max !== null) && (
                                                <span className="bg-primary-blue-50 text-primary-blue-600 text-sm px-3 py-1 rounded-lg flex items-center group transition-all">
                                                    {priceRange.min} - {priceRange.max === null ? 'ไม่จำกัด' : `${priceRange.max}`} บาท
                                                    <button 
                                                        type="button"
                                                        onClick={() => onPriceRangeChange({ min: 0, max: null })}
                                                        className="ml-2 text-primary-blue-400 group-hover:text-primary-blue-600 transition-colors"
                                                        aria-label="ลบช่วงราคา"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <line x1="18" y1="6" x2="6" y2="18"></line>
                                                            <line x1="6" y1="6" x2="18" y2="18"></line>
                                                        </svg>
                                                    </button>
                                                </span>
                                            )}
                                        </>
                                    ) : (
                                        <span className="text-sm text-gray-500 py-1">ไม่มีตัวกรองที่เลือก</span>
                                    )}
                                </div>
                                
                                {/* Reset all filters */}
                                {(selectedSkills.length > 0 || priceRange.min > 0 || priceRange.max !== null || searchQuery) && (
                                    <button 
                                        className="text-red-500 hover:text-red-600 text-sm flex items-center gap-1 py-1 px-2 rounded-lg hover:bg-red-50 transition-colors"
                                        onClick={onResetFilters}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M3 6h18"></path>
                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
                                            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                        </svg>
                                        ล้างตัวกรองทั้งหมด
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ProjectFilter;