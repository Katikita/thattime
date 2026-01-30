'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';

export default function PhotoNamePage() {
  const router = useRouter();
  const [caption, setCaption] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const captionRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Get uploaded image from localStorage
    const savedImage = localStorage.getItem('uploadedImage');
    if (savedImage) {
      setUploadedImage(savedImage);
    }

    // Autofocus on caption input when arriving from Step 1
    // Use requestAnimationFrame for desktop focus + mobile keyboard best-effort
    requestAnimationFrame(() => {
      if (captionRef.current) {
        captionRef.current.focus({ preventScroll: true });
      }
    });
  }, []);

  const handleBack = () => {
    router.push('/upload');
  };

  const handleNext = () => {
    // Save caption to localStorage for next step
    localStorage.setItem('caption', caption);
    // TODO: Navigate to next step
    console.log('Caption:', caption);
  };

  const handleCaptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    let value = e.target.value;
    
    // Optional: maxLength ~50 chars to avoid overflow
    if (value.length > 50) {
      value = value.slice(0, 50);
    }
    
    // Clamp pasted newlines to 2 lines
    const lines = value.split('\n');
    if (lines.length > 2) {
      value = lines.slice(0, 2).join('\n');
    }
    
    setCaption(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Prevent 3rd line on Enter
    if (e.key === 'Enter') {
      const lines = caption.split('\n');
      if (lines.length >= 2) {
        e.preventDefault();
      }
    }
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
        <div className="flex flex-col gap-2 mb-2">
          <p className="font-courier font-bold text-[16px] text-[#6b6b6b] tracking-[-0.8px]">
            Step 2
          </p>
          <h1 className="font-courier text-[32px] text-[#000000] leading-[1.1] tracking-[-1.6px]">
            Name your memory
          </h1>
          <p className="font-courier text-[20px] text-[#6b6b6b] tracking-[-0.8px] leading-[24px]">
            Let's write it down it marker (trip names, time, etc.,)
          </p>
        </div>


        {/* Upload area */}
        <div className="flex-1 flex items-center justify-center pb-8">
          <div className="relative flex items-center justify-center" style={{ width: '500px', height: '450px' }}>
            {/* Old tape decoration */}
            <img
              src="/Asset/oldtape2.png"
              alt=""
              className="absolute pointer-events-none"
              style={{
                width: '180px',
                height: 'auto',
                top: '-22px',
                left: '272px',
                zIndex: 20,
                transform: 'rotate(22.5deg)',
              }}
            />
            
            {/* Polaroid photo frame */}
            <div
              className="absolute"
              style={{
                width: 450,
                height: 337.5,
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, calc(-50% - 24px)) rotate( -16deg)',
                backgroundColor: '#F4F4F4',
                backgroundSize: '100% 100%',
                backgroundPosition: 'center',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
                padding: 15,
                paddingBottom: 30.6,
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
                justifyContent: 'flex-start',
              }}
            >
              {/* Inner photo area - auto-fills available space */}
              <div
                style={{
                  flex: 1,
                  width: '100%',
                  backgroundColor: '#f1f1f1',
                  boxShadow: '0 0 14px rgba(0,0,0,0.10), 0 10px 24px rgba(0,0,0,0.12)',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {uploadedImage ? (
                  <img
                    src={uploadedImage}
                    alt="Uploaded photo"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center gap-4">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 15V3M12 3L8 7M12 3L16 7" stroke="#c0c0c0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M2 17L2 19C2 20.1046 2.89543 21 4 21L20 21C21.1046 21 22 20.1046 22 19L22 17" stroke="#c0c0c0" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                )}
              </div>

              {/* Marker caption input - positioned on bottom white border */}
              <div
                className="absolute"
                style={{
                  left: 60,
                  right: 0,
                  bottom: '8px',
                  paddingLeft: '24px',
                  paddingRight: '110px',
                  height: '72px',
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'left',
                  zIndex: 15,
                }}
              >
                <textarea
                  ref={captionRef}
                  value={caption}
                  onChange={handleCaptionChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Write your memory..."
                  maxLength={50}
                  rows={2}
                  className="marker-caption"
                  style={{
                    width: '100%',
                    height: '72px',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    resize: 'none',
                    boxShadow: 'none',
                    overflow: 'hidden',
                    color: '#3A3A3A',
                    textAlign: 'center',
                    fontFamily: 'var(--font-permanent-marker), "Permanent Marker", cursive',
                    fontSize: '36px',
                    fontWeight: 400,
                    lineHeight: '36px',
                    letterSpacing: '-1.8px',
                    padding: 0,
                    margin: 0,
                    verticalAlign: 'bottom',
                  }}
                />
              </div>

              {/* Marker graphic overlay - positioned at bottom right */}
              <img
                src="/Asset/marker.png"
                alt=""
                className="absolute pointer-events-none"
                style={{
                  width: '320px',
                  height: '320px',
                  top: '269px',
                  left: '240px',
                  zIndex: 10,
                  transform: 'rotate(8deg)',
                  boxShadow: 'none',
                }}
              />
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}
