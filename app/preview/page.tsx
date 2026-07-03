'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { dataUrlToBlob } from '@/lib/utils';

type Side = 'front' | 'back';
type ShareStatus = 'idle' | 'creating' | 'ready' | 'error';

// CACHE CONFIGURATION
const CACHE_DURATION_MS = 30 * 60 * 1000; // 30 minutes
const CACHE_KEY_URL = 'share_url';
const CACHE_KEY_SIGNATURE = 'share_data_signature';
const CACHE_KEY_TIMESTAMP = 'share_timestamp';

/**
 * Generate a data signature from current localStorage data.
 * This signature changes whenever any postcard field changes (photo, caption, to, message, from).
 * Used to detect if cached link is stale (data was edited).
 */
function generateDataSignature(): string {
  const dataUrl = localStorage.getItem('uploadedImage') ?? '';
  const caption = localStorage.getItem('caption') ?? '';
  const to = localStorage.getItem('cardTo') ?? '';
  const message = localStorage.getItem('cardMessage') ?? '';
  const from = localStorage.getItem('cardFrom') ?? '';
  
  // Simple hash of all data fields
  const combined = `${dataUrl.length}:${caption}:${to}:${message}:${from}`;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(36); // Base36 for shorter string
}

/**
 * Validate cached share link.
 * Returns cached URL if:
 *   1. URL exists in cache
 *   2. Data signature matches (data hasn't changed)
 *   3. Not expired (within 30 minutes)
 * Returns null if cache is invalid/expired.
 */
function getValidCachedUrl(): string | null {
  const cachedUrl = sessionStorage.getItem(CACHE_KEY_URL);
  const cachedSignature = sessionStorage.getItem(CACHE_KEY_SIGNATURE);
  const cachedTimestamp = sessionStorage.getItem(CACHE_KEY_TIMESTAMP);
  
  if (!cachedUrl || !cachedSignature || !cachedTimestamp) {
    return null; // No complete cache
  }
  
  // Check expiration
  const now = Date.now();
  const timestamp = parseInt(cachedTimestamp, 10);
  if (now - timestamp > CACHE_DURATION_MS) {
    console.log('[Cache] Expired, creating new link');
    clearShareCache();
    return null;
  }
  
  // Check data signature (detect edits)
  const currentSignature = generateDataSignature();
  if (cachedSignature !== currentSignature) {
    console.log('[Cache] Data changed, creating new link');
    clearShareCache();
    return null;
  }
  
  // Cache is valid
  const remainingMinutes = Math.round((CACHE_DURATION_MS - (now - timestamp)) / 60000);
  console.log(`[Cache] Valid for ${remainingMinutes} more minutes`);
  return cachedUrl;
}

/**
 * Store share link in cache with current data signature and timestamp.
 */
function setShareCache(url: string): void {
  const signature = generateDataSignature();
  sessionStorage.setItem(CACHE_KEY_URL, url);
  sessionStorage.setItem(CACHE_KEY_SIGNATURE, signature);
  sessionStorage.setItem(CACHE_KEY_TIMESTAMP, Date.now().toString());
  console.log('[Cache] Stored new link, expires in 30 minutes');
}

/**
 * Clear all share cache entries.
 */
function clearShareCache(): void {
  sessionStorage.removeItem(CACHE_KEY_URL);
  sessionStorage.removeItem(CACHE_KEY_SIGNATURE);
  sessionStorage.removeItem(CACHE_KEY_TIMESTAMP);
}

// Helper: Create share link (upload + insert)
async function createShareLink(): Promise<string> {
  const dataUrl = localStorage.getItem('uploadedImage');
  if (!dataUrl) throw new Error('No photo found');

  const caption = localStorage.getItem('caption') ?? '';
  const to_name = localStorage.getItem('cardTo') ?? '';
  const message = localStorage.getItem('cardMessage') ?? '';
  const from_name = localStorage.getItem('cardFrom') ?? '';
  const template_ver = 1;

  // 1) Upload image
  const blob = dataUrlToBlob(dataUrl);
  const filePath = `postcards/${crypto.randomUUID()}.jpg`;

  const { error: uploadErr } = await supabase.storage
    .from('postcard')
    .upload(filePath, blob, { contentType: blob.type, upsert: false });

  if (uploadErr) {
    throw new Error(`Upload failed: ${uploadErr.message}`);
  }

  // 2) Get public URL
  const { data: pub } = supabase.storage.from('postcard').getPublicUrl(filePath);
  const photo_url = pub.publicUrl;

  // 3) Insert row
  const { data: row, error: insertErr } = await supabase
    .from('postcard')
    .insert([{ photo_url, caption, to_name, message, from_name, template_ver }])
    .select('id')
    .single();

  if (insertErr || !row) {
    throw new Error(`Database insert failed: ${insertErr?.message || 'Unknown error'}`);
  }

  return `${window.location.origin}/p/${row.id}`;
}

export default function PreviewPage() {
  const router = useRouter();

  const [side, setSide] = useState<Side>('front');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [toName, setToName] = useState('');
  const [message, setMessage] = useState('');
  const [fromName, setFromName] = useState('');
  
  // Share state
  const [shareStatus, setShareStatus] = useState<ShareStatus>('idle');
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
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

  // Helper: Share URL - always copy to clipboard
  const doShare = async (url: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(url);
      setToastMessage('Copied ✅');
      setTimeout(() => setToastMessage(null), 2000);
    } catch (err) {
      // Clipboard failed, show modal fallback
      setIsShareModalOpen(true);
    }
  };

  // Create share link on mount (check cache with validation)
  useEffect(() => {
    // Check for required localStorage data first
    const hasImage = !!localStorage.getItem('uploadedImage');
    const hasTo = !!localStorage.getItem('cardTo');
    const hasMessage = !!localStorage.getItem('cardMessage');
    const hasFrom = !!localStorage.getItem('cardFrom');
    
    if (!hasImage) {
      console.error('[Share] No uploaded image found in localStorage');
      setShareError('No photo found. Please go back and upload a photo.');
      setShareStatus('error');
      return;
    }
    
    if (!hasTo || !hasMessage || !hasFrom) {
      console.warn('[Share] Incomplete postcard data:', { hasTo, hasMessage, hasFrom });
    }
    
    // Try to get valid cached URL (checks data signature + expiration)
    const validCachedUrl = getValidCachedUrl();
    
    if (validCachedUrl) {
      setShareUrl(validCachedUrl);
      setShareStatus('ready');
      return;
    }

    // No valid cache - create new share link
    setShareStatus('creating');
    createShareLink()
      .then((url) => {
        setShareUrl(url);
        setShareStatus('ready');
        setShareCache(url); // Store with signature and timestamp
      })
      .catch((error) => {
        console.error('[Share] Failed to create share link:', error);
        console.error('[Share] Error details:', {
          message: error.message,
          name: error.name,
          stack: error.stack,
        });
        
        // Provide user-friendly error messages
        let userMessage = error.message;
        if (error.message?.includes('storage')) {
          userMessage = 'Storage upload failed. Check Supabase bucket exists and RLS policies.';
        } else if (error.message?.includes('Database')) {
          userMessage = 'Database save failed. Check table exists and RLS policies.';
        } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
          userMessage = 'Network error. Please check your internet connection.';
        }
        
        setShareError(userMessage);
        setShareStatus('error');
      });
  }, []);

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
    if (!shareUrl || shareStatus !== 'ready') return;
    await doShare(shareUrl);
  };

  const handleRetry = async () => {
    setShareStatus('creating');
    setShareError(null);
    try {
      const url = await createShareLink();
      setShareUrl(url);
      setShareStatus('ready');
      setShareCache(url); // Store with signature and timestamp
    } catch (error: any) {
      console.error('[Share] Retry failed:', error);
      
      // Provide user-friendly error messages
      let userMessage = error.message;
      if (error.message?.includes('storage')) {
        userMessage = 'Storage upload failed. Check Supabase bucket exists and RLS policies.';
      } else if (error.message?.includes('Database')) {
        userMessage = 'Database save failed. Check table exists and RLS policies.';
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        userMessage = 'Network error. Please check your internet connection.';
      }
      
      setShareError(userMessage);
      setShareStatus('error');
    }
  };

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setToastMessage('Copied ✅');
      setIsShareModalOpen(false);
      setTimeout(() => setToastMessage(null), 2000);
    } catch (err) {
      setToastMessage('Failed to copy');
      setTimeout(() => setToastMessage(null), 2000);
    }
  };

  const handleOpenLink = () => {
    if (!shareUrl) return;
    window.open(shareUrl, '_blank');
    setIsShareModalOpen(false);
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

  return (
    <div
      className="relative w-full h-screen overflow-hidden"
      style={{
        background:
          'linear-gradient(90deg, rgb(240, 252, 255) 0%, rgb(240, 252, 255) 100%)',
      }}
    >
      {/* Toast notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#7DBFD6',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '8px',
            fontFamily: 'var(--font-courier, Courier, monospace)',
            fontSize: '14px',
            fontWeight: 700,
            letterSpacing: '1px',
            zIndex: 1000,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            animation: 'fadeIn 0.2s ease-in',
          }}
        >
          {toastMessage}
        </div>
      )}

      {/* Bottom sheet modal for share fallback */}
      {isShareModalOpen && shareUrl && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setIsShareModalOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              zIndex: 998,
              animation: 'fadeIn 0.2s ease-in',
            }}
          />
          {/* Modal */}
          <div
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'white',
              borderTopLeftRadius: '16px',
              borderTopRightRadius: '16px',
              padding: '24px',
              zIndex: 999,
              boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
              animation: 'slideUp 0.3s ease-out',
            }}
          >
            <div style={{ marginBottom: '20px' }}>
              <h3
                style={{
                  fontFamily: 'var(--font-courier, Courier, monospace)',
                  fontSize: '18px',
                  fontWeight: 700,
                  marginBottom: '8px',
                }}
              >
                Share Postcard
              </h3>
              <p
                style={{
                  fontFamily: 'var(--font-courier, Courier, monospace)',
                  fontSize: '14px',
                  color: '#6b6b6b',
                  wordBreak: 'break-all',
                }}
              >
                {shareUrl}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px', flexDirection: 'column' }}>
              <button
                onClick={handleCopyLink}
                style={{
                  background: '#7DBFD6',
                  color: 'white',
                  padding: '14px 24px',
                  borderRadius: '8px',
                  fontFamily: 'var(--font-courier, Courier, monospace)',
                  fontWeight: 700,
                  letterSpacing: '1px',
                  fontSize: '14px',
                  border: 'none',
                  cursor: 'pointer',
                  width: '100%',
                }}
              >
                Copy Link
              </button>
              <button
                onClick={handleOpenLink}
                style={{
                  background: 'transparent',
                  color: '#454545',
                  padding: '14px 24px',
                  borderRadius: '8px',
                  fontFamily: 'var(--font-courier, Courier, monospace)',
                  fontWeight: 700,
                  letterSpacing: '1px',
                  fontSize: '14px',
                  border: '1px solid rgba(0,0,0,0.2)',
                  cursor: 'pointer',
                  width: '100%',
                }}
              >
                Open Link
              </button>
            </div>
          </div>
        </>
      )}
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
              onClick={shareStatus === 'error' ? handleRetry : handleShare}
              disabled={shareStatus === 'creating' || shareStatus === 'idle' || !shareUrl}
              style={{
                background: shareStatus === 'error' ? '#ff6b6b' : (shareStatus === 'creating' || shareStatus === 'idle' || !shareUrl) ? '#ccc' : '#7DBFD6',
                padding: '10px 18px',
                fontFamily: 'var(--font-courier, Courier, monospace)',
                fontWeight: 700,
                letterSpacing: '1px',
                color: 'white',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                cursor: (shareStatus === 'creating' || shareStatus === 'idle' || !shareUrl) ? 'not-allowed' : 'pointer',
                opacity: (shareStatus === 'creating' || shareStatus === 'idle' || !shareUrl) ? 0.6 : 1,
                border: 'none',
              }}
            >
              {shareStatus === 'creating' ? 'Preparing…' : shareStatus === 'error' ? 'Retry' : 'SHARE'} 
              {shareStatus === 'ready' && <span style={{ fontSize: 18, lineHeight: 1 }}>›</span>}
            </button>
          </div>
          
          {/* Error message display */}
          {shareStatus === 'error' && shareError && (
            <div style={{ marginTop: '12px' }}>
              <p 
                style={{ 
                  color: '#ff6b6b', 
                  fontFamily: 'var(--font-courier, Courier, monospace)',
                  fontSize: '14px',
                  fontWeight: 700,
                  lineHeight: '1.4',
                  maxWidth: '300px',
                }}
              >
                {shareError}
              </p>
              <p 
                style={{ 
                  color: '#6b6b6b', 
                  fontFamily: 'var(--font-courier, Courier, monospace)',
                  fontSize: '12px',
                  marginTop: '4px',
                }}
              >
                Check console (F12) for details or try again.
              </p>
            </div>
          )}
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
            className="polaroid-frame absolute left-1/2 top-1/2"
            style={{
              transform: polaroidInitialTransform,
              transformOrigin: polaroidTransformOrigin,
              opacity: polaroidInitialOpacity,
              zIndex: 2,
              background: 'transparent',
              boxShadow: 'none',
              padding: 0,
              paddingBottom: 0,
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
                    padding: 15,
                    paddingBottom: 30.6,
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
                      bottom: 8,
                      width: '100%',
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
