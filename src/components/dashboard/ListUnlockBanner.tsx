import { motion } from "framer-motion";
import { Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface ListUnlockBannerProps {
  lockedCount: number;
  hasCredits?: boolean;
  onUnlock: () => void;
}

export function ListUnlockBanner({ lockedCount, hasCredits = false, onUnlock }: ListUnlockBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative overflow-hidden rounded-[28px] border border-primary/20 bg-gradient-to-b from-primary/5 to-background"
    >
      {/* CTA — above preview */}
      <div className="relative z-10 flex flex-col items-center gap-4 px-6 py-6 text-center sm:py-8">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 shadow-lg shadow-primary/10">
          <Lock className="h-6 w-6 text-primary" />
        </div>
        <div>
          <p className="text-lg font-bold">Unlock your full shortlist</p>
          <p className="mt-1 text-sm text-muted-foreground">
            +{lockedCount} more college{lockedCount !== 1 ? "s" : ""} ranked for your profile
          </p>
        </div>
        <Button
          size="lg"
          className="gap-2 rounded-full px-8 shadow-lg shadow-primary/20"
          onClick={onUnlock}
        >
          <Sparkles className="h-4 w-4" />
          {hasCredits ? "Use 1 credit" : "Unlock full list"}
        </Button>
      </div>

      {/* Tease: blurred skeleton cards below CTA */}
      <div className="pointer-events-none relative select-none space-y-3 px-4 pb-4 sm:px-6 sm:pb-6">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/80 via-background/40 to-transparent" />
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="glass rounded-2xl p-5 space-y-3 opacity-50"
            style={{ filter: "blur(3px)" }}
          >
            <div className="flex justify-between">
              <Skeleton className="h-4 w-52 rounded-lg" />
              <Skeleton className="h-4 w-24 rounded-lg" />
            </div>
            <Skeleton className="h-3 w-36 rounded-lg" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
