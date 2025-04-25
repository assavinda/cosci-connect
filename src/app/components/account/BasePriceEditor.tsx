'use client';

import React from 'react';

interface BasePriceEditorProps {
  basePrice: number;
  onBasePriceChange: (value: number) => void;
}

const BasePriceEditor: React.FC<BasePriceEditorProps> = ({ basePrice, onBasePriceChange }) => {
  // Handle price change with validation
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    // Ensure the price is at least 100
    if (!isNaN(value) && value >= 100) {
      onBasePriceChange(value);
    }
  };

  return (
    <div>
      <h3 className="text-lg font-medium mb-3">ราคาเริ่มต้น</h3>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min="100"
          step="100"
          className="input max-w-32"
          value={basePrice}
          onChange={handlePriceChange}
          aria-label="ราคาเริ่มต้น"
        />
        <span className="text-gray-600">บาท</span>
      </div>
      <p className="text-sm text-gray-500 mt-1">ราคาเริ่มต้นสำหรับการรับงาน (ขั้นต่ำ 100 บาท)</p>
    </div>
  );
};

export default BasePriceEditor;