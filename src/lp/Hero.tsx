import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer, scaleIn } from "./animations";

const APP = "/login";
const BASE = import.meta.env.BASE_URL;

export function Hero() {
  return (
    <div className="lp-hero-section">
      <section className="lp-hero">
        <motion.div 
          className="lp-hero-text"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <motion.h1 variants={fadeInUp}>
            Stop Paying for<br />
            <em>Photoshoots.</em><br />
            Start Publishing<br />in Minutes.
          </motion.h1>
          <motion.p className="lp-hero-sub" variants={fadeInUp}>
            AI-powered product images for fashion brands — professional quality,
            no studio, no photographer, no delays.
          </motion.p>
          <motion.div className="lp-hero-actions" variants={fadeInUp}>
            <Link to={APP} className="lp-btn-primary">
              Get Started Free →
            </Link>
            <a href="#how-it-works" className="lp-btn-secondary">
              See how it works
            </a>
          </motion.div>
        </motion.div>

        <motion.div 
          className="lp-hero-visual"
          variants={scaleIn}
          initial="hidden"
          animate="visible"
        >
          <div className="lp-hero-mockup" style={{ padding: 0, overflow: 'hidden', position: 'relative', height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8F5FF' }}>
             <motion.img 
                src={`${BASE}garment-templates/S1.png`} 
                alt="AI Generated Model"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                transition={{ duration: 2, ease: "easeOut" }}
             />
             <motion.div 
               style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.4), transparent)' }}
             />
             <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 1, duration: 0.8 }}
               style={{ position: 'absolute', bottom: 30, left: 30, color: 'white' }}
             >
                <div style={{ fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Studio Quality</div>
                <div style={{ fontSize: 24, fontWeight: 900, fontFamily: 'Outfit' }}>Generated in 60s</div>
             </motion.div>
          </div>
          <motion.div 
            className="lp-float-badge lp-float-tr"
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          >
            💸 Save ₹20,000+ per shoot
          </motion.div>
          <motion.div 
            className="lp-float-badge lp-float-bl"
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut", delay: 0.5 }}
          >
            ⚡ Ready in under 60 seconds
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
}
