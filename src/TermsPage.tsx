import { Link } from "react-router-dom";

const BASE = import.meta.env.BASE_URL;

export default function TermsPage() {
  return (
    <>
      {/* ── Nav ── */}
      <nav className="lp-nav">
        <Link to="/" className="lp-nav-brand">
          <div className="lp-nav-bz">BZ</div>
          <span className="lp-nav-name">Botzudio</span>
        </Link>
        <div className="lp-nav-links">
          <Link to="/" className="lp-nav-link">Home</Link>
          <Link to="/login" className="lp-nav-link">Sign In</Link>
          <Link to="/login" className="lp-nav-cta">Try Free →</Link>
        </div>
      </nav>

      {/* ── Content ── */}
      <div className="lp-legal-page">
        <div className="lp-legal-inner">
          <div className="lp-section-label">✦ Legal</div>
          <h1 className="lp-legal-title">Terms &amp; Conditions</h1>
          <p className="lp-legal-updated">Last updated: May 2025</p>

          <section className="lp-legal-section">
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing or using Botzudio ("the Service"), operated by The Bot Company
              (<a href="https://thebotcompany.in" target="_blank" rel="noreferrer">thebotcompany.in</a>),
              you agree to be bound by these Terms &amp; Conditions. If you do not agree, please do not
              use the Service.
            </p>
          </section>

          <section className="lp-legal-section">
            <h2>2. Description of Service</h2>
            <p>
              Botzudio is an AI-powered product photography platform that allows fashion brands and
              sellers to generate professional model shots, multi-angle views, and scene variations
              from garment flat-lay photos. The Service uses third-party AI models including Google
              Gemini, OpenAI GPT Image, and Fal.ai FLUX pipelines.
            </p>
          </section>

          <section className="lp-legal-section">
            <h2>3. Eligibility</h2>
            <p>
              You must be at least 18 years of age and capable of entering into a legally binding
              agreement to use the Service. By using Botzudio, you represent that you meet these
              requirements.
            </p>
          </section>

          <section className="lp-legal-section">
            <h2>4. Account Registration</h2>
            <p>
              You may sign in using Google OAuth. You are responsible for maintaining the
              confidentiality of your account and for all activity that occurs under it. You agree to
              notify us immediately at{" "}
              <a href="mailto:official@thebotcompany.in">official@thebotcompany.in</a> if you
              suspect any unauthorised use of your account.
            </p>
          </section>

          <section className="lp-legal-section">
            <h2>5. Credits and Payments</h2>
            <ul>
              <li>New accounts receive a free credit allocation for evaluation purposes.</li>
              <li>
                Credits are consumed per image generation. The exact credit cost depends on the
                model selected and the output resolution.
              </li>
              <li>
                Credit purchases are non-refundable once consumed. Unused credits in a paid package
                may be eligible for a refund within 7 days of purchase — contact us to request one.
              </li>
              <li>
                We reserve the right to adjust credit pricing with 14 days' notice communicated via
                email or in-app notification.
              </li>
            </ul>
          </section>

          <section className="lp-legal-section">
            <h2>6. Acceptable Use</h2>
            <p>You agree not to use the Service to:</p>
            <ul>
              <li>Generate, upload, or distribute content that is illegal, harmful, defamatory, or infringes any third-party intellectual property rights.</li>
              <li>Upload images of individuals without their explicit consent.</li>
              <li>Attempt to reverse-engineer, scrape, or overload the Service's infrastructure.</li>
              <li>Resell or redistribute generated images as a competing AI image service.</li>
              <li>Use automated scripts to generate images in bulk beyond normal commercial use.</li>
            </ul>
            <p>
              Violation of these terms may result in immediate account suspension without refund.
            </p>
          </section>

          <section className="lp-legal-section">
            <h2>7. Intellectual Property</h2>
            <p>
              <strong>Your content:</strong> You retain ownership of the garment photos you upload.
              By uploading, you grant The Bot Company a limited, non-exclusive licence to process
              your images solely to provide the Service.
            </p>
            <p>
              <strong>Generated images:</strong> You own the AI-generated output images produced
              from your uploads and may use them for commercial purposes (e.g., product listings,
              marketing materials) without restriction.
            </p>
            <p>
              <strong>Our platform:</strong> All software, design, branding, and documentation of
              Botzudio remain the exclusive property of The Bot Company.
            </p>
          </section>

          <section className="lp-legal-section">
            <h2>8. Privacy</h2>
            <p>
              Your use of the Service is also governed by our{" "}
              <Link to="/privacy">Privacy Policy</Link>. We do not sell your personal data or
              uploaded images to third parties.
            </p>
          </section>

          <section className="lp-legal-section">
            <h2>9. Third-Party Services</h2>
            <p>
              Botzudio integrates with third-party AI providers (Google, OpenAI, Fal.ai). Your
              generated images may be processed on their infrastructure subject to their respective
              terms of service. We are not responsible for any actions or policies of these providers.
            </p>
          </section>

          <section className="lp-legal-section">
            <h2>10. Disclaimers and Limitation of Liability</h2>
            <p>
              The Service is provided "as is" without warranties of any kind. We do not guarantee
              that generated images will meet every specific requirement or that the Service will be
              uninterrupted. To the maximum extent permitted by law, The Bot Company shall not be
              liable for any indirect, incidental, or consequential damages arising from your use
              of the Service.
            </p>
          </section>

          <section className="lp-legal-section">
            <h2>11. Termination</h2>
            <p>
              We reserve the right to suspend or terminate your account at our discretion if you
              violate these Terms. You may also delete your account at any time by contacting{" "}
              <a href="mailto:official@thebotcompany.in">official@thebotcompany.in</a>.
            </p>
          </section>

          <section className="lp-legal-section">
            <h2>12. Governing Law</h2>
            <p>
              These Terms are governed by the laws of India. Any disputes shall be subject to the
              exclusive jurisdiction of the courts located in Tamil Nadu, India.
            </p>
          </section>

          <section className="lp-legal-section">
            <h2>13. Changes to These Terms</h2>
            <p>
              We may update these Terms from time to time. We will notify you of significant changes
              via email or an in-app notice. Continued use of the Service after changes constitutes
              acceptance of the revised Terms.
            </p>
          </section>

          <section className="lp-legal-section">
            <h2>14. Contact Us</h2>
            <p>
              For questions about these Terms, please contact:
            </p>
            <address>
              The Bot Company<br />
              <a href="mailto:official@thebotcompany.in">official@thebotcompany.in</a><br />
              <a href="https://thebotcompany.in" target="_blank" rel="noreferrer">thebotcompany.in</a>
            </address>
          </section>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="lp-footer" style={{ overflow: "visible" }}>
        <div className="lp-footer-inner">
          <div className="lp-footer-bottom">
            <span>© 2025 The Bot Company. All rights reserved.</span>
            <span>
              <Link to="/terms" style={{ marginRight: 16 }}>Terms &amp; Conditions</Link>
              Built with ❤️ by{" "}
              <a href="https://thebotcompany.in" target="_blank" rel="noreferrer">
                thebotcompany
              </a>
            </span>
          </div>
        </div>
      </footer>
    </>
  );
}
