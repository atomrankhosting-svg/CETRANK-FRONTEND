import { motion } from "framer-motion";

export function AuroraBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
      {/* primary blue blob */}
      <motion.div
        animate={{
          x: [0, 80, -40, 60, 0],
          y: [0, -60, 30, -20, 0],
          scale: [1, 1.2, 0.95, 1.1, 1],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full opacity-20"
        style={{
          background: "radial-gradient(circle, hsl(217 91% 53% / 0.4), transparent 60%)",
          filter: "blur(100px)",
        }}
      />
      {/* teal blob */}
      <motion.div
        animate={{
          x: [0, -60, 40, -30, 0],
          y: [0, 40, -50, 30, 0],
          scale: [1, 0.9, 1.15, 1.05, 1],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] rounded-full opacity-15"
        style={{
          background: "radial-gradient(circle, hsl(173 80% 40% / 0.4), transparent 60%)",
          filter: "blur(120px)",
        }}
      />
      {/* sky-blue accent blob */}
      <motion.div
        animate={{
          x: [0, 50, -70, 20, 0],
          y: [0, -30, 60, -40, 0],
          scale: [1, 1.1, 0.9, 1.05, 1],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full opacity-10"
        style={{
          background: "radial-gradient(circle, hsl(199 89% 48% / 0.4), transparent 60%)",
          filter: "blur(80px)",
        }}
      />
    </div>
  );
}
