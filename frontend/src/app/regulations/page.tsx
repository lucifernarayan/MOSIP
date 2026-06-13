"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, BookOpen, SearchX, ShieldCheck } from "lucide-react";
import { regulations, sourceColor, type Regulation } from "@/utils/mosip-data";

function sourceBadgeStyle(source: string) {
  const color = sourceColor(source);
  return { background: `${color}12`, border: `1px solid ${color}28`, color };
}

function RegulationCard({ reg, index }: { reg: Regulation; index: number }) {
  const borderColor = sourceColor(reg.source);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
      className="cyber-panel overflow-hidden"
    >
      {/* Colored left accent border */}
      <div className="flex">
        <div className="w-1 shrink-0 rounded-l-xl" style={{ background: `linear-gradient(to bottom, ${borderColor}, ${borderColor}44)` }} />
        <div className="flex-1 p-5">
          {/* Header row */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <h3 className="text-sm font-semibold text-white leading-snug">{reg.name}</h3>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="font-digital text-[8px] uppercase px-2 py-0.5 rounded-full" style={sourceBadgeStyle(reg.source)}>
                {reg.source}
              </span>
              <span className="font-digital text-[8px] text-slate-600">{reg.year}</span>
            </div>
          </div>

          {/* Excerpt — terminal style */}
          <div className="bg-black/40 border border-white/[0.04] rounded-lg p-3 font-digital text-[10px] text-slate-400 leading-relaxed">
            <span className="text-slate-600 mr-1">§</span>
            {reg.excerpt}
          </div>

          {/* Footer */}
          <div className="mt-3 flex items-center gap-2">
            <ShieldCheck size={11} style={{ color: borderColor }} />
            <span className="font-digital text-[8px] uppercase tracking-wider" style={{ color: `${borderColor}70` }}>
              Regulation ID: {reg.id}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function RegulationsPage() {
  const [query, setQuery] = useState("");

  const filtered = regulations.filter((r) => {
    const q = query.toLowerCase();
    return (
      r.name.toLowerCase().includes(q) ||
      r.source.toLowerCase().includes(q) ||
      r.excerpt.toLowerCase().includes(q)
    );
  });

  const sourceGroups = {
    ESA: regulations.filter((r) => r.source === "ESA").length,
    IADC: regulations.filter((r) => r.source === "IADC").length,
    NASA: regulations.filter((r) => r.source === "NASA").length,
    UN: regulations.filter((r) => r.source === "UN").length,
  };

  return (
    <div className="min-h-[calc(100vh-var(--topbar-h))] cyber-grid px-5 py-7 lg:px-8">
      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
      >
        <div className="flex items-center gap-4">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-xl"
            style={{ background: "rgba(0,212,255,0.06)", border: "1px solid rgba(0,212,255,0.15)" }}
          >
            <BookOpen className="h-5 w-5 text-[#00d4ff]" />
          </div>
          <div>
            <span className="eyebrow block mb-1">Regulatory Knowledge Base</span>
            <h1 className="text-2xl font-bold tracking-tight text-white">Space Debris Regulations</h1>
          </div>
        </div>

        {/* Source counts */}
        <div className="flex items-center gap-2 flex-wrap">
          {Object.entries(sourceGroups).map(([src, count]) => (
            <button
              key={src}
              onClick={() => setQuery(query === src.toLowerCase() ? "" : src.toLowerCase())}
              className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-digital text-[9px] uppercase tracking-wider transition-all hover:opacity-80"
              style={sourceBadgeStyle(src)}
            >
              <span style={{ color: sourceColor(src) }}>{src}</span>
              <span className="text-white/40">{count}</span>
            </button>
          ))}
          <div className="rounded-full border border-[#00d4ff]/15 bg-[#00d4ff]/05 px-3 py-1.5 font-digital text-[9px] text-[#00d4ff]">
            {regulations.length} Total
          </div>
        </div>
      </motion.div>

      {/* ── Search Bar (56px tall) ───────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mb-7"
      >
        <div
          className="flex h-14 items-center gap-3 rounded-xl border px-5 transition-all"
          style={{
            background: "rgba(255,255,255,0.025)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(0,212,255,0.08)",
          }}
          onFocus={() => {}}
        >
          <Search className="h-5 w-5 shrink-0 text-[#00d4ff]/40" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search regulations by name, source, or content..."
            className="h-full w-full bg-transparent text-sm text-white placeholder-slate-500 outline-none font-display"
            style={{
              caretColor: "#00d4ff",
            }}
          />
          {query && (
            <button onClick={() => setQuery("")} className="shrink-0 text-slate-600 hover:text-slate-400 transition-colors font-digital text-xs">
              ✕
            </button>
          )}
        </div>
        {query && (
          <p className="mt-2 font-digital text-[9px] text-slate-500 uppercase tracking-wider">
            {filtered.length} result{filtered.length !== 1 ? "s" : ""} for "{query}"
          </p>
        )}
      </motion.div>

      {/* ── Cards ────────────────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {filtered.length > 0 ? (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 gap-4 md:grid-cols-2"
          >
            {filtered.map((reg, i) => (
              <RegulationCard key={reg.id} reg={reg} index={i} />
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center justify-center py-32"
          >
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.02]">
              <SearchX className="h-7 w-7 text-slate-600" />
            </div>
            <p className="eyebrow mb-2">No Matching Regulations Found</p>
            <p className="text-sm text-slate-500">Try broader search terms or filter by source.</p>
            <button
              onClick={() => setQuery("")}
              className="mt-4 btn-ghost rounded-lg px-5 py-2 font-digital text-xs uppercase tracking-wider"
            >
              Clear Search
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
