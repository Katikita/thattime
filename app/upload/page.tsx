'use client';

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Button from "../components/Button";

export default function UploadPage() {
  const router = useRouter();
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const frameRef = useRef<HTMLLabelElement>(null);
  
  // Target transform for this page
  const TARGET_TRANSFORM = 'translate(-50%, calc(-50% - 24px)) rotate(-8deg)';

  useEffect(() => {
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
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsUploading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageDataUrl = reader.result as string;
        setUploadedImage(imageDataUrl);
        // Save to localStorage so it persists to next step
        localStorage.setItem('uploadedImage', imageDataUrl);
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNext = () => {
    // Save current frame transform before navigation
    if (frameRef.current) {
      const currentTransform = frameRef.current.style.transform || TARGET_TRANSFORM;
      sessionStorage.setItem('frameTransform', currentTransform);
    }
    
    // Ensure image is saved to localStorage before navigating
    if (uploadedImage) {
      localStorage.setItem('uploadedImage', uploadedImage);
    }
    router.push('/photoname');
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
            onClick={() => router.push('/')}
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
          <p className="font-courier text-[16px] text-[#6b6b6b] tracking-[-0.8px] font-bold">
            Step 1
          </p>
          <h1 className="font-courier text-[32px] leading-normal tracking-[-1.6px] text-[#000000] font-normal">
            Upload your photo
          </h1>
          <p className="font-courier text-[20px] text-[#6b6b6b] tracking-[-0.8px] leading-[24px]">
            Photo will adjust to fit automatically
          </p>
        </div>

        {/* Next button */}
        <div className="mb-6 h-fit">
          <Button 
            disabled={!uploadedImage}
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
            {/* Hidden file input */}
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
              id="photo-upload"
            />
            
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
            <label
              ref={frameRef}
              htmlFor="photo-upload"
              className="cursor-pointer absolute"
              style={{
                width: 450,
                height: 337.5,
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
                    <p className="font-courier text-[14px] text-[#c0c0c0] uppercase tracking-wider text-center">
                      Tap here to upload photo
                    </p>
                  </div>
                )}
              </div>
            </label>
            
          </div>
        </div>
      </div>
    </div>
  );
}
