import { FC, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

export interface CardItem {
  title: string;
  description: string;
  src: string;
  color: string;
  textColor: string;
  tag?: string;
  link?: string;
}

interface CardProps extends CardItem {
  i: number;
  total: number;
}

// Checked once at module load — Vite app has no SSR so window is always available
const isMobileDevice = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(max-width: 768px)").matches;

const VARIANTS = {
  hidden:  { opacity: 0, y: 56, scale: 0.90 },
  visible: { opacity: 1, y: 0,  scale: 1    },
};

const Card: FC<CardProps> = ({ title, description, src, i, total }) => {
  const ref = useRef<HTMLDivElement>(null);
  const mobile = isMobileDevice();
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || !mobile) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); io.disconnect(); } },
      { threshold: 0.18 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="h-screen flex items-center justify-center sticky top-0 px-6 md:px-0">
      <motion.div
        ref={ref}
        className="relative w-full max-w-[340px] md:max-w-[600px] overflow-hidden
                   rounded-[22px] border-[2.5px] border-slate-800
                   shadow-[6px_6px_0_rgba(30,41,59,0.85)]"
        style={{ aspectRatio: "3/4" }}
        variants={mobile ? VARIANTS : undefined}
        initial={mobile ? "hidden" : false}
        animate={mobile ? (inView ? "visible" : "hidden") : undefined}
        transition={{ duration: 0.70, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Background image */}
        <img
          className="absolute inset-0 w-full h-full object-cover object-top"
          src={src}
          alt={title}
        />

        {/* Bottom gradient scrim */}
        <div className="absolute bottom-0 left-0 right-0 h-[42%] bg-gradient-to-t from-black/70 to-transparent z-10 pointer-events-none" />

        {/* Card counter */}
        <span className="absolute top-3.5 right-4 z-20 text-[11px] font-extrabold text-white/55 tracking-widest">
          {i + 1} / {total}
        </span>

        {/* Label + description */}
        <div className="absolute bottom-5 left-0 right-0 z-20 text-center px-4">
          <span className="inline-block bg-white text-slate-800 text-[13px] font-extrabold
                          tracking-wide px-[18px] py-[5px] rounded-full border-2
                          border-slate-800 shadow-[2px_2px_0_#1E293B] mb-2">
            {title}
          </span>
          <p className="text-[12px] text-white/80 font-medium leading-relaxed">
            {description}
          </p>
        </div>
      </motion.div>
    </div>
  );
};

interface CardsParallaxProps {
  items: CardItem[];
}

const CardsParallax: FC<CardsParallaxProps> = ({ items }) => (
  <div>
    {items.map((item, i) => (
      <Card key={i} {...item} i={i} total={items.length} />
    ))}
  </div>
);

export { CardsParallax };
