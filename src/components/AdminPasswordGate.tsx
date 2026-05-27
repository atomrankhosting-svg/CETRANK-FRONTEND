import { useState } from "react";
import { Outlet, Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Eye, EyeOff, ShieldAlert, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SiteBackdrop } from "@/components/effects/SiteBackdrop";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function AdminPasswordGate() {
  const { user } = useAuth();
  const [unlocked, setUnlocked] = useState(() => {
    return sessionStorage.getItem("admin_unlocked") === "true";
  });
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(false);
    setIsLoading(true);

    setTimeout(() => {
      if (password === "Shrimayee1") {
        sessionStorage.setItem("admin_unlocked", "true");
        setUnlocked(true);
        toast.success("Access granted", {
          description: "Welcome to the Admin Command Center.",
        });
      } else {
        setError(true);
        setIsLoading(false);
        toast.error("Access denied", {
          description: "Invalid administrator passcode.",
        });
      }
    }, 600);
  };

  if (unlocked) {
    return <Outlet />;
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4">
      <SiteBackdrop particleCount={8} variant="focused" />

      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 180, damping: 24 }}
          className="relative z-10 w-full max-w-md overflow-hidden rounded-[2.5rem] border border-white/20 bg-white/70 p-8 shadow-[0_32px_80px_rgba(0,0,0,0.06)] backdrop-blur-3xl sm:p-10"
        >
          <div className="absolute inset-0 -z-10 bg-gradient-to-tr from-indigo-500/5 via-transparent to-cyan-500/5 opacity-60" />

          <div className="flex flex-col items-center">
            <motion.div
              initial={{ scale: 0.8, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.1, type: "spring" }}
              className={`mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br transition-all duration-300 ${
                error
                  ? "from-rose-500 to-red-600 text-white shadow-lg shadow-red-500/20"
                  : "from-primary to-indigo-600 text-white shadow-lg shadow-primary/20"
              }`}
            >
              {error ? (
                <ShieldAlert className="h-7 w-7 animate-bounce" />
              ) : (
                <Lock className="h-7 w-7" />
              )}
            </motion.div>

            <h2 className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-center text-2xl font-black tracking-tight text-transparent">
              Restricted Directory
            </h2>
            <p className="mt-2 text-center text-sm font-medium text-muted-foreground">
              Please enter the administrator passcode to unlock this terminal.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 w-full space-y-4">
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(false);
                  }}
                  placeholder="Enter passcode..."
                  className={`h-12 w-full rounded-2xl border-border/80 bg-white/60 pl-4 pr-12 text-sm font-medium shadow-inner transition-all focus:border-primary/50 focus:bg-white focus:ring-2 focus:ring-primary/20 ${
                    error ? "border-rose-500 bg-rose-50/20 focus:border-rose-500 focus:ring-rose-500/10" : ""
                  }`}
                  disabled={isLoading}
                  autoFocus
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-lg p-1 text-muted-foreground/75 hover:bg-slate-100 hover:text-foreground active:scale-95"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-xs font-semibold text-rose-500"
                  >
                    Incorrect passcode. Authentication failed.
                  </motion.p>
                )}
              </AnimatePresence>

              <Button
                type="submit"
                disabled={isLoading || !password.trim()}
                className="group relative h-12 w-full overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-indigo-600 text-sm font-bold shadow-lg shadow-primary/20 transition-all hover:opacity-95 active:scale-[0.99] disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Authorizing...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-1.5">
                    <span>Unlock Portal</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </div>
                )}
              </Button>
            </form>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
