import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from "react";
import { useAnimationFrame } from "framer-motion";
import { useMousePositionRef } from "../hooks/use-mouse-position-ref";

interface FloatingCtx {
  register: (id: string, el: HTMLDivElement, depth: number) => void;
  unregister: (id: string) => void;
}

const Ctx = createContext<FloatingCtx | null>(null);

type ElementData = { element: HTMLDivElement; depth: number; pos: { x: number; y: number } };

interface FloatingProps {
  children: ReactNode;
  style?: React.CSSProperties;
  sensitivity?: number;
  easingFactor?: number;
}

export function Floating({ children, style, sensitivity = 1, easingFactor = 0.05 }: FloatingProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const map = useRef(new Map<string, ElementData>());
  const mouse = useMousePositionRef(containerRef);

  const register = useCallback((id: string, el: HTMLDivElement, depth: number) => {
    map.current.set(id, { element: el, depth, pos: { x: 0, y: 0 } });
  }, []);

  const unregister = useCallback((id: string) => {
    map.current.delete(id);
  }, []);

  useAnimationFrame(() => {
    if (!containerRef.current) return;
    map.current.forEach((data) => {
      const strength = (data.depth * sensitivity) / 20;
      const tx = mouse.current.x * strength;
      const ty = mouse.current.y * strength;
      data.pos.x += (tx - data.pos.x) * easingFactor;
      data.pos.y += (ty - data.pos.y) * easingFactor;
      data.element.style.transform = `translate3d(${data.pos.x}px, ${data.pos.y}px, 0)`;
    });
  });

  return (
    <Ctx.Provider value={{ register, unregister }}>
      <div
        ref={containerRef}
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          ...style,
        }}
      >
        {children}
      </div>
    </Ctx.Provider>
  );
}

interface FloatingElementProps {
  children: ReactNode;
  style?: React.CSSProperties;
  depth?: number;
}

export function FloatingElement({ children, style, depth = 1 }: FloatingElementProps) {
  const ref = useRef<HTMLDivElement>(null);
  const id = useRef(Math.random().toString(36).slice(2, 9));
  const ctx = useContext(Ctx);

  useEffect(() => {
    if (!ref.current || !ctx) return;
    ctx.register(id.current, ref.current, depth);
    return () => ctx.unregister(id.current);
  }, [depth, ctx]);

  return (
    <div ref={ref} style={{ position: "absolute", willChange: "transform", ...style }}>
      {children}
    </div>
  );
}
