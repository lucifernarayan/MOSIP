"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

type DashboardCardProps = {
  title: string;
  eyebrow?: string;
  children: ReactNode;
  glowColor?: string;
  isActive?: boolean;
  className?: string;
  noPad?: boolean;
  danger?: boolean;
};

export function DashboardCard({
  title,
  eyebrow,
  children,
  glowColor = "rgba(0,212,255,0.12)",
  isActive = false,
  className = "",
  noPad = false,
  danger = false,
}: DashboardCardProps) {
  const glowStyle = danger
    ? { boxShadow: "0 0 24px rgba(255,51,102,0.12)", borderColor: "rgba(255,51,102,0.25)" }
    : isActive
    ? { boxShadow: `0 0 24px ${glowColor}` }
    : undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`cyber-panel overflow-hidden ${danger ? "cyber-panel-danger" : ""} ${className}`}
      style={glowStyle}
    >
      <div className="border-b border-white/[0.04] px-5 py-3">
        {eyebrow && <span className="eyebrow block mb-1">{eyebrow}</span>}
        <h3 className="text-sm font-semibold uppercase tracking-wider text-white font-display">
          {title}
        </h3>
      </div>
      <div className={noPad ? "" : "p-5"}>{children}</div>
    </motion.div>
  );
}
