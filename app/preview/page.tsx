'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { dataUrlToBlob } from '@/lib/utils';

type Side = 'front' | 'back';

export default function PreviewPage() {
  const router = useRouter();

  const [side, setSide] = useState<Side>('front');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [toName, setToName] = useState('');
  const [message, setMessage] = useState('');
  const [fromName, setFromName] = useState('');
  
  // Track initial polaroid transform for smooth animation
  // Centered horizontally with translateX(-50%)
  const [polaroidInitialTransform, setPolaroidInitialTransform] = useState<string>('translate(-50%, -35%) rotate(-12deg) scale(1)');
  const [polaroidInitialOpacity, setPolaroidInitialOpacity] = useState<string>('1');
  const [polaroidTransformOrigin, setPolaroidTransformOrigin] = useState<string>('center center');

  // swipe/tap detector
  const startRef = useRef<{ x: number; y: number } | null>(null);
  
  // Animation refs
  const envelopeRef = useRef<HTMLImageElement>(null);
  const boardingPassRef = useRef<HTMLImageElement>(null);
  const polaroidRef = useRef<HTMLDivElement>(null);

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

    // Check if we should animate entrance
    const shouldAnimate = sessionStorage.getItem('preview_should_animate');
    const startTransform = sessionStorage.getItem('preview_polaroid_start_transform');
    
    if (shouldAnimate === 'true' && startTransform) {
      // Set initial transform and opacity immediately to prevent flash
      // Start from bottom position with scale(0) for upward scale animation
      const startY = 'calc(-35% + 150px)';
      setPolaroidInitialTransform(`translate(-50%, ${startY}) rotate(-12deg) scale(0)`);
      setPolaroidInitialOpacity('0');
      setPolaroidTransformOrigin('bottom center');
      
      // Clear sessionStorage keys immediately
      sessionStorage.removeItem('preview_should_animate');
      sessionStorage.removeItem('preview_polaroid_start_transform');

      // Use double requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // Staggered entrance animations
          // 1. Envelope first (0ms delay)
          if (envelopeRef.current) {
            envelopeRef.current.style.opacity = '0';
            envelopeRef.current.style.transform = 'translateX(-50%) scale(0.8)';
            envelopeRef.current.style.transition = 'opacity 400ms cubic-bezier(.2,.8,.2,1), transform 400ms cubic-bezier(.2,.8,.2,1)';
            
            requestAnimationFrame(() => {
              if (envelopeRef.current) {
                envelopeRef.current.style.opacity = '1';
                envelopeRef.current.style.transform = 'translateX(-50%) scale(1.5)';
              }
            });
          }

          // 2. Boarding pass second (200ms delay) - if exists
          if (boardingPassRef.current) {
            boardingPassRef.current.style.opacity = '0';
            boardingPassRef.current.style.transform = 'translateY(-20px) rotate(-10deg)';
            boardingPassRef.current.style.transition = 'opacity 400ms cubic-bezier(.2,.8,.2,1), transform 400ms cubic-bezier(.2,.8,.2,1)';
            
            setTimeout(() => {
              if (boardingPassRef.current) {
                boardingPassRef.current.style.opacity = '1';
                boardingPassRef.current.style.transform = 'translateY(0) rotate(-10deg)';
              }
            }, 200);
          }

          // 3. Polaroid - start at bottom with scale(0), scale up from bottom after 1000ms delay
          if (polaroidRef.current && startTransform) {
            // Start from bottom position (below final position) with scale(0) - set synchronously
            // Position it at the bottom where it will scale up from
            const startY = 'calc(-35% + 150px)'; // Start below final position
            polaroidRef.current.style.transform = `translate(-50%, ${startY}) rotate(-12deg) scale(0)`;
            polaroidRef.current.style.transformOrigin = 'bottom center'; // Scale from bottom
            polaroidRef.current.style.transition = 'none';
            polaroidRef.current.style.opacity = '0'; // Start invisible
            polaroidRef.current.style.willChange = 'transform, opacity';
            polaroidRef.current.style.visibility = 'visible';
            
            // Wait 1000ms, then scale up from bottom and move to final position
            setTimeout(() => {
              requestAnimationFrame(() => {
                if (polaroidRef.current) {
                  // Ensure transform-origin is set for scaling from bottom
                  polaroidRef.current.style.transformOrigin = 'bottom center';
                  // Animate upward and scale up from bottom
                  polaroidRef.current.style.transition = 'transform 1200ms cubic-bezier(.2,.8,.2,1), opacity 400ms cubic-bezier(.2,.8,.2,1)';
                  polaroidRef.current.style.transform = 'translate(-40%, -35%) rotate(-12deg) scale(1)';
                  polaroidRef.current.style.opacity = '1';
                }
              });
            }, 1000); // 1000ms delay before animation starts
          }
        });
      });
    } else {
      // No animation, set elements to final state
      if (envelopeRef.current) {
        envelopeRef.current.style.opacity = '1';
        envelopeRef.current.style.transform = 'translateX(-50%) scale(1.5)';
      }
      if (boardingPassRef.current) {
        boardingPassRef.current.style.opacity = '1';
      }
      if (polaroidRef.current) {
        polaroidRef.current.style.transform = 'translate(-50%, -35%) rotate(-12deg)';
        polaroidRef.current.style.opacity = '1';
      }
    }
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

  const handleShare = async () => {
    const dataUrl = localStorage.getItem('uploadedImage');
    if (!dataUrl) return alert('No photo found.');

    const caption = localStorage.getItem('caption') ?? '';
    const to_name = localStorage.getItem('cardTo') ?? '';
    const message = localStorage.getItem('cardMessage') ?? '';
    const from_name = localStorage.getItem('cardFrom') ?? '';
    const template_ver = 1;

    try {
      // 1) upload image
      const blob = dataUrlToBlob(dataUrl);
      const filePath = `postcards/${crypto.randomUUID()}.jpg`;

      console.log('Uploading to storage bucket "postcard"...');
      const { error: uploadErr, data: uploadData } = await supabase.storage
        .from('postcard')
        .upload(filePath, blob, { contentType: blob.type, upsert: false });

      if (uploadErr) {
        console.error('Storage upload error:', uploadErr);
        console.error('Full error details:', JSON.stringify(uploadErr, null, 2));
        
        // Check if it's an RLS error
        if (uploadErr.message?.includes('row-level security') || uploadErr.message?.includes('RLS')) {
          alert(`Storage RLS Error: ${uploadErr.message}\n\nFix Storage RLS:\n1. Go to Supabase Dashboard → Storage → postcard bucket\n2. Click "Policies" tab\n3. Create policy:\n   - Name: "Allow public uploads"\n   - Operation: INSERT\n   - Target: anon, authenticated\n   - Policy: true\n4. OR disable Storage RLS in bucket settings`);
        } else {
          alert(`Storage upload failed: ${uploadErr.message || 'Unknown error'}\n\nCheck:\n1. Storage bucket "postcard" exists\n2. Storage RLS policies allow uploads\n3. Bucket is public\n\nError code: ${uploadErr.statusCode || 'unknown'}`);
        }
        return;
      }

      console.log('Upload successful:', uploadData);

      // 2) get public url
      const { data: pub } = supabase.storage.from('postcard').getPublicUrl(filePath);
      const photo_url = pub.publicUrl;
      console.log('Public URL:', photo_url);

      // 3) insert row
      console.log('Inserting into postcard table...');
      console.log('Insert data:', { photo_url, caption, to_name, message, from_name, template_ver });
      
      const { data: row, error: insertErr } = await supabase
        .from('postcard')
        .insert([{ photo_url, caption, to_name, message, from_name, template_ver }])
        .select('id')
        .single();

      if (insertErr || !row) {
        console.error('Database insert error:', insertErr);
        console.error('Error details:', JSON.stringify(insertErr, null, 2));
        const errorMsg = insertErr?.message || 'Unknown error';
        const errorCode = insertErr?.code || 'unknown';
        const errorDetails = insertErr?.details || '';
        
        let troubleshooting = '';
        if (errorMsg.includes('row-level security')) {
          troubleshooting = '\n\nRLS Policy Fix:\n1. Open "Postcards: authenticated insert" policy\n2. Add USING clause: USING (true)\n3. Keep WITH CHECK: WITH CHECK (true)\n4. Save the policy\n\nOr try disabling RLS temporarily to test.';
        } else if (errorMsg.includes('column') || errorMsg.includes('null')) {
          troubleshooting = '\n\nSchema Issue:\n1. Check table columns match:\n   - photo_url (text)\n   - caption (text)\n   - to_name (text)\n   - message (text)\n   - from_name (text)\n   - template_ver (integer)\n2. Ensure id is UUID with default\n3. Ensure created_at has default';
        }
        
        alert(`Database insert failed: ${errorMsg}\n\nError code: ${errorCode}\nDetails: ${errorDetails}${troubleshooting}\n\nCheck browser console (F12) for full error details.`);
        return;
      }

      console.log('Insert successful, postcard ID:', row.id);

      const url = `${window.location.origin}/p/${row.id}`;

      // share / copy
      // @ts-ignore
      if (navigator.share) {
        try {
          // @ts-ignore
          await navigator.share({ title: 'Postcard', url });
          return;
        } catch (err) {
          // User cancelled or share failed, continue with clipboard
        }
      }
      
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(url);
        alert('Link copied ✅\n\n' + url);
      } catch (err) {
        // Clipboard failed, show alert with link
        alert('Share this link:\n\n' + url + '\n\n(Copy manually)');
      }
    } catch (error) {
      console.error('Unexpected error in handleShare:', error);
      alert(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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
          <h1 style={{ ...courierTitle, fontSize: 32, lineHeight: '1.05', letterSpacing: '-1.6px' }}>
            Your postcard is ready
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
          {/* Preview background image (envelope) */}
          <img
            ref={envelopeRef}
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

          {/* Boarding pass (if exists) */}
          <img
            ref={boardingPassRef}
            src="/Asset/airlines.png"
            alt=""
            className="absolute pointer-events-none"
            style={{
              width: 280,
              left: 10,
              top: 80,
              transform: 'rotate(-10deg)',
              zIndex: 1.5,
              display: 'none', // Hidden by default, will show if asset exists
            }}
            onLoad={(e) => {
              // Show if image loads successfully
              (e.currentTarget as HTMLImageElement).style.display = 'block';
            }}
            onError={(e) => {
              // Hide if asset missing
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />

          {/* Flip card (polaroid) */}
          <div
            ref={polaroidRef}
            className="absolute left-1/2 top-1/2"
            style={{
              transform: polaroidInitialTransform,
              transformOrigin: polaroidTransformOrigin,
              opacity: polaroidInitialOpacity,
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
