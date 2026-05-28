import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { fetchCreditBalance, fetchCreditConfig, selfTopUpCredits, fetchModelPricing } from "../lib/credits";
import { CREDIT_PRICES } from "../lib/pricing";
import { getSession } from "../lib/auth";

interface CreditsState {
  balance: number;
  costPerImageInr: number;
  freeImagesUsed: number;
  freeImagesRemaining: number;
  creditsSpent: number;
  isDeveloper: boolean;
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
  creditsSpent: 0,
  isDeveloper: false,
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
  const [creditsSpent, setCreditsSpent] = useState(0);
  const [isDeveloper, setIsDeveloper] = useState(false);
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
      setCreditsSpent(data.creditsSpent ?? 0);
      setIsDeveloper(data.isDeveloper ?? false);
    } catch {
      // silently fail — not critical
    }
  }, []);

  const selfTopUp = useCallback(async () => {
    const result = await selfTopUpCredits();
    setBalance(result.balance);
    await refreshBalance();
    return result;
  }, [refreshBalance]);

  // Track the current user id so we refetch (and reset) whenever it changes.
  // Without this, stale credit data from a previous user could persist after
  // SPA-internal user transitions (e.g. completeProfile after SSO needs-email).
  const [activeUserId, setActiveUserId] = useState<string | null>(() => getSession()?.id ?? null);

  // Re-derive the active user id when the session in localStorage changes
  // (cross-tab logout, or completeProfile within this tab).
  useEffect(() => {
    function syncUser() {
      const next = getSession()?.id ?? null;
      setActiveUserId((prev) => (prev === next ? prev : next));
    }
    window.addEventListener("storage", syncUser);
    window.addEventListener("focus", syncUser);
    return () => {
      window.removeEventListener("storage", syncUser);
      window.removeEventListener("focus", syncUser);
    };
  }, []);

  useEffect(() => {
    // Fetch live model pricing (no auth required) — independent of user.
    fetchModelPricing()
      .then(setModelPricing)
      .catch(() => {}); // fall back to hardcoded defaults

    if (!activeUserId) {
      // No (or no longer a) session: reset credit-state so the previous
      // user's balance / isDeveloper flag never leaks into another user.
      setBalance(0);
      setFreeImagesUsed(0);
      setFreeImagesRemaining(0);
      setCreditsSpent(0);
      setIsDeveloper(false);
      return;
    }

    setLoading(true);
    Promise.all([fetchCreditConfig(), fetchCreditBalance()])
      .then(([config, bal]) => {
        setCostPerImageInr(config.perImageCostInr);
        setBalance(bal.balance);
        setFreeImagesUsed(bal.freeImagesUsed ?? 0);
        setFreeImagesRemaining(bal.freeImagesRemaining ?? 0);
        setCreditsSpent(bal.creditsSpent ?? 0);
        setIsDeveloper(bal.isDeveloper ?? false);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activeUserId]);

  return (
    <CreditsContext.Provider value={{ balance, costPerImageInr, freeImagesUsed, freeImagesRemaining, creditsSpent, isDeveloper, modelPricing, loading, refreshBalance, selfTopUp }}>
      {children}
    </CreditsContext.Provider>
  );
}

export function useCredits() {
  return useContext(CreditsContext);
}
