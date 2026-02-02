"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { toPng } from "html-to-image";

type PostcardData = {
  id: string;
  photo_url: string;
  caption: string;
  to_name: string;
  message: string;
  from_name: string;
  template_ver: number;
  created_at?: string;
};

type Side = "front" | "back";

export default function PostcardShareView() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [data, setData] = useState<PostcardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [side, setSide] = useState<Side>("front");

  // Swipe handler
  const startRef = useRef<{ x: number; y: number } | null>(null);

  // Export nodes (offscreen, no 3D transforms)
  const frontExportRef = useRef<HTMLDivElement>(null);
  const backExportRef = useRef<HTMLDivElement>(null);

  // Animation refs
  const polaroidRef = useRef<HTMLDivElement>(null);

  // Track initial polaroid transform for smooth animation
  const [polaroidInitialTransform, setPolaroidInitialTransform] = useState<string>('translate(-50%, -35%) rotate(-12deg) scale(1)');
  const [polaroidInitialOpacity, setPolaroidInitialOpacity] = useState<string>('1');
  const [polaroidTransformOrigin, setPolaroidTransformOrigin] = useState<string>('center center');

  useEffect(() => {
    async function fetchPostcard() {
      if (!id) {
        setLoading(false);
        return;
      }

      const { data: postcard, error } = await supabase
        .from("postcard")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !postcard) {
        console.error("Error fetching postcard:", error);
        setData(null);
      } else {
        setData(postcard);
      }
      setLoading(false);
    }

    fetchPostcard();
  }, [id]);

  // Animation effect - runs after data is loaded
  useEffect(() => {
    if (!data || loading) return;

    // Always animate entrance for magic link page
    // Set initial transform and opacity immediately to prevent flash
    // Start from bottom position with scale(0) for upward scale animation
    const startY = 'calc(-35% + 150px)';
    setPolaroidInitialTransform(`translate(-50%, ${startY}) rotate(-12deg) scale(0)`);
    setPolaroidInitialOpacity('0');
    setPolaroidTransformOrigin('bottom center');

    // Use double requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // Polaroid - start at bottom with scale(0), scale up from bottom after 1500ms delay
        if (polaroidRef.current) {
          // Start from bottom position (below final position) with scale(0) - set synchronously
          // Position it at the bottom where it will scale up from
          const startY = 'calc(-35% + 150px)'; // Start below final position
          polaroidRef.current.style.transform = `translate(-50%, ${startY}) rotate(-12deg) scale(0)`;
          polaroidRef.current.style.transformOrigin = 'bottom center'; // Scale from bottom
          polaroidRef.current.style.transition = 'none';
          polaroidRef.current.style.opacity = '0'; // Start invisible
          polaroidRef.current.style.willChange = 'transform, opacity';
          polaroidRef.current.style.visibility = 'visible';
          
          // Wait 1500ms, then scale up from bottom and move to final position
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
          }, 1500); // 1500ms delay before animation starts
        }
      });
    });
  }, [data, loading]);

  const toggle = () => setSide((s) => (s === "front" ? "back" : "front"));

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

    if (absX < TAP_MAX && absY < TAP_MAX) toggle();
    else if (absX > SWIPE_MIN && absX > absY) toggle();
  };

  const markerStyle: React.CSSProperties = {
    color: "#3A3A3A",
    textAlign: "right",
    fontFamily: 'var(--font-permanent-marker), "Permanent Marker", cursive',
    fontSize: 36,
    fontWeight: 400,
    lineHeight: "36px",
    letterSpacing: "-1.8px",
  };

  const handStyle: React.CSSProperties = {
    color: "#686868",
    fontFamily: '"Bradley Hand", cursive',
    fontSize: 14,
    fontStyle: "normal",
    fontWeight: 700,
    lineHeight: "150%",
  };

  async function downloadNodeAsPng(node: HTMLElement, filename: string) {
    // @ts-ignore
    if (document.fonts?.ready) await (document as any).fonts.ready;

    const dataUrl = await toPng(node, { cacheBust: true, pixelRatio: 2 });

    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = filename;
    a.click();
  }

  const handleSave = async () => {
    if (!data || !frontExportRef.current || !backExportRef.current) {
      alert('Unable to save: postcard data or export nodes missing');
      return;
    }

    try {
      await downloadNodeAsPng(frontExportRef.current, "postcard-front.png");
      await new Promise((r) => setTimeout(r, 250));
      await downloadNodeAsPng(backExportRef.current, "postcard-back.png");
    } catch (error) {
      console.error('Error saving postcard:', error);
      alert('Failed to save images. Please try again.');
    }
  };

  if (loading) {
    return (
      <div
        className="relative w-full h-screen overflow-hidden flex items-center justify-center"
        style={{
          background:
            "linear-gradient(90deg, rgb(240, 252, 255) 0%, rgb(240, 252, 255) 100%)",
        }}
      >
        <div className="p-6 text-center">
          <p className="text-[#2f2f2f] font-courier text-lg">Loading postcard...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div
        className="relative w-full h-screen overflow-hidden flex items-center justify-center"
        style={{
          background:
            "linear-gradient(90deg, rgb(240, 252, 255) 0%, rgb(240, 252, 255) 100%)",
        }}
      >
        <div className="p-6 text-center">
          <p className="text-[#2f2f2f] font-courier text-lg">
            This postcard isn't available.
          </p>
          <p className="text-[#6b6b6b] mt-2 font-courier text-sm">
            The postcard may have been deleted or the link is invalid.
          </p>
          <button
            className="mt-4 underline font-courier text-[#2f2f2f] cursor-pointer"
            onClick={() => router.push("/")}
          >
            Go home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative w-full h-screen overflow-hidden"
      style={{
        background:
          "linear-gradient(90deg, rgb(240, 252, 255) 0%, rgb(240, 252, 255) 100%)",
      }}
    >
      {/* Texture */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "url(/Asset/Bg.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          opacity: 0.5,
        }}
      />

      <div className="relative mx-auto w-full max-w-[440px] h-full flex flex-col px-4">
        {/* Header copy */}
        <div className="pt-12">
          <h1
            style={{
              fontFamily: "var(--font-courier, Courier, monospace)",
              fontSize: 40,
              lineHeight: "1.05",
              letterSpacing: "-1.6px",
              color: "#000",
            }}
          >
            Here's your postcard
          </h1>

          <p
            style={{
              fontFamily: "var(--font-courier, Courier, monospace)",
              marginTop: 10,
              fontSize: 20,
              lineHeight: "24px",
              color: "#6b6b6b",
            }}
          >
            Tap or swipe to flip
          </p>

          <div className="flex gap-4 mt-5">
            <button
              onClick={handleSave}
              style={{
                background: "#7DBFD6",
                padding: "10px 18px",
                fontFamily: "var(--font-courier, Courier, monospace)",
                fontWeight: 700,
                letterSpacing: "1px",
                color: "white",
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                cursor: "pointer",
              }}
            >
              SAVE <span style={{ fontSize: 18, lineHeight: 1 }}>›</span>
            </button>
          </div>
        </div>

        {/* Scene */}
        <div className="flex-1 relative">
          {/* composite bg */}
          <img
            src="/Asset/previewbg2.png"
            alt=""
            className="absolute pointer-events-none select-none"
            style={{
              left: "50%",
              bottom: 80,
              transform: "translateX(-50%) scale(1.5)",
              width: "100%",
              maxWidth: "500px",
              height: "auto",
              minHeight: "300px",
              zIndex: 1,
            }}
          />

          {/* Flip card on top */}
          <div
            ref={polaroidRef}
            className="absolute left-1/2 top-1/2"
            style={{
              transform: polaroidInitialTransform,
              transformOrigin: polaroidTransformOrigin,
              opacity: polaroidInitialOpacity,
              width: "min(95vw, 450px)",
              aspectRatio: "4 / 3",
              zIndex: 2,
            }}
          >
            <div style={{ width: "100%", height: "100%", perspective: 1200 }}>
              <div
                onPointerDown={onPointerDown}
                onPointerUp={onPointerUp}
                style={{
                  width: "100%",
                  height: "100%",
                  position: "relative",
                  transformStyle: "preserve-3d",
                  transition: "transform 520ms cubic-bezier(.2,.8,.2,1)",
                  transform: side === "back" ? "rotateY(180deg)" : "rotateY(0deg)",
                  touchAction: "pan-y",
                  cursor: "pointer",
                }}
              >
                {/* FRONT */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    backfaceVisibility: "hidden",
                    background: "#F4F4F4",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
                    padding: 14,
                    paddingBottom: 36,
                    boxSizing: "border-box",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <div style={{ flex: 1, overflow: "hidden", background: "#eaeaea" }}>
                    <img
                      src={data.photo_url}
                      alt="Postcard photo"
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    />
                  </div>

                  <div
                    style={{
                      position: "absolute",
                      right: 18,
                      bottom: 10,
                      width: "70%",
                      transform: "rotate(-2deg)",
                      whiteSpace: "pre-wrap",
                      overflow: "hidden",
                      ...markerStyle,
                    }}
                  >
                    {data.caption}
                  </div>
                </div>

                {/* BACK */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    transform: "rotateY(180deg)",
                    backfaceVisibility: "hidden",
                    background: "#F4F4F4",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
                    padding: "26px 28px",
                    boxSizing: "border-box",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    ...handStyle,
                  }}
                >
                  <div style={{ display: "flex", gap: 10, alignItems: "baseline", flexShrink: 0 }}>
                    <span style={{ color: "#2f2f2f" }}>To</span>
                    <span style={{ borderBottom: "2px solid rgba(0,0,0,0.25)", paddingBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "200px" }}>
                      {data.to_name}
                    </span>
                  </div>

                  <div style={{ marginTop: 14, flex: 1, whiteSpace: "pre-wrap", overflow: "hidden", overflowY: "auto", wordBreak: "break-word", overflowWrap: "break-word", maxWidth: "100%" }}>
                    {data.message}
                  </div>

                  <div style={{ display: "flex", gap: 10, alignItems: "baseline", marginTop: 18, flexShrink: 0 }}>
                    <span style={{ color: "#2f2f2f" }}>From</span>
                    <span style={{ borderBottom: "2px solid rgba(0,0,0,0.25)", paddingBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "200px" }}>
                      {data.from_name}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Offscreen export nodes (no 3D) */}
          <div style={{ position: "fixed", left: -9999, top: 0, width: 0, height: 0, overflow: "hidden" }}>
            {/* FRONT export */}
            <div
              ref={frontExportRef}
              style={{
                width: 450,
                height: 337.5,
                background: "#F4F4F4",
                padding: 14,
                paddingBottom: 36,
                boxSizing: "border-box",
                position: "relative",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div style={{ flex: 1, overflow: "hidden", background: "#eaeaea" }}>
                <img
                  src={data.photo_url}
                  alt="photo"
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              </div>
              <div style={{ position: "absolute", right: 18, bottom: 10, width: "70%", ...markerStyle, whiteSpace: "pre-wrap" }}>
                {data.caption}
              </div>
            </div>

            {/* BACK export */}
            <div
              ref={backExportRef}
              style={{
                width: 450,
                height: 337.5,
                background: "#F4F4F4",
                padding: "26px 28px",
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                ...handStyle,
              }}
            >
              <div style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
                <span style={{ color: "#2f2f2f" }}>To</span>
                <span style={{ borderBottom: "2px solid rgba(0,0,0,0.25)", paddingBottom: 2 }}>
                  {data.to_name}
                </span>
              </div>
              <div style={{ marginTop: 14, flex: 1, whiteSpace: "pre-wrap" }}>{data.message}</div>
              <div style={{ display: "flex", gap: 10, alignItems: "baseline", marginTop: 18 }}>
                <span style={{ color: "#2f2f2f" }}>From</span>
                <span style={{ borderBottom: "2px solid rgba(0,0,0,0.25)", paddingBottom: 2 }}>
                  {data.from_name}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
