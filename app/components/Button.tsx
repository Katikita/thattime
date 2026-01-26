import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

export default function Button({ children, onClick, className = '', disabled = false }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative inline-flex items-center justify-center transition-opacity ${
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:opacity-90'
      } ${className}`}
    >
      <div className="flex flex-col items-center justify-center overflow-clip pr-px">
        <div className="flex flex-col items-center justify-center">
          {/* Top border */}
          <div className="bg-[#a8a8a8] h-px w-full shrink-0" />
          
          {/* Button content */}
          <div className="bg-[#79c4da] flex gap-2 h-9 items-center justify-center shrink-0">
            {/* Left border */}
            <div className="bg-[#a8a8a8] h-full w-px shrink-0" />
            
            {/* Label wrapper */}
            <div className="flex gap-3 items-center justify-center pt-[2px] px-2">
              {children}
            </div>
            
            {/* Right border */}
            <div className="bg-[#5f5f5f] h-full w-px shrink-0" />
          </div>
          
          {/* Bottom borders */}
          <div className="bg-[#5f5f5f] h-px w-full shrink-0" />
          <div className="h-px w-full shrink-0" />
        </div>
      </div>
    </button>
  );
}

