'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

type Side = 'front' | 'back';

export default function PreviewPage() {
  const router = useRouter();

  const [side, setSide] = useState<Side>('front');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [toName, setToName] = useState('');
  const [message, setMessage] = useState('');
  const [fromName, setFromName] = useState('');

  // swipe/tap detector
  const startRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const img = localStorage.getItem('uploadedImage');
    if (!img) {
      router.push('/upload'); // fallback to step 1
      return;
    }
    setUploadedImage(img);
    setCaption(localStorage.getItem('caption') ?? '');

    setToName(localStorage.getItem('cardTo') ?? '');
    setMessage(localStorage.getItem('cardMessage') ?? '');
    setFromName(localStorage.getItem('cardFrom') ?? '');
  }, [router]);

  const toggle = () => setSide((s) => (s === 'front' ? 'back' : 'front'));

  const onPointerDown = (e: React.PointerEvent) => {
    startRef.current = { x: e.clientX, y: e.clientY };
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const s = startRef.current;
    if (!s) return;
    startRef.current = null;

    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;

    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    const TAP_MAX = 10;
    const SWIPE_MIN = 32;

    // tap
    if (absX < TAP_MAX && absY < TAP_MAX) {
      toggle();
      return;
    }

    // horizontal swipe
    if (absX > SWIPE_MIN && absX > absY) {
      toggle();
      return;
    }
  };

  const handleEdit = () => {
    router.push('/writepostcard');
  };

  const handleShare = () => {
    // TODO: magic link + download later
    alert('Share is coming soon ✨');
  };

  const courierTitle: React.CSSProperties = {
    fontFamily: 'var(--font-courier, Courier, monospace)',
    color: '#000',
  };

  const courierSub: React.CSSProperties = {
    fontFamily: 'var(--font-courier, Courier, monospace)',
    color: '#6b6b6b',
  };

  const handStyle: React.CSSProperties = {
    color: '#686868',
    fontFamily: '"Bradley Hand", cursive',
    fontSize: 14,
    fontStyle: 'normal',
    fontWeight: 700,
    lineHeight: '150%',
  };

  const markerStyle: React.CSSProperties = {
    color: '#3A3A3A',
    fontFamily: 'var(--font-permanent-marker), "Permanent Marker", cursive',
    fontSize: 36,
    fontWeight: 400,
    lineHeight: '36px',
    letterSpacing: '-1.8px',
  };

  const cardW = 'min(95vw, 450px)';

  return (
    <div
      className="relative w-full h-screen overflow-hidden"
      style={{
        background:
          'linear-gradient(90deg, rgb(240, 252, 255) 0%, rgb(240, 252, 255) 100%)',
      }}
    >
      {/* background texture */}
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

      <div className="relative mx-auto w-full max-w-[440px] h-full flex flex-col px-4">
        {/* Top copy */}
        <div className="pt-12">
          <h1 style={{ ...courierTitle, fontSize: 40, lineHeight: '1.05', letterSpacing: '-1.6px' }}>
            Your postcard is
            <br />
            ready
          </h1>
          <p style={{ ...courierSub, marginTop: 10, fontSize: 20, lineHeight: '24px' }}>
            Share it to someone you love
          </p>

          <div className="flex gap-4 mt-5">
            <button
              onClick={handleEdit}
              style={{
                border: '1px solid rgba(0,0,0,0.35)',
                background: 'rgba(255,255,255,0.75)',
                padding: '10px 18px',
                fontFamily: 'var(--font-courier, Courier, monospace)',
                fontWeight: 700,
                letterSpacing: '1px',
                cursor: 'pointer',
                color: '#454545',
              }}
            >
              EDIT
            </button>

            <button
              onClick={handleShare}
              style={{
                background: '#7DBFD6',
                padding: '10px 18px',
                fontFamily: 'var(--font-courier, Courier, monospace)',
                fontWeight: 700,
                letterSpacing: '1px',
                color: 'white',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                cursor: 'pointer',
              }}
            >
              SHARE <span style={{ fontSize: 18, lineHeight: 1 }}>›</span>
            </button>
          </div>
        </div>

        {/* Scene area */}
        <div className="flex-1 relative">
          {/* Preview background image */}
          <img
            src="/Asset/previewbg2.png"
            alt="Preview background"
            className="absolute pointer-events-none"
            style={{
              left: '50%',
              bottom: 80,
              transform: 'translateX(-50%) scale(1.5)',
              zIndex: 1,
              width: '100%',
              maxWidth: '500px',
              height: 'auto',
              minHeight: '300px',
            }}
            onError={(e) => {
              // Log error for debugging
              console.error('Failed to load previewbg2.png:', e);
              // if asset missing, hide it
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />

          {/* Flip card */}
          <div
            className="absolute left-1/2 top-1/2"
            style={{
              transform: 'translate(-50%, -35%) rotate(-12deg)',
              width: cardW,
              aspectRatio: '4 / 3',
              zIndex: 2,
            }}
          >
            <div style={{ width: '100%', height: '100%', perspective: 1200 }}>
              <div
                onPointerDown={onPointerDown}
                onPointerUp={onPointerUp}
                style={{
                  width: '100%',
                  height: '100%',
                  position: 'relative',
                  transformStyle: 'preserve-3d',
                  transition: 'transform 520ms cubic-bezier(.2,.8,.2,1)',
                  transform: side === 'back' ? 'rotateY(180deg)' : 'rotateY(0deg)',
                  touchAction: 'pan-y', // allow vertical scroll; we detect horizontal swipe
                  cursor: 'pointer',
                }}
                aria-label="Flip postcard"
              >
                {/* FRONT */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backfaceVisibility: 'hidden',
                    background: '#F4F4F4',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
                    padding: 14,
                    paddingBottom: 36,
                    boxSizing: 'border-box',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <div
                    style={{
                      flex: 1,
                      background: '#eaeaea',
                      overflow: 'hidden',
                      boxShadow: '0 0 14px rgba(0,0,0,0.10), 0 10px 24px rgba(0,0,0,0.12)',
                    }}
                  >
                    {uploadedImage ? (
                      <img
                        src={uploadedImage}
                        alt="Postcard photo"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                    ) : null}
                  </div>

                  {/* marker caption bottom-right */}
                  <div
                    style={{
                      position: 'absolute',
                      right: 18,
                      bottom: 10,
                      width: '70%',
                      textAlign: 'right',
                      ...markerStyle,
                      transform: 'rotate(-2deg)',
                      whiteSpace: 'pre-wrap',
                      overflow: 'hidden',
                    }}
                  >
                    {caption}
                  </div>
                </div>

                {/* BACK */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    transform: 'rotateY(180deg)',
                    backfaceVisibility: 'hidden',
                    background: '#F4F4F4',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
                    padding: '26px 28px',
                    boxSizing: 'border-box',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    ...handStyle,
                  }}
                >
                  <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', flexShrink: 0 }}>
                    <span style={{ color: '#2f2f2f' }}>To</span>
                    <span style={{ borderBottom: '2px solid rgba(0,0,0,0.25)', paddingBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
                      {toName}
                    </span>
                  </div>

                  <div style={{ 
                    marginTop: 14, 
                    flex: 1, 
                    whiteSpace: 'pre-wrap', 
                    overflow: 'hidden',
                    overflowY: 'auto',
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word',
                    maxWidth: '100%',
                  }}>
                    {message}
                  </div>

                  <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', marginTop: 18, flexShrink: 0 }}>
                    <span style={{ color: '#2f2f2f' }}>From</span>
                    <span style={{ borderBottom: '2px solid rgba(0,0,0,0.25)', paddingBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
                      {fromName}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Optional hint (comment out if you don't want it) */}
            {/* <div style={{ textAlign: 'center', marginTop: 10, ...courierSub }}>Tap or swipe to flip</div> */}
          </div>
        </div>
      </div>
    </div>
  );
}
