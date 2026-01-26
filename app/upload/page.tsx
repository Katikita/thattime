'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Button from "../components/Button";

export default function UploadPage() {
  const router = useRouter();
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsUploading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
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
          <h1 className="font-courier text-[32px] leading-normal tracking-[-1.6px] text-[#454545] font-normal">
            Upload your photo
          </h1>
          <p className="font-courier text-[20px] text-[#6b6b6b] tracking-[-0.8px]">
            Photo will adjust to fit automatically
          </p>
        </div>

        {/* Next button */}
        <div className="mb-6 h-fit">
          <Button disabled={!uploadedImage}>
            <span className="font-mono text-[14px] leading-normal text-[#f8f8f8] uppercase font-normal">
              Next
            </span>
          </Button>
        </div>

        {/* Upload area */}
        <div className="flex-1 flex items-center justify-center pb-8">
          <div className="relative flex items-center justify-center" style={{ width: '500px', height: '450px' }}>
            {/* Upload frame/envelope */}
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
              id="photo-upload"
            />
            
            <label
              htmlFor="photo-upload"
              className="cursor-pointer absolute"
              style={{
                width: '450px',
                height: '337.5px',
                transform: 'rotate(-12deg)',
                left: '50%',
                top: '50%',
                marginLeft: '-225px', // half of width to center
                marginTop: '-168.75px', // half of height to center
              }}
            >
              {/* Old tape decoration - positioned above the frame */}
              <img
                src="/Asset/oldtape2.png"
                alt=""
                className="absolute pointer-events-none"
                style={{
                  width: '150px',
                  height: 'auto',
                  top: '-40px',
                  right: '40px',
                  zIndex: 10,
                }}
              />
              
              {/* Outer white polaroid frame with background texture */}
              <div 
                className="relative w-full h-full flex items-center justify-center"
                style={{
                  backgroundImage: 'url(/Asset/bgwhite.png)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
                  padding: '15px 15px 40px 15px', // Extra padding at bottom for polaroid effect
                }}
              >
                {/* Inner photo area */}
                <div 
                  className="relative flex items-center justify-center overflow-hidden"
                  style={{
                    width: '420px',
                    height: '291.9px',
                    background: uploadedImage ? 'transparent' : '#f0f0f0',
                  }}
                >
                  {uploadedImage ? (
                    <img
                      src={uploadedImage}
                      alt="Uploaded photo"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-4">
                      {/* Upload icon */}
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 15V3M12 3L8 7M12 3L16 7" stroke="#c0c0c0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M2 17L2 19C2 20.1046 2.89543 21 4 21L20 21C21.1046 21 22 20.1046 22 19L22 17" stroke="#c0c0c0" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                      {/* Upload text */}
                      <p className="font-courier text-[14px] text-[#c0c0c0] uppercase tracking-wider text-center">
                        Tap here to upload photo
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
