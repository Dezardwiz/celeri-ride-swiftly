import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Loader2, WifiOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRideChat } from "@/hooks/useRideChat";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  rideId: string;
  role: "passenger" | "driver";
  counterpartyName?: string | null;
}

const QUICK_REPLIES_PASSENGER = [
  "Estou aguardando",
  "Pode tocar o interfone",
  "Já estou descendo",
];
const QUICK_REPLIES_DRIVER = [
  "Estou chegando",
  "Cheguei no local",
  "Aguardo no portão",
];

export default function RideChatSheet({ open, onClose, rideId, role, counterpartyName }: Props) {
  const { user } = useAuth();
  const { messages, loading, connected, sendMessage, markAllRead } = useRideChat(rideId, role);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom on new messages or open
  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
    });
  }, [messages.length, open]);

  // Mark messages as read while chat is open
  useEffect(() => {
    if (open) {
      markAllRead();
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [open, messages.length, markAllRead]);

  const handleSend = async (msgText?: string) => {
    const value = (msgText ?? text).trim();
    if (!value || sending) return;
    setSending(true);
    const { error } = await sendMessage(value);
    setSending(false);
    if (error === "too_long") {
      toast.error("Mensagem muito longa (máx. 500 caracteres)");
      return;
    }
    if (error) {
      toast.error("Falha ao enviar — tente novamente");
      return;
    }
    if (!msgText) setText("");
  };

  const quickReplies = role === "passenger" ? QUICK_REPLIES_PASSENGER : QUICK_REPLIES_DRIVER;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="fixed bottom-0 left-0 right-0 z-[81] flex h-[80vh] flex-col rounded-t-2xl border-t border-border bg-background"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="min-w-0">
                <p className="font-display text-xs uppercase tracking-wider text-muted-foreground">
                  Chat da corrida
                </p>
                <p className="truncate text-sm text-foreground">
                  {counterpartyName ?? (role === "passenger" ? "Mototaxista" : "Passageiro")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {!connected && (
                  <span className="flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-display uppercase tracking-wider text-amber-400">
                    <WifiOff size={10} /> Reconectando
                  </span>
                )}
                <button
                  onClick={onClose}
                  className="rounded-full border border-border p-1.5 text-muted-foreground hover:bg-surface-hover"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
              {loading ? (
                <div className="flex justify-center pt-6">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex h-full items-center justify-center text-center">
                  <p className="text-xs text-muted-foreground">
                    Inicie a conversa.<br/>Mensagens ficam disponíveis durante a corrida.
                  </p>
                </div>
              ) : (
                messages.map((m) => {
                  const mine = m.sender_id === user?.id;
                  return (
                    <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm leading-snug ${
                          mine
                            ? "bg-primary text-primary-foreground rounded-br-sm"
                            : "bg-card text-foreground border border-border rounded-bl-sm"
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{m.message}</p>
                        <p className={`mt-0.5 text-[10px] ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                          {new Date(m.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                          {mine && m.read_at && " · lido"}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Quick replies */}
            <div className="flex gap-2 overflow-x-auto border-t border-border px-4 py-2">
              {quickReplies.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSend(q)}
                  disabled={sending}
                  className="whitespace-nowrap rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground hover:bg-surface-hover disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Composer */}
            <form
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="flex items-center gap-2 border-t border-border p-3 pb-safe"
            >
              <input
                ref={inputRef}
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                maxLength={500}
                placeholder="Mensagem..."
                className="flex-1 rounded-full border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
              <button
                type="submit"
                disabled={!text.trim() || sending}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity disabled:opacity-40"
                aria-label="Enviar"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}