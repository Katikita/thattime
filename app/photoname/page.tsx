'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function PhotoNamePage() {
  const router = useRouter();
  const [memoryName, setMemoryName] = useState('');

  const handleBack = () => {
    router.push('/upload');
  };

  const handleNext = () => {
    // TODO: Navigate to next step
    console.log('Memory name:', memoryName);
  };

  return (
    <div 
      className="relative w-full h-screen overflow-hidden"
      style={{
        background: 'linear-gradient(90deg, rgb(240, 252, 255) 0%, rgb(240, 252, 255) 100%)',
      }}
    >
      {/* Background texture with opacity */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'url(/Asset/Bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: 0.5,
        }}
      />

      {/* Mobile container */}
      <div className="relative mx-auto w-full max-w-[440px] h-full flex flex-col px-4">
        
        {/* Header with back button */}
        <div className="pt-12 pb-6">
          <button 
            onClick={handleBack}
            className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100/50 transition-colors"
            aria-label="Go back"
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18L9 12L15 6" stroke="#454545" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Step indicator and title */}
        <div className="flex flex-col gap-2 mb-6">
          <p className="font-courier font-bold text-[16px] text-[#6b6b6b] tracking-[-0.8px]">
            Step 2
          </p>
          <h1 className="font-courier text-[32px] text-[#000000] leading-[1.1] tracking-[-1.6px]">
            Name your memory
          </h1>
          <p className="font-courier text-[20px] text-[#6b6b6b] tracking-[-0.8px]">
            Let's write it down it marker (trip names, time, etc.,)
          </p>
        </div>

        {/* Text input area */}
        <div className="flex-1 flex items-start pb-8">
          <textarea
            value={memoryName}
            onChange={(e) => setMemoryName(e.target.value)}
            placeholder=""
            className="w-full h-[400px] p-4 font-courier text-[18px] text-[#000000] tracking-[-0.8px] resize-none border-none outline-none"
            style={{
              backgroundColor: 'transparent',
              caretColor: '#000000',
            }}
          />
        </div>

        {/* Next button */}
        <div className="mb-6 h-fit">
          <button
            onClick={handleNext}
            className="w-full h-[56px] rounded-full font-courier text-[16px] tracking-[-0.8px] transition-colors"
            style={{
              backgroundColor: '#000000',
              color: '#ffffff',
            }}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
