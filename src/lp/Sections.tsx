import { motion } from "framer-motion";
import { fadeInUp, staggerContainer } from "./animations";

export function Stats() {
  const stats = [
    { val: "< 60s", label: "Per garment" },
    { val: "9+",    label: "Garment types" },
    { val: "100%",  label: "You own the images" },
    { val: "HD",    label: "1080×1440px output" },
  ];

  return (
    <div className="lp-stats-bar">
      {stats.map((s, i) => (
        <motion.div 
          key={s.label} 
          className="lp-stats-item"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1 }}
        >
          <span className="lp-stats-val">{s.val}</span>
          <span className="lp-stats-label">{s.label}</span>
        </motion.div>
      ))}
    </div>
  );
}

export function Problem() {
  const features = [
    {
      icon: "💸", color: "#FEF2F2",
      title: "A full shoot costs ₹15,000–₹50,000",
      desc: "And takes a week to deliver. That budget could fund new inventory — not cameras and studio time.",
    },
    {
      icon: "🔄", color: "#FFF7ED",
      title: "Reshoots double your cost",
      desc: "New colors, new sizes, seasonal updates — every variation means another booking, another invoice.",
    },
    {
      icon: "⏱️", color: "#EDE9FE",
      title: "Your competitors publish daily",
      desc: "While you wait on a photographer, faster brands are already live with the same trend. You lose the window.",
    },
  ];

  return (
    <section className="lp-section" id="problem">
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}>
        <motion.div className="lp-section-label" variants={fadeInUp}>✦ The Problem</motion.div>
        <motion.h2 className="lp-section-title" variants={fadeInUp}>
          Your photos are holding<br />back your sales
        </motion.h2>
        <motion.p className="lp-section-sub" variants={fadeInUp}>
          Every fashion seller knows the pain. Great clothes, terrible photos, lost sales.
        </motion.p>
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
  );
}

export function Solution() {
  const steps = [
    { num: "1", icon: "📸", color: "#EDE9FE", title: "Upload your garment", desc: "A photo on a hanger or flat lay works fine. Any phone camera." },
    { num: "2", icon: "🧍", color: "#FDF2F8", title: "Choose model & setting", desc: "Pick skin tone, occasion, and background from presets — or use your own references." },
    { num: "3", icon: "✨", color: "#FFF7ED", title: "AI generates the shoot", desc: "Front, side, and back views created in under 60 seconds. No waiting." },
    { num: "4", icon: "🚀", color: "#F0FDF4", title: "Download & publish", desc: "High-res files ready for Myntra, Meesho, Flipkart, or your own website. Same day." },
  ];

  return (
    <div className="lp-section-muted-wrap">
      <section className="lp-section" id="how-it-works">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}>
          <motion.div className="lp-section-label" variants={fadeInUp}>✦ The Solution</motion.div>
          <motion.h2 className="lp-section-title" variants={fadeInUp}>
            Three uploads. One click. Done.
          </motion.h2>
          <motion.p className="lp-section-sub" variants={fadeInUp}>
            No studio booking. No model casting. No waiting.
          </motion.p>
        </motion.div>
        <div className="lp-steps lp-steps-4">
          {steps.map((s, i) => (
            <motion.div 
              className="lp-step" 
              key={s.num}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
            >
              <div className="lp-step-num" style={{ background: s.color }}>
                <span className="lp-step-icon">{s.icon}</span>
                <span className="lp-step-badge">{s.num}</span>
              </div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
