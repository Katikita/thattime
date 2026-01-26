'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Button from "./components/Button";
import ChevronRight from "./components/ChevronRight";

export default function Home() {
  const router = useRouter();
  const [isPressed, setIsPressed] = useState(false);

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
      
      {/* Mobile container - responsive width */}
      <div className="relative mx-auto w-full max-w-[440px] h-full flex flex-col gap-0 px-4">
      
        {/* Hero photo - main central image */}
        <div 
          className="relative w-full h-[600px] flex items-end justify-center cursor-pointer"
          onTouchStart={() => setIsPressed(true)}
          onTouchEnd={() => setIsPressed(false)}
          onMouseDown={() => setIsPressed(true)}
          onMouseUp={() => setIsPressed(false)}
          onMouseLeave={() => setIsPressed(false)}
        >
          <div 
            className="relative flex items-center justify-center"
            style={{ 
              width: 'min(95vw, 360px)',
              height: 'min(calc(95vw * 1.125), 405px)',
              transform: `rotate(${isPressed ? 12.5 : 0}deg) scale(${isPressed ? 1.1 : 1})`,
              transition: 'transform 0.2s ease-out',
            }}
          >
            <Image
              src="/Asset/herophoto2.png"
              alt="Hero postcards"
              width={480}
              height={520}
              className="object-cover"
              style={{ 
                width: '90%', 
                height: '90%', 
                objectFit: 'cover'
              }}
              priority
            />
          </div>
        </div>

        {/* Content section - bottom of screen */}
        <div className="relative z-10 w-full flex flex-col items-center pb-8 px-4" style={{ height: '300px' }}>
          <div className="w-[279px] flex flex-col gap-6 items-center">
            {/* Text content */}
            <div className="flex flex-col gap-1 items-start w-full text-center">
              <h1 className="font-courier text-[40px] leading-normal tracking-[-1.6px] text-[#454545] w-full font-normal">
                Thattime
              </h1>
              <div className="font-courier text-[20px] leading-[1.2] tracking-[-1px] text-[#6b6b6b] w-full">
                <p className="mb-0">Make postcard and</p>
                <p>send it to your loved one</p>
              </div>
            </div>

            {/* CTA Button */}
            <Button onClick={() => router.push('/upload')}>
              <span className="font-mono text-[16px] leading-normal text-[#f8f8f8] uppercase font-normal">
                Get started
              </span>
              <div className="text-white">
                <ChevronRight />
              </div>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
