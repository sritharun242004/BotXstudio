import { Link } from "react-router-dom";
import { useState } from "react";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer } from "./animations";

const APP = "/login";
const FAQS = [
  { q: "Do I need good photography skills?", a: "No. A phone photo of your garment on a hanger or flat on a table is enough. We handle everything else." },
  { q: "What if the image doesn't look right?", a: "Type a correction — 'make the background lighter' or 'adjust the sleeve drape' — and regenerate in seconds." },
  { q: "Does it work for ethnic and traditional wear?", a: "Yes. We have a dedicated workflow for sarees, lehengas, kurtas, and similar styles." },
  { q: "Do I own the images I generate?", a: "Yes. Every image you generate is yours to use commercially, without restriction." },
  { q: "What formats and sizes do I get?", a: "Outputs are high-resolution (1080×1440px), ready for Myntra, Meesho, Flipkart, and your own website." },
];

export function Gallery() {
  const items = [
    { bg: "linear-gradient(145deg,#EDE9FE,#C4B5FD)", emoji: "👗", label: "Front view",    tag: "Studio"    },
    { bg: "linear-gradient(145deg,#FDF2F8,#FBCFE8)", emoji: "👗", label: "Side angle",    tag: "3/4 turn"  },
    { bg: "linear-gradient(145deg,#F0FDF4,#BBF7D0)", emoji: "👗", label: "Back view",     tag: "Full back" },
    { bg: "linear-gradient(145deg,#FFF7ED,#FED7AA)", emoji: "🥻", label: "Ethnic wear",   tag: "Saree"     },
    { bg: "linear-gradient(145deg,#EFF6FF,#BFDBFE)", emoji: "👔", label: "Print variant", tag: "Floral"    },
    { bg: "linear-gradient(145deg,#FDF4FF,#E9D5FF)", emoji: "🧥", label: "Detail shot",   tag: "Close-up"  },
  ];

  return (
    <section className="lp-section" id="gallery">
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}>
        <motion.div className="lp-section-label" variants={fadeInUp}>✦ What You Get</motion.div>
        <motion.h2 className="lp-section-title" variants={fadeInUp}>
          Every angle. Every variant.<br />Every time.
        </motion.h2>
        <motion.p className="lp-section-sub" variants={fadeInUp}>
          One garment upload produces a full set — front, side, back, and detail — ready for any platform.
        </motion.p>
      </motion.div>
      <motion.div 
        className="lp-gallery-grid"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        variants={staggerContainer}
      >
        {items.map((g, i) => (
          <motion.div key={i} className="lp-gallery-card" variants={fadeInUp} whileHover={{ scale: 1.05 }}>
            <div className="lp-gallery-thumb" style={{ background: g.bg }}>
              <span className="lp-gallery-emoji">{g.emoji}</span>
              <span className="lp-gallery-tag">{g.tag}</span>
            </div>
            <div className="lp-gallery-label">{g.label}</div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

export function Impact() {
  const features = [
    {
      icon: "💰", color: "#F0FDF4",
      title: "Save 90% on photography costs",
      desc: "Traditional shoots average ₹2,000–₹5,000 per garment. Botzudio brings that to a fraction. Keep your budget for inventory, not cameras.",
    },
    {
      icon: "⚡", color: "#FFF7ED",
      title: "Publish new products in hours, not weeks",
      desc: "New collection drop? Upload in the morning, publish by afternoon. Stay ahead of seasonal trends without waiting on a studio calendar.",
    },
    {
      icon: "🎨", color: "#EDE9FE",
      title: "Test colors and prints before you make them",
      desc: "See how a print or color variant looks on a model before you order a single unit. Cut sampling costs and make smarter production decisions.",
    },
  ];

  return (
    <div className="lp-section-muted-wrap">
      <section className="lp-section">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}>
          <motion.div className="lp-section-label" variants={fadeInUp}>✦ Business Impact</motion.div>
          <motion.h2 className="lp-section-title" variants={fadeInUp}>
            What this means<br />for your business
          </motion.h2>
        </motion.div>
        <div className="lp-features-grid">
          {features.map((f, i) => (
            <motion.div 
              className="lp-feature-card" 
              key={f.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
            >
              <div className="lp-feature-icon" style={{ background: f.color }}>{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}

export function UseCases() {
  const personas = [
    { icon: "🏪", accentColor: "#8B5CF6", bg: "#EDE9FE", title: "D2C Fashion Brands",          desc: "Generate a full catalog image set without a photography budget. Launch faster and look premium from day one."              },
    { icon: "🛒", accentColor: "#F472B6", bg: "#FDF2F8", title: "Marketplace Sellers",          desc: "Meet Myntra, Meesho, and Flipkart image requirements at volume — fast, consistent, and platform-ready."                  },
    { icon: "✂️", accentColor: "#FBBF24", bg: "#FFF7ED", title: "Boutiques & Designers",        desc: "Present new designs professionally without a full production setup. Your creativity, our execution."                      },
    { icon: "🥻", accentColor: "#34D399", bg: "#F0FDF4", title: "Ethnic & Occasion Wear Brands",desc: "Specialized support for sarees, lehengas, and traditional styles — the market your competitors ignore."                   },
  ];

  return (
    <section className="lp-section" id="use-cases">
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}>
        <motion.div className="lp-section-label" variants={fadeInUp}>✦ Built For</motion.div>
        <motion.h2 className="lp-section-title" variants={fadeInUp}>
          Built for fashion businesses<br />like yours
        </motion.h2>
      </motion.div>
      <div className="lp-persona-grid">
        {personas.map((p, i) => (
          <motion.div 
            className="lp-persona-card" 
            key={p.title}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
            whileHover={{ y: -4 }}
          >
            <div className="lp-persona-accent" style={{ background: p.accentColor }} />
            <div className="lp-persona-icon" style={{ background: p.bg }}>{p.icon}</div>
            <h3>{p.title}</h3>
            <p>{p.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
