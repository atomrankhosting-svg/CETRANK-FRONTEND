import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ApiError, sendChatQuery } from "@/lib/api";

const QUICK_PROMPTS = [
  "What is a safe college mix for my profile?",
  "How should I approach CAP Round 2?",
  "Explain home university preference simply.",
];

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function AISidebar() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm your AI Admission Counselor. Ask me anything about CET admissions, college selection, or counselling strategy.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [thoughts, setThoughts] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thoughts]);

  const addPrompt = (prompt: string) => {
    setInput(prompt);
  };

  const pause = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

  /** Light cleanup — only normalise excessive whitespace, keep markdown intact. */
  const cleanAssistantText = (value: string) =>
    value.replace(/\n{3,}/g, "\n\n").trim();

  const getChatErrorMessage = (error: unknown) => {
    if (error instanceof ApiError) {
      if (error.status === 400) {
        return "Please ask a more specific admissions question before sending it.";
      }

      if (error.status === 404) {
        return "I could not find any matching colleges for that query. Try adding a city, branch, or percentile.";
      }

      if (error.status === 503) {
        return error.detail
          ? `${error.detail} Try a simpler query like "Best colleges in Pune for Computer Engineering under 85 percentile."`
          : "The advisor could not turn that request into a valid college search. Try rephrasing it with city, branch, and percentile.";
      }

      if (error.detail) {
        return error.detail;
      }
    }

    return "Sorry, I'm having trouble connecting to the advisor. Please try again.";
  };

  const handleSend = async () => {
    if (!input.trim() || isThinking) return;
    const userMsg = input.trim();
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setInput("");
    setIsThinking(true);
    setThoughts(["> Connecting to Admission Engine...", "> Analyzing query..."]);

    try {
      const data = await sendChatQuery(userMsg);

      if (data.sql_generated) {
        setThoughts([
          `> Generated SQL: ${data.sql_generated}`,
          `> Rows matched: ${data.row_count ?? "unknown"}`,
          "> Formatting answer...",
        ]);
        await pause(450);
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            typeof data.answer === "string" && data.answer.trim()
              ? cleanAssistantText(data.answer)
              : "I found a result, but the response was empty. Please try asking in a different way.",
        },
      ]);
    } catch (error) {
      console.error("Chat request failed:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: getChatErrorMessage(error),
        },
      ]);
    } finally {
      setIsThinking(false);
      setThoughts([]);
    }
  };

  return (
    <>
      <motion.button
        onClick={() => setOpen(!open)}
        className={`fixed bottom-4 right-3 z-40 flex items-center gap-3 rounded-2xl border border-border/80 bg-white/90 px-3 py-3 transition-all group backdrop-blur-xl sm:bottom-6 sm:right-4 sm:px-4 ${
          open ? "pointer-events-none translate-y-6 opacity-0 sm:translate-y-4" : "opacity-100"
        }`}
        style={{
          boxShadow: "0 16px 38px rgba(59, 130, 246, 0.18)",
        }}
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.95 }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20, delay: 1 }}
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
            >
              <X className="w-5 h-5 text-foreground" />
            </motion.div>
          ) : (
            <motion.div
              key="bot"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              className="relative"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-teal-400">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white animate-pulse" />
            </motion.div>
          )}
        </AnimatePresence>
        <div className="hidden text-left sm:block">
          <div className="text-sm font-semibold text-foreground">AI Counselor</div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Ask strategy questions
          </div>
        </div>
      </motion.button>

      {/* Sidebar */}
      <AnimatePresence>
        {open && (
          <>
            {/* Full-screen Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-slate-950/30 backdrop-blur-md"
              onClick={() => setOpen(false)}
            />

            <div className="fixed inset-0 z-[70] flex items-end justify-center p-0 sm:items-center sm:p-6 pointer-events-none">
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 350 }}
                className="pointer-events-auto flex h-[88dvh] w-full max-w-5xl flex-col overflow-hidden rounded-t-[28px] border border-white/20 shadow-[0_32px_128px_rgba(15,23,42,0.24)] sm:h-full sm:max-h-[85vh] sm:rounded-[32px]"
                style={{
                  background: "linear-gradient(135deg, rgba(255, 255, 255, 0.94), rgba(248, 250, 252, 0.92))",
                  backdropFilter: "blur(40px) saturate(120%)",
                }}
              >
                <div className="shrink-0 border-b border-border/50 p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{
                          background: "linear-gradient(135deg, hsl(217 91% 53% / 0.15), hsl(173 80% 40% / 0.15))",
                        }}
                      >
                        <Bot className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold font-['Outfit']">AI Counselor</h3>
                        <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                          Ask strategy questions
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-xl border border-border/60 bg-white/70"
                      onClick={() => setOpen(false)}
                      aria-label="Minimize AI counselor"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

              {/* Messages */}
              <div className="flex-1 space-y-4 overflow-y-auto px-3 py-4 sm:px-5">
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[95%] px-4 py-3.5 text-sm leading-relaxed sm:max-w-[85%] sm:px-5 sm:py-4 ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground rounded-[24px] rounded-br-lg shadow-xl shadow-primary/10"
                          : "bg-white/70 dark:bg-slate-900/60 text-foreground rounded-[24px] rounded-bl-lg border border-white/40 shadow-sm ai-prose backdrop-blur-md"
                      }`}
                    >
                      {msg.role === "assistant" ? (
                        <div className="w-full overflow-hidden">
                          <ReactMarkdown 
                            remarkPlugins={[remarkGfm]}
                            components={{
                              table: ({ children }) => (
                                <div className="table-wrapper">
                                  <table>{children}</table>
                                </div>
                              )
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        msg.content
                      )}
                    </div>
                  </motion.div>
                ))}

                {/* Thinking stream */}
                {isThinking && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-1"
                  >
                    <div className="rounded-xl bg-secondary/30 p-4 font-mono text-[11px] text-muted-foreground space-y-1.5 border border-border/20">
                      {thoughts.map((t, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.2 }}
                          className="flex items-center gap-1.5"
                        >
                          <span>{t}</span>
                        </motion.div>
                      ))}
                      <div className="flex gap-1.5 mt-3">
                        <span className="typing-dot w-1.5 h-1.5 rounded-full bg-primary" />
                        <span className="typing-dot w-1.5 h-1.5 rounded-full bg-primary" />
                        <span className="typing-dot w-1.5 h-1.5 rounded-full bg-primary" />
                      </div>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="sticky bottom-0 shrink-0 border-t border-border/50 bg-[hsl(var(--card)/0.96)] p-3 pb-[calc(0.85rem+env(safe-area-inset-bottom))] sm:p-4">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                  className="flex items-end gap-2"
                >
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about admissions..."
                    className="min-h-11 flex-1 rounded-xl bg-secondary/30 border-border/30 focus:border-primary/50"
                    disabled={isThinking}
                  />
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      type="submit"
                      size="icon"
                      disabled={isThinking || !input.trim()}
                      className="h-11 w-11 rounded-xl shrink-0 glow-subtle"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </motion.div>
                </form>
              </div>
            </motion.div>
          </div>
        </>
        )}
      </AnimatePresence>
    </>
  );
}
