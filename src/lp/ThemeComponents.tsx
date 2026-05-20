import React from "react";
import { motion } from "framer-motion";

export const CandyButton = ({ children, className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    className={`group relative inline-flex items-center justify-center gap-2 rounded-full bg-accent px-8 py-4 text-accent-foreground font-bold border-2 border-foreground shadow-[4px_4px_0px_0px_#1E293B] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_#1E293B] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#1E293B] transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${className}`}
    {...props}
  >
    {children}
  </button>
);

export const SecondaryButton = ({ children, className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    className={`group relative inline-flex items-center justify-center gap-2 rounded-full bg-transparent px-8 py-4 text-foreground font-bold border-2 border-foreground hover:bg-tertiary transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${className}`}
    {...props}
  >
    {children}
  </button>
);

export const StickerCard = ({ title, children, icon: Icon, delay = 0, shadowColor = "#E2E8F0" }: { title: string, children: React.ReactNode, icon: any, delay?: number, shadowColor?: string }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    whileInView={{ opacity: 1, scale: 1 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay, type: "spring", bounce: 0.4 }}
    whileHover={{ rotate: -1, scale: 1.02 }}
    style={{
      position: "relative",
      background: "#FFFFFF",
      border: "2px solid #1E293B",
      borderRadius: 16,
      padding: "40px 32px 32px",
      boxShadow: `8px 8px 0px 0px ${shadowColor}`,
      marginTop: 28,
    }}
  >
    <div style={{
      position: "absolute",
      top: -28,
      left: 28,
      background: "#FFFFFF",
      border: "2px solid #1E293B",
      borderRadius: "50%",
      width: 56,
      height: 56,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: "4px 4px 0px 0px #1E293B",
    }}>
      <Icon style={{ width: 28, height: 28, color: "#1E293B" }} strokeWidth={2.5} />
    </div>
    <h3 style={{ fontSize: 20, fontFamily: "Outfit, system-ui, sans-serif", fontWeight: 700, marginBottom: 12, color: "#1E293B" }}>{title}</h3>
    <div style={{ color: "#64748B", fontSize: 15, lineHeight: 1.6 }}>{children}</div>
  </motion.div>
);
