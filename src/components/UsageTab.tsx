import { useEffect, useState } from "react";
import { Coins, RefreshCw, PhoneCall } from "lucide-react";
import { useCredits } from "../context/CreditsContext";
import { fetchCreditTransactions, type CreditTransaction } from "../lib/credits";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-IN", { month:"short", day:"numeric", hour:"2-digit", minute:"2-digit" });
}

// ─── Pricing table ─────────────────────────────────────────────────────────────

const MODEL_PRICING = [
  { model: "Gemini 2.5 Flash", type: "Image gen",   note: "Default model"    },
  { model: "Gemini 2.5 Pro",   type: "Image gen",   note: "Higher quality"   },
  { model: "Gemini 2.5 Flash", type: "AI Planning", note: "Look plan (free)" },
];

// ─── Buy Credits Modal ─────────────────────────────────────────────────────────

function BuyCreditsModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="creditModalOverlay" onClick={onClose}>
      <div className="creditModal" onClick={e => e.stopPropagation()}>
        <div className="creditModalHeader">
          <div className="creditModalTitle">Buy Credits</div>
          <button className="creditModalClose" onClick={onClose}>✕</button>
        </div>
        <div className="creditModalBody">
          <div className="creditModalBalance">
            <div className="creditModalBalanceIcon">₹</div>
            <div>
              <div className="creditModalBalanceLabel">Add INR balance to generate more images</div>
              <div className="creditModalBalanceSub">Credits are added manually by the admin after payment confirmation.</div>
            </div>
          </div>
          <div className="creditModalSteps">
            <div className="creditModalStep">
              <span className="creditModalStepNum">1</span>
              <div>
                <div className="creditModalStepTitle">Contact The Bot Company</div>
                <div className="creditModalStepSub">Email us at <a href="mailto:official@thebotcompany.in">official@thebotcompany.in</a> with your registered email and the amount you'd like to add.</div>
              </div>
            </div>
            <div className="creditModalStep">
              <span className="creditModalStepNum">2</span>
              <div>
                <div className="creditModalStepTitle">Complete Payment</div>
                <div className="creditModalStepSub">We'll send you a payment link or UPI details. Minimum top-up ₹100.</div>
              </div>
            </div>
            <div className="creditModalStep">
              <span className="creditModalStepNum">3</span>
              <div>
                <div className="creditModalStepTitle">Credits Added Instantly</div>
                <div className="creditModalStepSub">Once confirmed, your balance is updated and ready to use.</div>
              </div>
            </div>
          </div>
          <a className="creditModalCTA" href="mailto:official@thebotcompany.in?subject=Buy Credits - Botzudio">
            Email Us to Buy Credits →
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function UsageTab() {
  const { balance, costPerImageInr } = useCredits();
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBuyModal, setShowBuyModal] = useState(false);

  useEffect(() => {
    fetchCreditTransactions()
      .then(setTransactions)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const imagesLeft = costPerImageInr > 0 ? Math.floor(balance / costPerImageInr) : 0;
  const pct = Math.min(100, costPerImageInr > 0
    ? (balance / Math.max(balance + costPerImageInr * 10, 1)) * 100
    : 100);

  return (
    <div className="creditHero">

      {/* ── Balance card ────────────────────────────────────────────── */}
      <div className="creditBalanceCard">
        <div className="creditBalanceTop">
          <div>
            <div className="creditBalanceLabel">Available Balance</div>
            <div className="creditBalanceAmount">₹{balance.toFixed(2)}</div>
            <div className="creditBalanceSub">
              {imagesLeft} image{imagesLeft !== 1 ? "s" : ""} remaining · ₹{costPerImageInr.toFixed(2)}/image
            </div>
          </div>
          <button className="creditBuyBtn" onClick={() => setShowBuyModal(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/>
            </svg>
            Buy Credits
          </button>
        </div>
        <div className="creditProgressTrack">
          <div className="creditProgressFill" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* ── Info pills ──────────────────────────────────────────────── */}
      <div className="creditInfoRow">
        <div className="creditInfoPill"><Coins size={13} strokeWidth={2} className="creditInfoPillIcon" /><span>₹{costPerImageInr.toFixed(2)} deducted per image generated</span></div>
        <div className="creditInfoPill"><RefreshCw size={13} strokeWidth={2} className="creditInfoPillIcon" /><span>Balance auto-deducted on every generation</span></div>
        <div className="creditInfoPill"><PhoneCall size={13} strokeWidth={2} className="creditInfoPillIcon" /><span>Contact admin to top up your balance</span></div>
      </div>

      {/* ── Transactions ────────────────────────────────────────────── */}
      {!loading && (
        <div className="creditTxList">
          <div className="creditTxListTitle">
            {transactions.length > 0 ? "Recent Transactions" : "No transactions yet"}
          </div>
          {transactions.slice(0, 8).map(tx => (
            <div key={tx.id} className="creditTxRow">
              <div className={`creditTxSign ${tx.amountInr < 0 ? "creditTxDebit" : "creditTxCredit"}`}>
                {tx.amountInr < 0 ? "−" : "+"}₹{Math.abs(tx.amountInr).toFixed(2)}
              </div>
              <div className="creditTxDesc">{tx.description || (tx.type === "image_gen" ? "Image generated" : "Top-up")}</div>
              <div className="creditTxBalance">bal ₹{tx.balanceAfter.toFixed(2)}</div>
              <div className="creditTxDate">{fmtDateTime(tx.createdAt)}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Model pricing ───────────────────────────────────────────── */}
      <div className="creditPricingBox">
        <div className="creditPricingTitle">Credit System — Per-Image Cost</div>
        <div className="creditPricingGrid">
          {MODEL_PRICING.map((m, i) => (
            <div key={i} className="creditPricingRow">
              <div className="creditPricingModel">{m.model}</div>
              <div className="creditPricingType">{m.type}</div>
              <div className={`creditPricingCost ${m.type === "AI Planning" ? "creditPricingFree" : ""}`}>
                {m.type === "AI Planning" ? "Free" : `₹${costPerImageInr.toFixed(2)}`}
              </div>
              <div className="creditPricingNote">{m.note}</div>
            </div>
          ))}
        </div>
      </div>

      {showBuyModal && <BuyCreditsModal onClose={() => setShowBuyModal(false)} />}
    </div>
  );
}
