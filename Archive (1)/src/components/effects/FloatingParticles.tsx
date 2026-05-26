import { useMemo } from "react";
import { motion } from "framer-motion";

export function FloatingParticles({ count = 30 }: { count?: number }) {
  const particles = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 10,
        duration: 10 + Math.random() * 15,
        size: 2 + Math.random() * 3,
        opacity: 0.1 + Math.random() * 0.3,
        driftX: (Math.random() - 0.5) * 100,
      })),
    [count]
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 1 }}>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            bottom: "-10px",
            width: p.size,
            height: p.size,
            background: `hsl(var(--primary) / ${p.opacity})`,
            boxShadow: `0 0 ${p.size * 3}px hsl(var(--primary) / ${p.opacity * 0.5})`,
          }}
          animate={{
            y: [0, -1200],
            x: [0, p.driftX],
            opacity: [0, p.opacity, p.opacity, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}
