import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { fetchCreditBalance, fetchCreditConfig, selfTopUpCredits, fetchModelPricing } from "../lib/credits";
import { CREDIT_PRICES } from "../lib/pricing";
import { getSession } from "../lib/auth";

interface CreditsState {
  balance: number;
  costPerImageInr: number;
  freeImagesUsed: number;
  freeImagesRemaining: number;
  modelPricing: Record<string, number>;
  loading: boolean;
  refreshBalance: () => Promise<void>;
  selfTopUp: () => Promise<{ balance: number; message: string }>;
}

const CreditsContext = createContext<CreditsState>({
  balance: 0,
  costPerImageInr: 10,
  freeImagesUsed: 0,
  freeImagesRemaining: 0,
  modelPricing: CREDIT_PRICES,
  loading: false,
  refreshBalance: async () => {},
  selfTopUp: async () => ({ balance: 0, message: "" }),
});

export function CreditsProvider({ children }: { children: ReactNode }) {
  const [balance, setBalance] = useState(0);
  const [costPerImageInr, setCostPerImageInr] = useState(10);
  const [freeImagesUsed, setFreeImagesUsed] = useState(0);
  const [freeImagesRemaining, setFreeImagesRemaining] = useState(0);
  const [modelPricing, setModelPricing] = useState<Record<string, number>>(CREDIT_PRICES);
  const [loading, setLoading] = useState(false);

  const refreshBalance = useCallback(async () => {
    const session = getSession();
    if (!session) return;
    try {
      const data = await fetchCreditBalance();
      setBalance(data.balance);
      setFreeImagesUsed(data.freeImagesUsed ?? 0);
      setFreeImagesRemaining(data.freeImagesRemaining ?? 0);
    } catch {
      // silently fail — not critical
    }
  }, []);

  const selfTopUp = useCallback(async () => {
    const result = await selfTopUpCredits();
    setBalance(result.balance);
    return result;
  }, []);

  useEffect(() => {
    // Fetch live model pricing (no auth required)
    fetchModelPricing()
      .then(setModelPricing)
      .catch(() => {}); // fall back to hardcoded defaults

    const session = getSession();
    if (!session) return;

    setLoading(true);
    Promise.all([fetchCreditConfig(), fetchCreditBalance()])
      .then(([config, bal]) => {
        setCostPerImageInr(config.perImageCostInr);
        setBalance(bal.balance);
        setFreeImagesUsed(bal.freeImagesUsed ?? 0);
        setFreeImagesRemaining(bal.freeImagesRemaining ?? 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <CreditsContext.Provider value={{ balance, costPerImageInr, freeImagesUsed, freeImagesRemaining, modelPricing, loading, refreshBalance, selfTopUp }}>
      {children}
    </CreditsContext.Provider>
  );
}

export function useCredits() {
  return useContext(CreditsContext);
}
