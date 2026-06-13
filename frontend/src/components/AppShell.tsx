"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "@/utils/mosip-data";
import { User, Satellite, Shield, ChevronRight } from "lucide-react";
import { getHealth, getMetricsSummary, type HealthPayload } from "@/utils/api";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [utc, setUtc] = useState("");
  const [health, setHealth] = useState<HealthPayload | null>(null);
  const [trackedCount, setTrackedCount] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setUtc(d.toISOString().slice(11, 19) + " UTC");
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadStatus() {
      try {
        const [healthPayload, metricsPayload] = await Promise.all([
          getHealth(),
          getMetricsSummary(),
        ]);
        if (cancelled) return;
        setHealth(healthPayload);
        setTrackedCount(metricsPayload.total_satellites ?? null);
      } catch {
        if (!cancelled) setHealth({ status: "degraded" });
      }
    }
    loadStatus();
    const id = setInterval(loadStatus, 30000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const systemsNominal = health?.status === "ok";

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--color-bg)" }}>
      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside
        onMouseEnter={() => setSidebarExpanded(true)}
        onMouseLeave={() => setSidebarExpanded(false)}
        className="fixed left-0 top-0 z-50 flex h-full flex-col border-r transition-all duration-300 ease-out"
        style={{
          width: sidebarExpanded ? "var(--sidebar-w-expanded)" : "var(--sidebar-w-collapsed)",
          borderColor: "var(--color-border)",
          background: "rgba(2,4,10,0.96)",
          backdropFilter: "blur(20px)",
        }}
      >
        {/* Logo */}
        <div
          className="flex h-[var(--topbar-h)] items-center gap-2.5 border-b px-3"
          style={{ borderColor: "var(--color-border)" }}
        >
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg relative"
            style={{
              background: "rgba(0,212,255,0.08)",
              border: "1px solid rgba(0,212,255,0.2)",
              boxShadow: "0 0 12px rgba(0,212,255,0.1)",
            }}
          >
            <Satellite size={14} className="text-[#00d4ff]" />
          </div>
          {sidebarExpanded && (
            <div className="flex flex-col min-w-0">
              <span className="font-display text-sm font-bold tracking-[0.18em] text-white whitespace-nowrap">
                MOSIP
              </span>
              <span style={{ fontSize: "7px", letterSpacing: "0.3em" }} className="text-[#00d4ff]/40 uppercase font-digital">
                OPS CENTER
              </span>
            </div>
          )}
        </div>

        {/* Status indicator row */}
        {sidebarExpanded && (
          <div className="mx-2 mt-2 flex items-center gap-1.5 rounded-md bg-[rgba(0,255,157,0.04)] border border-[#00ff9d]/10 px-3 py-1.5">
            <span className="pulse-dot" style={{ background: systemsNominal ? "#00ff9d" : "#ffb700", width: 5, height: 5 }} />
            <span className="font-digital text-[8px] uppercase tracking-widest text-[#00ff9d]/70">
              {systemsNominal ? "Systems nominal" : "Systems degraded"}
            </span>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 flex flex-col gap-0.5 p-2 mt-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200 ${
                  isActive
                    ? "bg-[rgba(0,212,255,0.08)] text-white"
                    : "text-slate-500 hover:bg-white/[0.03] hover:text-slate-300"
                }`}
                style={isActive ? { boxShadow: "inset 0 0 12px rgba(0,212,255,0.04)" } : undefined}
              >
                <Icon
                  size={17}
                  className={`shrink-0 transition-colors ${isActive ? "text-[#00d4ff]" : "text-slate-600 group-hover:text-slate-400"}`}
                />
                {sidebarExpanded && (
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-semibold tracking-wide truncate">{item.label}</span>
                    <span className="eyebrow truncate" style={{ fontSize: "7.5px" }}>
                      {item.eyebrow}
                    </span>
                  </div>
                )}
                {isActive && sidebarExpanded && (
                  <ChevronRight size={11} className="ml-auto text-[#00d4ff]/60 shrink-0" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t p-3" style={{ borderColor: "var(--color-border)" }}>
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-slate-400 border border-white/[0.06]">
              <User size={13} />
            </div>
            {sidebarExpanded && (
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-semibold text-white truncate">OPERATOR</span>
                <span className="text-[8px] text-[#00d4ff]/50 font-digital">CLEARANCE: L4</span>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ── Main area ───────────────────────────────────────────────────────── */}
      <div
        className="flex flex-1 flex-col transition-all duration-300 ease-out"
        style={{ marginLeft: "var(--sidebar-w-collapsed)" }}
      >
        {/* Top bar */}
        <header
          className="sticky top-0 z-40 flex h-[var(--topbar-h)] items-center justify-between border-b px-5"
          style={{
            borderColor: "var(--color-border)",
            background: "rgba(2,4,10,0.94)",
            backdropFilter: "blur(16px)",
          }}
        >
          {/* Wordmark */}
          <div className="flex items-center gap-2">
            <Satellite size={13} className="text-[#00d4ff]/60" />
            <span className="font-display text-sm font-bold tracking-[0.2em] text-white">MOSIP</span>
            <span
              className="eyebrow hidden sm:inline ml-1"
              style={{ color: "rgba(0,212,255,0.35)", fontSize: "8px" }}
            >
              ORBITAL INTELLIGENCE
            </span>
          </div>

          {/* Status strip */}
          <div className="hidden md:flex items-center gap-4 font-digital text-[10px] tracking-wider text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="pulse-dot" style={{ background: "var(--color-success)", width: 5, height: 5 }} />
              <span className={systemsNominal ? "text-[#00ff9d]/80" : "text-[#ffb700]/80"}>
                {systemsNominal ? "TELEMETRY ACTIVE" : "CHECK HEALTH"}
              </span>
            </span>
            <span className="text-white/[0.08]">|</span>
            <span className="text-slate-400">{trackedCount?.toLocaleString() ?? "0"} OBJECTS TRACKED</span>
            <span className="text-white/[0.08]">|</span>
            <span className="flex items-center gap-1">
              <Shield size={9} className="text-[#00d4ff]/40" />
              <span className="text-[#00d4ff]/50">{utc}</span>
            </span>
          </div>

          {/* Avatar */}
          <div
            className="flex h-7 w-7 items-center justify-center rounded-full border text-slate-500 transition-colors hover:border-[#00d4ff]/30 hover:text-slate-300"
            style={{ borderColor: "var(--color-border)", background: "rgba(255,255,255,0.03)" }}
          >
            <User size={13} />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
