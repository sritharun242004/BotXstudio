import { useState, useRef, useEffect } from "react";

interface FieldLabelProps {
  htmlFor?: string;
  label: string;
  info: string;
}

export default function FieldLabel({ htmlFor, label, info }: FieldLabelProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div className="labelRow" ref={ref}>
      <label htmlFor={htmlFor}>{label}</label>
      <button
        type="button"
        className="infoIconBtn"
        onClick={() => setOpen((v) => !v)}
        aria-label={`About: ${label}`}
        aria-expanded={open}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </button>
      {open && (
        <div className="infoPopup" role="tooltip">
          {info}
        </div>
      )}
    </div>
  );
}
