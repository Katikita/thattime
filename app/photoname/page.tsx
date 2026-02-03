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
  const [isDesktop, setIsDesktop] = useState(false);
  const [isTextareaFocused, setIsTextareaFocused] = useState(false);
  const captionRef = useRef<HTMLTextAreaElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  
  // Target transform for this page
  const TARGET_TRANSFORM = 'translate(-50%, calc(-50% - 24px)) rotate(-16deg)';

  useEffect(() => {
    // Detect desktop vs mobile
    const checkDesktop = () => {
      setIsDesktop(window.matchMedia('(min-width: 768px)').matches);
    };
    checkDesktop();
    const mediaQuery = window.matchMedia('(min-width: 768px)');
    mediaQuery.addEventListener('change', checkDesktop);
    return () => mediaQuery.removeEventListener('change', checkDesktop);
  }, []);

  useEffect(() => {
    // Get uploaded image from localStorage
    const savedImage = localStorage.getItem('uploadedImage');
    if (savedImage) {
      setUploadedImage(savedImage);
    }

    // Initialize frame transform from sessionStorage or use target
    const savedTransform = sessionStorage.getItem('frameTransform');
    if (frameRef.current) {
      if (savedTransform) {
        // Start from saved transform, then animate to target
        frameRef.current.style.transform = savedTransform;
        frameRef.current.style.transition = 'none';
        frameRef.current.style.willChange = 'transform';
        
        // Trigger animation on next frame
        requestAnimationFrame(() => {
          if (frameRef.current) {
            frameRef.current.style.transition = 'transform 1200ms cubic-bezier(.2,.8,.2,1)';
            frameRef.current.style.transform = TARGET_TRANSFORM;
          }
        });
      } else {
        // No saved transform, use target directly
        frameRef.current.style.transform = TARGET_TRANSFORM;
        frameRef.current.style.transition = 'transform 1200ms cubic-bezier(.2,.8,.2,1)';
        frameRef.current.style.willChange = 'transform';
      }
    }

    // Autofocus on caption input - only on desktop (not touch devices)
    // iOS Safari has issues with programmatic focus causing horizontal scroll
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (!isTouchDevice && isDesktop) {
      requestAnimationFrame(() => {
        if (captionRef.current) {
          captionRef.current.focus({ preventScroll: true });
        }
      });
    }
  }, [isDesktop]);

  const handleBack = () => {
    // Save current frame transform before navigation
    if (frameRef.current) {
      const currentTransform = frameRef.current.style.transform || TARGET_TRANSFORM;
      sessionStorage.setItem('frameTransform', currentTransform);
    }
    router.push('/upload');
  };

  const handleNext = () => {
    // Save caption to localStorage for next step
    localStorage.setItem('caption', caption);
    
    // Save current frame transform before navigation
    if (frameRef.current) {
      const currentTransform = frameRef.current.style.transform || TARGET_TRANSFORM;
      sessionStorage.setItem('frameTransform', currentTransform);
    }
    
    // Set flag to trigger flip-in animation on writepostcard page
    sessionStorage.setItem('enterFlip', 'true');
    
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

  const handleCaptionFocus = () => {
    setIsTextareaFocused(true);
  };

  const handleCaptionBlur = () => {
    setIsTextareaFocused(false);
    // Reset scroll positions on blur to fix iOS Safari horizontal scroll bug
    window.scrollTo({ top: 0, left: 0 });
    if (document.documentElement) {
      document.documentElement.scrollLeft = 0;
    }
    if (document.body) {
      document.body.scrollLeft = 0;
    }
  };

  const handleDoneClick = () => {
    if (captionRef.current) {
      captionRef.current.blur();
    }
  };

  // Calculate frame dimensions: desktop exact, mobile responsive
  const frameW = isDesktop ? 450 : 'min(95vw, 450px)';
  const frameH = isDesktop ? 337.5 : 'calc(min(95vw, 450px) * 0.75)';
  const wrapperW = isDesktop ? 500 : 'min(95vw, 450px)';
  const wrapperH = isDesktop ? 450 : 'calc(min(95vw, 450px) * 0.75)';

  return (
    <div 
      className={`relative w-full overflow-x-hidden ${isDesktop ? 'h-screen overflow-hidden' : 'min-h-[100dvh]'}`}
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
          <h1 className="font-courier text-[32px] text-[#000000] leading-normal tracking-[-1.6px]">
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
          <div className="relative flex items-center justify-center" style={{ width: wrapperW, height: wrapperH }}>
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
              ref={frameRef}
              className="absolute"
              style={{
                width: frameW,
                height: frameH,
                left: '50%',
                top: '50%',
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
                  bottom: '8px',
                  width: isDesktop ? '388px' : 'calc(100% - 48px)',     // responsive width
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
                      onFocus={handleCaptionFocus}
                      onBlur={handleCaptionBlur}
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

        {/* Fixed "Done" button for mobile only - appears when textarea is focused */}
        {isTextareaFocused && !isDesktop && (
          <button
            onClick={handleDoneClick}
            className="fixed bottom-6 right-6 z-50"
            style={{
              background: '#7DBFD6',
              padding: '12px 24px',
              borderRadius: '8px',
              fontFamily: 'var(--font-courier, Courier, monospace)',
              fontWeight: 700,
              fontSize: '16px',
              letterSpacing: '1px',
              color: 'white',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              cursor: 'pointer',
            }}
          >
            Done
          </button>
        )}
      </div>
    </div>
  );
}
