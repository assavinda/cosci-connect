import React, { useState, useRef, useEffect } from 'react';

interface DropdownOption {
  value: string;
  label: string;
}

interface MajorDropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  className?: string;
}

const MajorDropdown: React.FC<MajorDropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = 'เลือกตัวเลือก',
  disabled = false,
  required = false,
  id,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Filter options based on search term
  const filteredOptions = options.filter(option => 
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    
    switch (e.key) {
      case 'Enter':
        if (isOpen && filteredOptions.length > 0) {
          onChange(filteredOptions[highlightedIndex].value);
          setIsOpen(false);
          setSearchTerm('');
        } else {
          setIsOpen(true);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSearchTerm('');
        break;
      case 'ArrowDown':
        if (isOpen) {
          e.preventDefault();
          setHighlightedIndex(prev => 
            prev < filteredOptions.length - 1 ? prev + 1 : prev
          );
        } else {
          setIsOpen(true);
        }
        break;
      case 'ArrowUp':
        if (isOpen) {
          e.preventDefault();
          setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0);
        }
        break;
      default:
        if (!isOpen) {
          setIsOpen(true);
        }
    }
  };
  
  // Get selected option label
  const selectedOption = options.find(option => option.value === value);
  
  // Toggle dropdown
  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      if (!isOpen && inputRef.current) {
        // Focus on input when opening
        setTimeout(() => {
          inputRef.current?.focus();
        }, 0);
      }
    }
  };
  
  // Select option
  const selectOption = (option: DropdownOption) => {
    onChange(option.value);
    setIsOpen(false);
    setSearchTerm('');
  };
  
  return (
    <div 
      className={`relative w-full ${className}`} 
      ref={dropdownRef}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={handleKeyDown}
      id={id}
    >
      {/* Dropdown trigger */}
      <div
        className={`flex items-center justify-between px-2.5 py-2 w-full border rounded-xl cursor-pointer ${
          isOpen ? 'border-primary-blue-500 ring-2 ring-primary-blue-100' : 'border-gray-400'
        } ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:border-gray-500'}`}
        onClick={toggleDropdown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        role="combobox"
        aria-controls="dropdown-list-id"
      >
        <span className={`block truncate ${!value ? 'text-gray-500' : ''}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span className="pointer-events-none">
          <svg 
            className={`w-4 h-4 transition-transform ${isOpen ? 'transform rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </div>
      
      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          
          {/* Options list */}
          <ul 
            className="max-h-60 overflow-y-auto py-1"
            role="listbox"
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => (
                <li
                  key={option.value}
                  className={`px-3 py-1.5 cursor-pointer ${
                    option.value === value
                      ? 'bg-primary-blue-100 text-primary-blue-600'
                      : highlightedIndex === index
                      ? 'bg-gray-100'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => selectOption(option)}
                  role="option"
                  aria-selected={option.value === value}
                >
                  {option.label}
                </li>
              ))
            ) : (
              <li className="px-3 py-2 text-gray-500 text-center">ไม่พบตัวเลือกที่ค้นหา</li>
            )}
          </ul>
        </div>
      )}
      
      {/* Hidden input for form submission if needed */}
      <input 
        type="hidden" 
        name={id} 
        value={value} 
        required={required} 
      />
    </div>
  );
};

export default MajorDropdown;