import { motion } from "framer-motion";
import { Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ListUnlockBannerProps {
  lockedCount: number;
  hasCredits?: boolean;
  onUnlock: () => void;
}

export function ListUnlockBanner({ lockedCount, hasCredits = false, onUnlock }: ListUnlockBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex flex-col items-center gap-3 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 px-4 py-4 text-center sm:flex-row sm:justify-between sm:gap-4 sm:px-6 sm:py-4 sm:text-left"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <Lock className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-bold sm:text-base">Unlock your full shortlist</p>
          <p className="text-xs text-muted-foreground sm:text-sm">
            +{lockedCount} more college{lockedCount !== 1 ? "s" : ""} ranked for your profile
          </p>
        </div>
      </div>
      <Button
        size="default"
        className="w-full shrink-0 gap-2 rounded-full px-6 shadow-md shadow-primary/15 sm:w-auto"
        onClick={onUnlock}
      >
        <Sparkles className="h-4 w-4" />
        {hasCredits ? "Use 1 credit" : "Unlock full list"}
      </Button>
    </motion.div>
  );
}
