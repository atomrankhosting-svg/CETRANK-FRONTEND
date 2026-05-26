import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Compass } from "lucide-react";
import { SiteBackdrop } from "@/components/effects/SiteBackdrop";
import { useIsMobile } from "@/hooks/use-mobile";

const NotFound = () => {
  const isMobile = useIsMobile();
  return (
    <div className="app-shell flex items-center justify-center px-4">
      <SiteBackdrop particleCount={isMobile ? 0 : 10} />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="panel-surface relative z-10 max-w-lg p-10 text-center"
      >
        <motion.div
          animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="inline-flex mb-8"
        >
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-600/10 to-teal-500/10 flex items-center justify-center shadow-lg shadow-blue-600/5">
            <Compass className="w-10 h-10 text-primary" />
          </div>
        </motion.div>

        <h1 className="text-7xl md:text-9xl font-black text-gradient font-['Outfit'] mb-4">
          404
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-sm mx-auto">
          This page doesn't exist. Let's get you back on track.
        </p>
        <Link to="/">
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button className="rounded-2xl px-8 py-6 text-base glow-subtle group">
              <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
              Back to Home
            </Button>
          </motion.div>
        </Link>
      </motion.div>
    </div>
  );
};

export default NotFound;
