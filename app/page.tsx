'use client';

import Image from "next/image";
import Button from "./components/Button";
import ChevronRight from "./components/ChevronRight";

export default function Home() {
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
      
      {/* Mobile container - 390px max width as per Figma */}
      <div className="relative mx-auto max-w-[390px] h-full flex flex-col gap-0">
      
        {/* Hero photo - main central image */}
        <div className="relative w-full h-[480px] overflow-hidden">
          <div className="absolute left-1/2 top-0 -translate-x-1/2 w-[390px] h-[78%] overflow-hidden" style={{ left: '438px', top: '229px' }}>
            
          </div>
          <div className="relative w-full h-full" style={{ display: 'flex', flexWrap: 'wrap', transform: 'rotate(90deg)' }}>
            <Image
              src="/Asset/herophoto.png"
              alt="Hero postcards"
              width={564}
              height={640}
              className="absolute object-cover"
              style={{ 
                width: '144.48%', 
                height: 'auto', 
                left: '197px', 
                top: '50%', 
                transform: 'translate(-50%, -50%) rotate(270deg)',
                margin: 'auto'
              }}
              priority
            />
          </div>
        </div>

        {/* Content section - bottom of screen */}
        <div className="relative z-10 w-full flex flex-col items-center pb-8 px-4" style={{ height: '300px' }}>
          <div className="w-[279px] flex flex-col gap-4 items-center">
            {/* Text content */}
            <div className="flex flex-col gap-1 items-start w-full text-center">
              <h1 className="font-courier text-[32px] leading-normal tracking-[-1.6px] text-[#454545] w-full font-normal">
                Thattime
              </h1>
              <div className="font-courier text-[20px] leading-[1.2] tracking-[-1px] text-[#6b6b6b] w-full">
                <p className="mb-0">Make postcard and</p>
                <p>send it to your loved one</p>
              </div>
            </div>

            {/* CTA Button */}
            <Button onClick={() => console.log('Get started clicked')}>
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
