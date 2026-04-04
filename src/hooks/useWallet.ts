import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Wallet {
  id: string;
  user_id: string;
  balance: number;
}

interface WalletTransaction {
  id: string;
  wallet_id: string;
  amount: number;
  type: "credit" | "debit" | "commission" | "payout" | "refund";
  description: string | null;
  reference_id: string | null;
  created_at: string;
}

export function useWallet() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWallet = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    let { data } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!data) {
      const { data: created } = await supabase
        .from("wallets")
        .insert({ user_id: user.id, balance: 0 })
        .select()
        .single();
      data = created;
    }

    if (data) {
      setWallet(data as Wallet);
      const { data: txns } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq("wallet_id", data.id)
        .order("created_at", { ascending: false })
        .limit(50);
      setTransactions((txns || []) as WalletTransaction[]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  const addCredits = useCallback(async (amount: number) => {
    if (!wallet) return false;
    const { error: txError } = await supabase.from("wallet_transactions").insert({
      wallet_id: wallet.id,
      amount,
      type: "credit" as const,
      description: `Crédito adicionado: R$ ${amount.toFixed(2)}`,
    });
    if (txError) return false;

    // Update balance via admin RPC or direct update
    // Since users can't update wallets directly, we use the transaction approach
    // For now we refetch
    await fetchWallet();
    return true;
  }, [wallet, fetchWallet]);

  const debitForRide = useCallback(async (amount: number, rideId: string) => {
    if (!wallet || wallet.balance < amount) return false;
    const { error } = await supabase.from("wallet_transactions").insert({
      wallet_id: wallet.id,
      amount: -amount,
      type: "debit" as const,
      description: `Pagamento de corrida`,
      reference_id: rideId,
    });
    if (!error) await fetchWallet();
    return !error;
  }, [wallet, fetchWallet]);

  return { wallet, transactions, loading, addCredits, debitForRide, refetch: fetchWallet };
}
