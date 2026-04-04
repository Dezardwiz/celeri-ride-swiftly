import { ArrowLeft, Plus, Wallet, ArrowUpRight, ArrowDownLeft, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { useWallet } from "@/hooks/useWallet";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface WalletScreenProps {
  onBack: () => void;
}

const typeLabels: Record<string, string> = {
  credit: "Crédito",
  debit: "Débito",
  commission: "Comissão",
  payout: "Repasse",
  refund: "Reembolso",
};

const typeColors: Record<string, string> = {
  credit: "text-green-500",
  debit: "text-destructive",
  commission: "text-yellow-500",
  payout: "text-primary",
  refund: "text-blue-500",
};

const WalletScreen = ({ onBack }: WalletScreenProps) => {
  const { wallet, transactions, loading, addCredits, refetch } = useWallet();
  const [addAmount, setAddAmount] = useState("");
  const [adding, setAdding] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  const quickAmounts = [10, 20, 50, 100];

  const handleAddCredits = async (amount: number) => {
    if (amount <= 0) return;
    setAdding(true);
    const ok = await addCredits(amount);
    if (ok) {
      toast.success(`R$ ${amount.toFixed(2)} adicionado à carteira`);
      setAddAmount("");
      setShowAdd(false);
    } else {
      toast.error("Erro ao adicionar créditos");
    }
    setAdding(false);
  };

  const balance = wallet?.balance ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 flex flex-col bg-background"
    >
      <div className="border-b border-border p-4 flex items-center gap-3">
        <button onClick={onBack} className="text-foreground p-1">
          <ArrowLeft size={20} />
        </button>
        <h2 className="font-display text-lg uppercase tracking-wider">Carteira</h2>
        <button onClick={refetch} className="ml-auto text-muted-foreground p-1">
          <RefreshCw size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-20">
        {/* Balance card */}
        <div className="p-6">
          <div className="rounded-xl bg-gradient-to-br from-primary to-primary/70 p-6 text-primary-foreground">
            <div className="flex items-center gap-2 mb-2">
              <Wallet size={20} />
              <span className="font-display text-xs uppercase tracking-wider opacity-80">Saldo disponível</span>
            </div>
            <p className="font-display text-3xl tracking-tight">
              R$ {balance.toFixed(2).replace(".", ",")}
            </p>
          </div>
        </div>

        {/* Add credits */}
        <div className="px-6 mb-6">
          {!showAdd ? (
            <button
              onClick={() => setShowAdd(true)}
              className="w-full flex items-center justify-center gap-2 rounded-md border border-border py-3 font-display text-sm uppercase tracking-wider text-foreground transition-colors hover:bg-accent"
            >
              <Plus size={16} />
              Adicionar Créditos
            </button>
          ) : (
            <div className="space-y-3 rounded-md border border-border p-4">
              <span className="font-display text-xs uppercase tracking-wider text-muted-foreground">
                Valor rápido
              </span>
              <div className="flex gap-2">
                {quickAmounts.map((amt) => (
                  <button
                    key={amt}
                    onClick={() => handleAddCredits(amt)}
                    disabled={adding}
                    className="flex-1 rounded-md border border-border py-2 font-display text-sm text-foreground transition-colors hover:bg-accent disabled:opacity-40"
                  >
                    R$ {amt}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Outro valor"
                  value={addAmount}
                  onChange={(e) => setAddAmount(e.target.value)}
                  className="flex-1 rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
                />
                <button
                  onClick={() => handleAddCredits(parseFloat(addAmount) || 0)}
                  disabled={adding || !addAmount}
                  className="rounded-md bg-primary px-4 py-2 font-display text-sm uppercase text-primary-foreground disabled:opacity-40"
                >
                  {adding ? "..." : "Adicionar"}
                </button>
              </div>
              <button
                onClick={() => setShowAdd(false)}
                className="w-full text-xs text-muted-foreground"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>

        {/* Transactions */}
        <div className="px-6">
          <h3 className="font-display text-xs uppercase tracking-wider text-muted-foreground mb-3">
            Histórico de Transações
          </h3>
          {loading ? (
            <div className="text-center py-4 text-muted-foreground text-sm">Carregando...</div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Nenhuma transação ainda
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center gap-3 rounded-md border border-border p-3">
                  <div className={`p-2 rounded-full bg-input ${typeColors[tx.type] || "text-foreground"}`}>
                    {tx.amount > 0 ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{tx.description || typeLabels[tx.type]}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(tx.created_at), "dd/MM HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  <span className={`font-display text-sm ${tx.amount > 0 ? "text-green-500" : "text-destructive"}`}>
                    {tx.amount > 0 ? "+" : ""}R$ {Math.abs(tx.amount).toFixed(2).replace(".", ",")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default WalletScreen;
