import { useState, useEffect } from "react";

type TourStep = {
  target: string;
  title: string;
  body: string;
  position?: "top" | "bottom" | "left" | "right";
};

type TourDef = {
  id: string;
  label: string;
  steps: TourStep[];
};

const TOURS: Record<string, TourDef> = {
  prints: {
    id: "prints",
    label: "Add Prints",
    steps: [
      {
        target: "[data-tour='prints-garment-category']",
        title: "1. Choose Your Garment",
        body: "Start by picking the type of garment — T-shirt, Hoodie, Pant, and more. The front and back template images load automatically.",
        position: "right",
      },
      {
        target: "[data-tour='prints-garment-photos']",
        title: "2. Garment Photos",
        body: "Upload a plain (white/light) photo of your garment — front and back. These act as the canvas for your print design.",
        position: "right",
      },
      {
        target: "[data-tour='prints-color-picker']",
        title: "3. Pick a Garment Color",
        body: "Choose the base color for the garment. The AI will color it before applying your print, so you can preview different colorways.",
        position: "left",
      },
      {
        target: "[data-tour='prints-design']",
        title: "4. Upload Your Design",
        body: "Upload the artwork you want printed. Front is required; back is optional. The AI will copy it exactly — no creative changes.",
        position: "top",
      },
      {
        target: "[data-tour='prints-generate']",
        title: "5. Generate!",
        body: "Click Generate to apply your print. The AI produces front and back views with the design faithfully placed on the garment.",
        position: "top",
      },
    ],
  },
  tryon: {
    id: "tryon",
    label: "Try On",
    steps: [
      {
        target: "[data-tour='tryon-category']",
        title: "1. Select Body Area",
        body: "Choose the body area the garment covers: Upper Body for tops, Lower Body for bottoms, Full Body for dresses or sarees.",
        position: "bottom",
      },
      {
        target: "[data-tour='tryon-garment']",
        title: "2. Upload Garment Photo",
        body: "Upload a photo of the garment to try on. Flat-lay or mannequin shots on a plain background work best.",
        position: "bottom",
      },
      {
        target: "[data-tour='tryon-model']",
        title: "3. Upload Model Photo",
        body: "Upload a front-facing photo of the person who will wear the garment. Clear lighting and a full or upper-body view gives best results.",
        position: "bottom",
      },
      {
        target: "[data-tour='tryon-generate']",
        title: "4. Try On!",
        body: "Click 'Try On Garment' and the AI will dress the model in your garment. Generation takes around 20–40 seconds.",
        position: "top",
      },
    ],
  },
  generate: {
    id: "generate",
    label: "Mood Boards",
    steps: [
      {
        target: "[data-tour='generate-moodboard-header']",
        title: "1. Your Mood Boards",
        body: "Mood boards store all your prompt settings — garment details, model style, background and more. Create as many as you need for different looks or campaigns.",
        position: "bottom",
      },
      {
        target: "[data-tour='generate-new-board']",
        title: "2. Create a Mood Board",
        body: "Click 'New mood board' to start a fresh idea. Give it a name, pick a garment type, then fill in your creative brief.",
        position: "bottom",
      },
      {
        target: "[data-tour='generate-moodboard-cards']",
        title: "3. Open & Edit",
        body: "Click any mood board card to open the editor. Adjust your settings, upload reference images, then hit Generate to produce your fashion image.",
        position: "top",
      },
    ],
  },
};

type TourState = { tourId: string; stepIndex: number };

let _setTour: ((state: TourState | null) => void) | null = null;

export function startTour(tourId: string, stepIndex = 0) {
  if (_setTour) _setTour({ tourId, stepIndex });
}

const PAD = 12;

function getRect(selector: string) {
  const el = document.querySelector(selector);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

export default function GuidedTour() {
  const [tour, setTour] = useState<TourState | null>(null);
  const [rect, setRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);

  useEffect(() => {
    _setTour = setTour;
    return () => { _setTour = null; };
  }, []);

  const tourDef = tour ? TOURS[tour.tourId] : null;
  const step = tourDef ? tourDef.steps[tour!.stepIndex] : null;

  useEffect(() => {
    if (!step) { setRect(null); return; }

    function measure() {
      if (!step) return;
      setRect(getRect(step.target));
    }

    // Small delay so the tab can mount before we measure
    const t = setTimeout(measure, 80);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [step]);

  useEffect(() => {
    if (!step) return;
    const el = document.querySelector(step.target);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [step]);

  if (!tour || !tourDef || !step) return null;

  const total = tourDef.steps.length;
  const isFirst = tour.stepIndex === 0;
  const isLast = tour.stepIndex === total - 1;

  function next() {
    if (!tour) return;
    if (isLast) { setTour(null); return; }
    setTour({ ...tour, stepIndex: tour.stepIndex + 1 });
  }
  function back() {
    if (!tour || isFirst) return;
    setTour({ ...tour, stepIndex: tour.stepIndex - 1 });
  }
  function skip() { setTour(null); }

  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // 4-rectangle spotlight
  const tr = rect;
  const overlay = { position: "fixed" as const, background: "rgba(15,10,30,0.72)", zIndex: 9998, pointerEvents: "all" as const };

  const topR    = tr ? { top: 0, left: 0, right: 0, height: Math.max(0, tr.top - PAD) } : null;
  const bottomR = tr ? { top: tr.top + tr.height + PAD, left: 0, right: 0, bottom: 0 } : null;
  const leftR   = tr ? { top: tr.top - PAD, left: 0, width: Math.max(0, tr.left - PAD), height: tr.height + PAD * 2 } : null;
  const rightR  = tr ? { top: tr.top - PAD, left: tr.left + tr.width + PAD, right: 0, height: tr.height + PAD * 2 } : null;

  // Popover placement
  const POP_W = 300;
  const POP_H = 220;
  const pos = step.position ?? "bottom";
  let pop: React.CSSProperties = {};
  if (tr) {
    const cx = tr.left + tr.width / 2;
    const cy = tr.top + tr.height / 2;
    const safeL = (x: number) => Math.min(Math.max(x, 12), vw - POP_W - 12);
    const safeT = (y: number) => Math.min(Math.max(y, 12), vh - POP_H - 12);
    if (pos === "bottom") pop = { top: tr.top + tr.height + PAD + 8, left: safeL(cx - POP_W / 2) };
    else if (pos === "top") pop = { top: safeT(tr.top - POP_H - PAD - 8), left: safeL(cx - POP_W / 2) };
    else if (pos === "right") pop = { top: safeT(cy - POP_H / 2), left: tr.left + tr.width + PAD + 8 };
    else pop = { top: safeT(cy - POP_H / 2), left: safeL(tr.left - POP_W - PAD - 8) };
  } else {
    pop = { top: "50%", left: "50%", transform: "translate(-50%,-50%)" };
  }

  return (
    <>
      {/* Spotlight overlay */}
      {tr ? (
        <>
          {topR    && <div style={{ ...overlay, ...topR }}    onClick={skip} />}
          {bottomR && <div style={{ ...overlay, ...bottomR }} onClick={skip} />}
          {leftR   && <div style={{ ...overlay, ...leftR }}   onClick={skip} />}
          {rightR  && <div style={{ ...overlay, ...rightR }}  onClick={skip} />}
        </>
      ) : (
        <div style={{ ...overlay, inset: 0 }} onClick={skip} />
      )}

      {/* Popover card */}
      <div style={{
        position: "fixed", zIndex: 9999, width: POP_W,
        background: "#fff",
        border: "2px solid #1E293B",
        borderRadius: 14,
        boxShadow: "5px 5px 0 #1E293B",
        padding: "18px 20px 16px",
        ...pop,
      }}>
        {/* Tour label + step + close */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{
              display: "inline-block", padding: "2px 8px", borderRadius: 999,
              background: "rgba(139,92,246,0.12)", color: "#7C3AED",
              fontSize: 10, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase",
            }}>
              {tourDef.label}
            </span>
            <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600 }}>
              {tour.stepIndex + 1} / {total}
            </span>
          </div>
          <button
            type="button"
            onClick={skip}
            aria-label="Close tour"
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "#94A3B8", fontSize: 16, padding: 0, lineHeight: 1,
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 22, height: 22, borderRadius: 4,
            }}
          >
            ✕
          </button>
        </div>

        {/* Title */}
        <div style={{ fontSize: 15, fontWeight: 800, color: "#1E293B", marginBottom: 8, lineHeight: 1.3 }}>
          {step.title}
        </div>

        {/* Body */}
        <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.55, marginBottom: 16 }}>
          {step.body}
        </div>

        {/* Progress dots */}
        <div style={{ display: "flex", gap: 5, marginBottom: 14, alignItems: "center" }}>
          {tourDef.steps.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === tour.stepIndex ? 22 : 8,
                height: 8,
                borderRadius: 999,
                background: i === tour.stepIndex ? "#8B5CF6" : i < tour.stepIndex ? "#C4B5FD" : "#E2E8F0",
                transition: "width .2s, background .2s",
              }}
            />
          ))}
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: 8 }}>
          {!isFirst && (
            <button
              type="button"
              onClick={back}
              style={{
                flex: 1, padding: "9px 0", borderRadius: 9999, fontSize: 13, fontWeight: 700,
                border: "2px solid #1E293B", background: "#fff", color: "#1E293B",
                cursor: "pointer", boxShadow: "3px 3px 0 #1E293B",
              }}
            >
              ← Back
            </button>
          )}
          <button
            type="button"
            onClick={next}
            style={{
              flex: 1, padding: "9px 0", borderRadius: 9999, fontSize: 13, fontWeight: 700,
              border: "2px solid #1E293B",
              background: isLast
                ? "linear-gradient(135deg,#10B981,#059669)"
                : "linear-gradient(135deg,#8B5CF6,#EC4899)",
              color: "#fff", cursor: "pointer", boxShadow: "3px 3px 0 #1E293B",
            }}
          >
            {isLast ? "Done ✓" : "Next →"}
          </button>
        </div>
      </div>
    </>
  );
}
