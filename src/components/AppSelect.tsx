import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

interface AppSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
  size?: "md" | "lg";
  style?: React.CSSProperties;
  className?: string;
}

export default function AppSelect({ value, onChange, options, size = "md", style, className }: AppSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [open]);

  const selected = options.find(o => o.value === value);

  return (
    <div ref={ref} className={`appSel${className ? " " + className : ""}`} style={{ position: "relative", ...style }}>
      <button
        type="button"
        className={`appSelTrigger appSel${size === "lg" ? "Lg" : "Md"}${open ? " appSelOpen" : ""}`}
        onClick={() => setOpen(v => !v)}
      >
        <span className="appSelValue">{selected?.label ?? value}</span>
        <ChevronDown size={size === "lg" ? 15 : 13} className={`appSelChevron${open ? " appSelChevronOpen" : ""}`} />
      </button>

      {open && (
        <div className="appSelDropdown">
          {options.map(opt => (
            <button
              key={opt.value}
              type="button"
              className={`appSelOpt${opt.value === value ? " appSelOptActive" : ""}`}
              onClick={() => { onChange(opt.value); setOpen(false); }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
