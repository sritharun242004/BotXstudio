import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import { AnimatePresence, motion, type Transition } from "framer-motion";

function cx(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(" ");
}

function splitChars(text: string): string[] {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const seg = new Intl.Segmenter("en", { granularity: "grapheme" });
    return Array.from(seg.segment(text), ({ segment }) => segment);
  }
  return Array.from(text);
}

interface WordObj {
  characters: string[];
  needsSpace: boolean;
}

export interface TextRotateRef {
  next: () => void;
  previous: () => void;
  jumpTo: (index: number) => void;
  reset: () => void;
}

interface TextRotateProps {
  texts: string[];
  rotationInterval?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initial?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  animate?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  exit?: any;
  animatePresenceMode?: "wait" | "sync" | "popLayout";
  animatePresenceInitial?: boolean;
  staggerDuration?: number;
  staggerFrom?: "first" | "last" | "center" | "random" | number;
  transition?: Transition;
  loop?: boolean;
  auto?: boolean;
  splitBy?: "words" | "characters" | "lines" | string;
  onNext?: (index: number) => void;
  mainClassName?: string;
  splitLevelClassName?: string;
  elementLevelClassName?: string;
}

export const TextRotate = forwardRef<TextRotateRef, TextRotateProps>(function TextRotate(
  {
    texts,
    transition = { type: "spring", damping: 25, stiffness: 300 },
    initial = { y: "100%", opacity: 0 },
    animate = { y: 0, opacity: 1 },
    exit = { y: "-120%", opacity: 0 },
    animatePresenceMode = "wait",
    animatePresenceInitial = false,
    rotationInterval = 2000,
    staggerDuration = 0,
    staggerFrom = "first",
    loop = true,
    auto = true,
    splitBy = "characters",
    onNext,
    mainClassName,
    splitLevelClassName,
    elementLevelClassName,
    ...props
  },
  ref
) {
  const [idx, setIdx] = useState(0);

  const elements = useMemo<WordObj[]>(() => {
    const text = texts[idx];
    if (splitBy === "characters") {
      return text.split(" ").map((word, i, arr) => ({
        characters: splitChars(word),
        needsSpace: i !== arr.length - 1,
      }));
    }
    const parts =
      splitBy === "words" ? text.split(" ")
      : splitBy === "lines" ? text.split("\n")
      : text.split(splitBy);
    return parts.map((el, i) => ({ characters: [el], needsSpace: i !== parts.length - 1 }));
  }, [texts, idx, splitBy]);

  const staggerDelay = useCallback(
    (i: number, total: number) => {
      if (staggerFrom === "first") return i * staggerDuration;
      if (staggerFrom === "last") return (total - 1 - i) * staggerDuration;
      if (staggerFrom === "center") return Math.abs(Math.floor(total / 2) - i) * staggerDuration;
      if (staggerFrom === "random") return Math.abs(Math.floor(Math.random() * total) - i) * staggerDuration;
      return Math.abs(staggerFrom - i) * staggerDuration;
    },
    [staggerFrom, staggerDuration]
  );

  const change = useCallback((newIdx: number) => { setIdx(newIdx); onNext?.(newIdx); }, [onNext]);
  const next = useCallback(() => {
    const n = idx === texts.length - 1 ? (loop ? 0 : idx) : idx + 1;
    if (n !== idx) change(n);
  }, [idx, texts.length, loop, change]);
  const previous = useCallback(() => {
    const n = idx === 0 ? (loop ? texts.length - 1 : idx) : idx - 1;
    if (n !== idx) change(n);
  }, [idx, texts.length, loop, change]);
  const jumpTo = useCallback((i: number) => {
    const n = Math.max(0, Math.min(i, texts.length - 1));
    if (n !== idx) change(n);
  }, [idx, texts.length, change]);
  const reset = useCallback(() => { if (idx !== 0) change(0); }, [idx, change]);

  useImperativeHandle(ref, () => ({ next, previous, jumpTo, reset }), [next, previous, jumpTo, reset]);

  useEffect(() => {
    if (!auto) return;
    const id = setInterval(next, rotationInterval);
    return () => clearInterval(id);
  }, [next, rotationInterval, auto]);

  const totalChars = elements.reduce((s, w) => s + w.characters.length, 0);

  return (
    <motion.span
      className={cx("flex flex-wrap whitespace-pre-wrap", mainClassName)}
      layout
      transition={transition}
      {...props}
    >
      <span className="sr-only">{texts[idx]}</span>
      <AnimatePresence mode={animatePresenceMode} initial={animatePresenceInitial}>
        <motion.div
          key={idx}
          className={cx("flex flex-wrap", splitBy === "lines" ? "flex-col w-full" : undefined)}
          layout
          aria-hidden="true"
        >
          {elements.map((word, wi, arr) => {
            const prevChars = arr.slice(0, wi).reduce((s, w) => s + w.characters.length, 0);
            return (
              <span key={wi} className={cx("inline-flex", splitLevelClassName)}>
                {word.characters.map((char, ci) => (
                  <motion.span
                    key={ci}
                    initial={initial}
                    animate={animate}
                    exit={exit}
                    transition={{ ...transition, delay: staggerDelay(prevChars + ci, totalChars) }}
                    className={cx("inline-block", elementLevelClassName)}
                  >
                    {char}
                  </motion.span>
                ))}
                {word.needsSpace && <span className="whitespace-pre"> </span>}
              </span>
            );
          })}
        </motion.div>
      </AnimatePresence>
    </motion.span>
  );
});
