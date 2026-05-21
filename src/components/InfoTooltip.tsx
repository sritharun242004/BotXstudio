import { useState, useRef, useEffect } from "react";

interface InfoTooltipProps {
  text: string;
  position?: "top" | "bottom" | "right" | "left";
}

export default function InfoTooltip({ text, position = "bottom" }: InfoTooltipProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [open]);

  return (
    <div
      ref={ref}
      className="infoTip"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className="infoTipBtn"
        onClick={() => setOpen(v => !v)}
        aria-label="More information"
      >
        i
      </button>

      {open && (
        <div className={`infoTipPopup infoTipPopup-${position}`}>
          <div className={`infoTipArrow infoTipArrow-${position}`} />
          <p className="infoTipText">{text}</p>
        </div>
      )}
    </div>
  );
}
