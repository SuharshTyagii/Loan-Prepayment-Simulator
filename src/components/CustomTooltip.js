import React, { useState} from 'react';

export const CustomTooltip = ({ children, content }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  return (
    <div className="relative inline-block">
      <div 
        className="inline-flex items-center cursor-help"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
      </div>
      {isVisible && (
        <div className="absolute z-10 px-3 py-2 text-sm w-48 rounded shadow-lg bg-gray-800 text-white -top-1 left-6">
          {content}
        </div>
      )}
    </div>
  );
};