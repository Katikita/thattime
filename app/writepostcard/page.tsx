'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import Button from '../components/Button';

const MAX_TO = 24;
const MAX_FROM = 24;
const MAX_MESSAGE = 420; // adjust if you want shorter/longer

export default function WritePostcardPage() {
  const router = useRouter();

  const [toName, setToName] = useState('');
  const [message, setMessage] = useState('');
  const [fromName, setFromName] = useState('');

  const toRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Load from localStorage
    const savedTo = localStorage.getItem('cardTo') ?? '';
    const savedMessage = localStorage.getItem('cardMessage') ?? '';
    const savedFrom = localStorage.getItem('cardFrom') ?? '';
    
    setToName(savedTo);
    setMessage(savedMessage);
    setFromName(savedFrom);

    // Autofocus on "To" field
    requestAnimationFrame(() => {
      toRef.current?.focus({ preventScroll: true });
    });
  }, []);

  const isValid = useMemo(() => {
    return (
      toName.trim().length > 0 &&
      message.trim().length > 0 &&
      fromName.trim().length > 0
    );
  }, [toName, message, fromName]);

  const handleBack = () => {
    router.push('/photoname');
  };

  const handleNext = () => {
    if (!isValid) return;

    localStorage.setItem('cardTo', toName.trim());
    localStorage.setItem('cardMessage', message);
    localStorage.setItem('cardFrom', fromName.trim());

    router.push('/preview');
  };

  const handStyle: React.CSSProperties = {
    color: '#686868',
    fontFamily: '"Bradley Hand", cursive',
    fontSize: 14,
    fontStyle: 'normal',
    fontWeight: 700,
    lineHeight: '150%',
  };

  return (
    <div
      className="relative w-full h-screen overflow-hidden"
      style={{
        background:
          'linear-gradient(90deg, rgb(240, 252, 255) 0%, rgb(240, 252, 255) 100%)',
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
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M15 18L9 12L15 6"
                stroke="#454545"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* Step indicator and title */}
        <div className="flex flex-col gap-2 mb-6">
          <p className="font-courier font-bold text-[16px] text-[#6b6b6b] tracking-[-0.8px]">
            Step 3
          </p>

          <h1 className="font-courier text-[32px] text-[#000000] leading-[1.1] tracking-[-1.6px]">
            Write messages
          </h1>

          <p className="font-courier text-[20px] text-[#6b6b6b] tracking-[-0.8px] leading-[24px]">
           Add a message for someone (or future you)
          </p>

          {/* NEXT button */}
          <div className="mt-0 mb-6 h-fit">
            <Button 
              onClick={handleNext}
              disabled={!isValid}
            >
              <span className="font-mono text-[14px] leading-normal text-[#f8f8f8] uppercase font-normal">
                Next
              </span>
            </Button>
          </div>
        </div>

        {/* Card area */}
        <div className="flex-1 flex items-start justify-center pb-8">
          <div
            className="w-full"
            style={{
              maxWidth: 450,
              width: 'min(95vw, 450px)',
              aspectRatio: '4 / 3',
              background: '#F4F4F4',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.12)',
              padding: '26px 28px',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              transform: 'scale(1.125) rotate(-4deg)',
            }}
          >
            {/* To field */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <span style={{ ...handStyle, color: '#2f2f2f' }}>To</span>
              <input
                ref={toRef}
                value={toName}
                onChange={(e) => {
                  const v = e.target.value.slice(0, MAX_TO);
                  setToName(v);
                  localStorage.setItem('cardTo', v);
                }}
                placeholder=""
                style={{
                  ...handStyle,
                  width: '80px',
                  maxWidth: '80px',
                  minWidth: '80px',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  borderBottom: '1px solid rgba(53, 53, 53, 0.25)',
                  padding: '0 0 2px 0',
                }}
              />
            </div>

            {/* Message textarea */}
            <textarea
              value={message}
              onChange={(e) => {
                let v = e.target.value;
                if (v.length > MAX_MESSAGE) v = v.slice(0, MAX_MESSAGE);
                setMessage(v);
                localStorage.setItem('cardMessage', v);
              }}
              onPaste={(e) => {
                // Clamp pasted content to max length
                const pastedText = e.clipboardData.getData('text');
                const currentValue = message;
                const newValue = currentValue + pastedText;
                if (newValue.length > MAX_MESSAGE) {
                  e.preventDefault();
                  const remaining = MAX_MESSAGE - currentValue.length;
                  if (remaining > 0) {
                    const clamped = pastedText.slice(0, remaining);
                    const finalValue = currentValue + clamped;
                    setMessage(finalValue);
                    localStorage.setItem('cardMessage', finalValue);
                  }
                }
              }}
              maxLength={MAX_MESSAGE}
              placeholder="Write down your messages."
              style={{
                ...handStyle,
                marginTop: 14,
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                resize: 'none',
                overflow: 'hidden',
              }}
            />

            {/* From field */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 18 }}>
              <span style={{ ...handStyle, color: '#2f2f2f' }}>From</span>
              <input
                value={fromName}
                onChange={(e) => {
                  const v = e.target.value.slice(0, MAX_FROM);
                  setFromName(v);
                  localStorage.setItem('cardFrom', v);
                }}
                placeholder=""
                style={{
                  ...handStyle,
                  width: '80px',
                  maxWidth: '80px',
                  minWidth: '80px',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  borderBottom: '1px solid rgba(53, 53, 53, 0.25)',
                  padding: '0 0 2px 0',
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
