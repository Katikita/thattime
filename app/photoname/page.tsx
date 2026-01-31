'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import Button from '../components/Button';

const MAX_LINES = 3;
const LINE_HEIGHT = 36; // must match your lineHeight
const MAX_CHARS = 44;   // pick your cap (was 50)

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
    router.push('/writepostcard');
  };

  const handleCaptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    let value = e.target.value;

    // hard cap chars
    if (value.length > MAX_CHARS) value = value.slice(0, MAX_CHARS);

    // hard cap explicit newlines
    const lines = value.split('\n');
    if (lines.length > MAX_LINES) {
      value = lines.slice(0, MAX_LINES).join('\n');
    }

    setCaption(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      const lines = caption.split('\n').length;
      if (lines >= MAX_LINES) e.preventDefault();
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

        {/* Next button */}
        <div className="mb-6 h-fit">
          <Button 
            onClick={handleNext}
          >
            <span className="font-mono text-[14px] leading-normal text-[#f8f8f8] uppercase font-normal">
              Next
            </span>
          </Button>
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
                  right: '24px',     // leave space so it doesn't sit under the marker image
                  bottom: '4px',
                  width: '260px',     // control how "corner" it feels
                  height: '108px',    // 36 * 3 lines
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'flex-end',
                  zIndex: 15,
                }}
              >
                {(() => {
                  const lineCount = Math.min(
                    MAX_LINES,
                    Math.max(1, caption.split('\n').length || 1)
                  );
                  const padTop = (MAX_LINES - lineCount) * LINE_HEIGHT;

                  return (
                    <textarea
                      ref={captionRef}
                      value={caption}
                      onChange={handleCaptionChange}
                      onKeyDown={handleKeyDown}
                      placeholder="Write your memory..."
                      maxLength={MAX_CHARS}
                      rows={MAX_LINES}
                      className="marker-caption"
                      style={{
                        width: '100%',
                        height: `${LINE_HEIGHT * MAX_LINES}px`, // 3 lines height
                        lineHeight: `${LINE_HEIGHT}px`,
                        paddingTop: `${padTop}px`,              // 👈 key: start at bottom
                        paddingBottom: '0px',
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        resize: 'none',
                        overflow: 'hidden',                     // no scroll, pushes up by padding change
                        color: '#3A3A3A',
                        textAlign: 'right',                     // if you want right corner feel
                        textAlignLast: 'right',
                        fontFamily: 'var(--font-permanent-marker), "Permanent Marker", cursive',
                        fontSize: '36px',
                        fontWeight: 400,
                        letterSpacing: '-1.8px',
                        margin: 0,
                        transform: 'rotate(-2deg)',
                      }}
                    />
                  );
                })()}
              </div>

              {/* Marker graphic overlay - positioned at bottom right */}
              <img
                src="/Asset/marker.png"
                alt=""
                className="absolute pointer-events-none"
                style={{
                  width: '320px',
                  height: '320px',
                  top: '224px',
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
