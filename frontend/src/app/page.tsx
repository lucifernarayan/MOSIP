"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Zap, AlertTriangle, Cpu, TrendingUp, Radio, Shield, ListCollapse } from "lucide-react";
import { riskGradient } from "@/utils/mosip-data";
import type { SatelliteTrack } from "@/utils/mosip-data";
import { GlobeWrapper } from "@/components/GlobeWrapper";
import { getMetricsSummary, listSatellites, searchSatellites, type MetricsSummaryPayload, type SatelliteSummary } from "@/utils/api";

/* ── Count-up Hook ─────────────────────────────────────────────────────────── */
function useCountUp(target: number, duration = 2000, deps: unknown[] = []) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let start: number | null = null;
    let raf: number;
    const step = (ts: number) => {
      if (start === null) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration, ...deps]);
  return value;
}

function orbitBorder(orbit: SatelliteTrack["orbit"]) {
  if (orbit === "LEO") return "border-[#00d4ff] text-[#00d4ff]";
  if (orbit === "MEO") return "border-[#ffb700] text-[#ffb700]";
  if (orbit === "GEO") return "border-[#00ff9d] text-[#00ff9d]";
  return "border-white/20 text-white/40";
}

function parseVel(v: string): number {
  return parseFloat(v.replace(/[^\d.]/g, "")) || 0;
}

function orbitType(value?: string | null): SatelliteTrack["orbit"] {
  if (value === "MEO" || value === "GEO" || value === "HEO") return value;
  return "LEO";
}

function propagateOrbit(noradId: number, altitudeKm: number, orbitType: string, timeMs: number) {
  const R_earth = 6371; // Earth radius in km
  const GM = 3.986004418e5; // km^3/s^2

  let alt = altitudeKm;
  if (!alt || alt <= 0) {
    alt = orbitType === "GEO" ? 35786 : orbitType === "MEO" ? 20200 : 550;
  }
  const a = R_earth + alt;
  const periodSec = 2 * Math.PI * Math.sqrt(Math.pow(a, 3) / GM);
  const periodMs = periodSec * 1000;

  const inclinationDeg = 30 + (noradId % 60); // 30 to 90 degrees
  const inclinationRad = (inclinationDeg * Math.PI) / 180;
  const raanDeg = (noradId * 13) % 360;
  const raanRad = (raanDeg * Math.PI) / 180;

  const timeSpeedup = 150;
  const phase = ((timeMs * timeSpeedup) / periodMs) * 2 * Math.PI;

  const x_orbit = a * Math.cos(phase);
  const y_orbit = a * Math.sin(phase);

  const x_eci = x_orbit * Math.cos(raanRad) - y_orbit * Math.sin(raanRad) * Math.cos(inclinationRad);
  const y_eci = x_orbit * Math.sin(raanRad) + y_orbit * Math.cos(raanRad) * Math.cos(inclinationRad);
  const z_eci = y_orbit * Math.sin(inclinationRad);

  const r = Math.sqrt(x_eci * x_eci + y_eci * y_eci + z_eci * z_eci);
  const lat = (Math.asin(z_eci / r) * 180) / Math.PI;
  let lng = (Math.atan2(y_eci, x_eci) * 180) / Math.PI;

  const earthRotationSpeed = 360 / (86164 * 1000);
  const rotationAngle = (timeMs * timeSpeedup * earthRotationSpeed) % 360;
  lng = ((lng - rotationAngle + 180) % 360) - 180;
  if (lng < -180) lng += 360;

  const vel = Math.sqrt(GM / a);

  return { lat, lng, vel };
}

function generateOrbitPath(noradId: number, altitudeKm: number, orbitType: string, timeMs: number) {
  const R_earth = 6371;
  const GM = 3.986004418e5;

  let alt = altitudeKm;
  if (!alt || alt <= 0) {
    alt = orbitType === "GEO" ? 35786 : orbitType === "MEO" ? 20200 : 550;
  }
  const a = R_earth + alt;
  const periodSec = 2 * Math.PI * Math.sqrt(Math.pow(a, 3) / GM);

  const inclinationDeg = 30 + (noradId % 60);
  const inclinationRad = (inclinationDeg * Math.PI) / 180;
  const raanDeg = (noradId * 13) % 360;
  const raanRad = (raanDeg * Math.PI) / 180;

  const timeSpeedup = 150;
  const earthRotationSpeed = 360 / (86164 * 1000);
  const rotationAngle = (timeMs * timeSpeedup * earthRotationSpeed) % 360;

  const points = [];
  const numPoints = 90;
  for (let i = 0; i <= numPoints; i++) {
    const phase = (i / numPoints) * 2 * Math.PI;
    const x_orbit = a * Math.cos(phase);
    const y_orbit = a * Math.sin(phase);

    const x_eci = x_orbit * Math.cos(raanRad) - y_orbit * Math.sin(raanRad) * Math.cos(inclinationRad);
    const y_eci = x_orbit * Math.sin(raanRad) + y_orbit * Math.cos(raanRad) * Math.cos(inclinationRad);
    const z_eci = y_orbit * Math.sin(inclinationRad);

    const r = Math.sqrt(x_eci * x_eci + y_eci * y_eci + z_eci * z_eci);
    const lat = (Math.asin(z_eci / r) * 180) / Math.PI;
    let lng = (Math.atan2(y_eci, x_eci) * 180) / Math.PI;

    lng = ((lng - rotationAngle + 180) % 360) - 180;
    if (lng < -180) lng += 360;

    points.push({ lat, lng });
  }
  return points;
}

function toTrack(sat: SatelliteSummary): SatelliteTrack {
  const orbit = orbitType(sat.orbit_type);
  const altitude = Math.round(Number(sat.altitude_km) || (orbit === "GEO" ? 35786 : orbit === "MEO" ? 20200 : 550));
  const risk = Math.round(Number(sat.risk_score) || 0);

  return {
    id: sat.norad_id,
    name: sat.object_name,
    orbit,
    lat: 0,
    lng: 0,
    alt: altitude,
    velocity: orbit === "GEO" ? "3.07 km/s" : orbit === "MEO" ? "3.90 km/s" : "7.50 km/s",
    risk,
    compliance: sat.risk_level || "N/A",
    sustainability: Math.max(0, 100 - risk),
    forecast: risk >= 75 ? "critical" : risk >= 55 ? "elevated" : risk >= 35 ? "watch" : "nominal",
    operator: sat.object_id || "Catalogued",
  };
}

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function MissionControlPage() {
  const router = useRouter();
  const [satellites, setSatellites] = useState<SatelliteTrack[]>([]);
  const [metrics, setMetrics] = useState<MetricsSummaryPayload | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [timeMs, setTimeMs] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      setTimeMs(Date.now() - start);
    }, 60);
    return () => clearInterval(interval);
  }, []);

  const selectedSat = useMemo(() => {
    const sat = satellites.find((s) => s.id === selectedId) ?? satellites[0] ?? null;
    if (!sat) return null;
    const pos = propagateOrbit(sat.id, sat.alt, sat.orbit, timeMs);
    return {
      ...sat,
      lat: pos.lat,
      lng: pos.lng,
      velocity: `${pos.vel.toFixed(2)} km/s`,
    };
  }, [satellites, selectedId, timeMs]);

  const propagatedSatellites = useMemo(() => {
    return satellites.map((sat) => {
      const pos = propagateOrbit(sat.id, sat.alt, sat.orbit, timeMs);
      return {
        ...sat,
        lat: pos.lat,
        lng: pos.lng,
      };
    });
  }, [satellites, timeMs]);

  const orbitPath = useMemo(() => {
    const sat = satellites.find((s) => s.id === selectedId) ?? satellites[0] ?? null;
    if (!sat) return undefined;
    return generateOrbitPath(sat.id, sat.alt, sat.orbit, timeMs);
  }, [satellites, selectedId, timeMs]);

  const filteredSatellites = useMemo(() => {
    if (!searchQuery.trim()) return satellites;
    const q = searchQuery.toLowerCase();
    return satellites.filter(
      (s) => s.name.toLowerCase().includes(q) || String(s.id).includes(q),
    );
  }, [searchQuery, satellites]);

  useEffect(() => {
    let cancelled = false;
    async function loadInitialData() {
      try {
        const [satPayload, metricsPayload] = await Promise.all([
          listSatellites(100, 0),
          getMetricsSummary(),
        ]);
        if (cancelled) return;
        const tracks = satPayload.satellites.map(toTrack);
        setSatellites(tracks);
        setMetrics(metricsPayload);
        setSelectedId(tracks[0]?.id ?? null);
      } catch (err: unknown) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Unable to load live satellite data.");
      }
    }
    loadInitialData();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const trimmed = searchQuery.trim();
    const timer = setTimeout(async () => {
      try {
        const payload = trimmed.length >= 2
          ? await searchSatellites(trimmed, 100)
          : await listSatellites(100, 0);
        if (cancelled) return;
        const nextSatellites = "results" in payload ? payload.results : payload.satellites;
        const tracks = nextSatellites.map(toTrack);
        setSatellites(tracks);
        setSelectedId((current) => tracks.some((sat) => sat.id === current) ? current : tracks[0]?.id ?? null);
      } catch (err: unknown) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Satellite search failed.");
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  const heroCount = useCountUp(metrics?.total_satellites ?? 0, 2200);
  const velNum = useCountUp(Math.round(parseVel(selectedSat?.velocity ?? "0") * 100), 800, [selectedId]);
  const altCount = useCountUp(selectedSat?.alt ?? 0, 800, [selectedId]);
  const riskCount = useCountUp(selectedSat?.risk ?? 0, 800, [selectedId]);

  const handleSelect = useCallback((sat: SatelliteTrack) => setSelectedId(sat.id), []);

  const riskColor = (selectedSat?.risk ?? 0) >= 75
    ? "var(--c-critical)"
    : (selectedSat?.risk ?? 0) >= 55
    ? "var(--c-elevated)"
    : "var(--c-nominal)";

  return (
    <div className="relative w-full overflow-y-auto" style={{ background: "#000", height: "calc(100vh - var(--topbar-h))" }}>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 1 — HERO VIEWPORT (60% Space Visor, 40% Control HUD Console)
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="relative w-full flex overflow-hidden shrink-0" style={{ height: "calc(100vh - var(--topbar-h))" }}>
        
        {/* ── LEFT SIDE: SPACE VISOR (60%) ── */}
        <div className="relative w-[60%] h-full overflow-hidden" style={{ borderRight: "1px solid var(--c-border)" }}>
          
          {/* Earth, Moon & ISS GlobeWrapper scene */}
          <div className="absolute inset-0 z-10">
            <GlobeWrapper
              satellites={propagatedSatellites}
              selectedId={selectedId ?? 0}
              onSelect={handleSelect}
              orbitPath={orbitPath}
            />
          </div>

          {/* Holographic grid scanner overlay on left visor */}
          <div className="absolute inset-0 pointer-events-none z-15 opacity-10"
            style={{
              backgroundImage: `
                linear-gradient(to right, var(--c-cyan) 1px, transparent 1px),
                linear-gradient(to bottom, var(--c-cyan) 1px, transparent 1px)
              `,
              backgroundSize: "60px 60px"
            }}
          />

          {/* Command tag overlay - top left */}
          <div className="absolute top-4 left-4 z-20 pointer-events-none">
            <div className="flex flex-col gap-0.5">
              <span className="font-data text-[7px] uppercase tracking-[0.35em]" style={{ color: "rgba(77,217,245,0.4)" }}>
                HUD VISUALIZATION REGION
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="font-display text-[15px] uppercase tracking-wider text-white" style={{ textShadow: "0 0 20px rgba(255,255,255,0.4)" }}>
                  COCKPIT VIEWPORT
                </span>
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--c-cyan)", boxShadow: "0 0 6px var(--c-cyan)" }} />
              </div>
            </div>
          </div>

          {/* Visor window corner brackets */}
          {["top-0 left-0", "top-0 right-0", "bottom-0 left-0", "bottom-0 right-0"].map((pos, i) => (
            <div
              key={i}
              className={`absolute ${pos} z-20 pointer-events-none`}
              style={{ width: 32, height: 32 }}
            >
              <div style={{
                position: "absolute", inset: 0,
                borderTop: (i < 2) ? "1.5px solid rgba(77,217,245,0.35)" : "none",
                borderBottom: (i >= 2) ? "1.5px solid rgba(77,217,245,0.35)" : "none",
                borderLeft: (i % 2 === 0) ? "1.5px solid rgba(77,217,245,0.35)" : "none",
                borderRight: (i % 2 === 1) ? "1.5px solid rgba(77,217,245,0.35)" : "none",
              }} />
            </div>
          ))}

          {/* Floating Bouncing Scroll Down Indicator (bottom center of left space view) */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1.5 pointer-events-none">
            <span className="font-data text-[7px] uppercase tracking-[0.3em]" style={{ color: "rgba(255,255,255,0.4)" }}>
              SCROLL FOR DEBRIS INTELLIGENCE
            </span>
            <motion.div
              animate={{ y: [0, 4, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M19 12l-7 7-7-7" />
              </svg>
            </motion.div>
          </div>
        </div>

        {/* ── RIGHT SIDE: WORKSTATION CONSOLE (40%) ── */}
        <div className="relative w-[40%] h-full flex flex-col overflow-hidden" style={{ background: "rgba(8,12,18,0.96)", backdropFilter: "blur(20px)" }}>
          
          {/* Subtle header border grid */}
          <div className="absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(to right, transparent, var(--c-cyan), transparent)" }} />

          {/* Console Identity Header */}
          <div className="px-5 py-4 shrink-0 flex items-center justify-between" style={{ borderBottom: "1px solid var(--c-border)" }}>
            <div>
              <span className="label block mb-0.5" style={{ color: "var(--c-cyan)" }}>MOSIP OPERATIONS SYSTEM v3.4</span>
              <h1 className="font-display text-[15px] uppercase tracking-[0.08em] text-white">
                SSA COMMAND DECK CONSOLE
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <span className="pulse-dot" style={{ background: "var(--c-nominal)" }} />
              <span className="font-data text-[8px] uppercase tracking-widest text-[var(--c-nominal)]">ONLINE</span>
            </div>
          </div>

          {/* Live System Metrics Strip */}
          <div className="grid grid-cols-4 px-5 py-2.5 shrink-0 bg-white/[0.01]" style={{ borderBottom: "1px solid var(--c-border)" }}>
            {[
              { label: "TRACKING", value: heroCount.toLocaleString(), color: "var(--c-cyan)" },
              { label: "ALERTS", value: String(metrics?.critical_risk_count ?? "—"), color: (metrics?.critical_risk_count ?? 0) > 0 ? "var(--c-critical)" : "var(--t-secondary)" },
              { label: "AVG RISK", value: `${metrics?.average_risk_score ?? "—"}%`, color: "var(--c-elevated)" },
              { label: "AGENTS", value: "8/8", color: "var(--c-nominal)" }
            ].map(col => (
              <div key={col.label} className="flex flex-col">
                <span className="font-data text-[7px] uppercase tracking-wider text-slate-500">{col.label}</span>
                <span className="font-data text-[12px] font-bold tabular-nums" style={{ color: col.color }}>{col.value}</span>
              </div>
            ))}
          </div>

          {/* Satellite Catalog search */}
          <div className="px-4 py-2 shrink-0" style={{ borderBottom: "1px solid var(--c-border)" }}>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-sm" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--c-border)" }}>
              <Search size={10} style={{ color: "var(--c-cyan)", opacity: 0.7 }} />
              <input
                type="text"
                placeholder="Search catalog NORAD ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent font-data text-[10px] outline-none placeholder:text-slate-600"
                style={{ color: "#fff", caretColor: "var(--c-cyan)" }}
              />
            </div>
          </div>

          {/* Scrollable Satellite Table list */}
          <div className="flex-1 overflow-y-auto min-h-0" style={{ borderBottom: "1px solid var(--c-border)" }}>
            <div className="grid grid-cols-12 px-4 py-1.5 shrink-0 border-b border-white/[0.02] bg-white/[0.005]">
              <span className="col-span-8 font-data text-[7px] uppercase text-slate-500">OBJECT IDENTIFIER</span>
              <span className="col-span-2 font-data text-[7px] uppercase text-slate-500 text-center">REGIME</span>
              <span className="col-span-2 font-data text-[7px] uppercase text-slate-500 text-right">RISK</span>
            </div>
            
            <AnimatePresence mode="popLayout">
              {filteredSatellites.map((sat) => {
                const isSelected = sat.id === selectedId;
                const rc = sat.risk >= 75 ? "var(--c-critical)" : sat.risk >= 55 ? "var(--c-elevated)" : "rgba(255,255,255,0.3)";
                return (
                  <motion.button
                    key={sat.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.1 }}
                    onClick={() => setSelectedId(sat.id)}
                    className="grid grid-cols-12 w-full px-4 py-2 text-left transition-all border-b border-white/[0.015]"
                    style={{
                      background: isSelected ? "rgba(77,217,245,0.06)" : "transparent",
                      borderLeft: `2.5px solid ${isSelected ? "var(--c-cyan)" : "transparent"}`,
                    }}
                  >
                    <div className="col-span-8 min-w-0 flex items-center gap-2">
                      <div className="h-1 w-1 rounded-full shrink-0" style={{ background: sat.risk >= 75 ? "var(--c-critical)" : sat.risk >= 55 ? "var(--c-elevated)" : "var(--c-nominal)" }} />
                      <div className="min-w-0">
                        <span className="block truncate font-data text-[10px]" style={{ color: isSelected ? "#fff" : "rgba(255,255,255,0.65)" }}>
                          {sat.name}
                        </span>
                        <span className="font-data text-[7px] text-slate-600">
                          NORAD {sat.id}
                        </span>
                      </div>
                    </div>
                    <div className="col-span-2 flex items-center justify-center">
                      <span className="font-data text-[7px] uppercase px-1 rounded-sm bg-white/[0.03] text-slate-400">
                        {sat.orbit}
                      </span>
                    </div>
                    <div className="col-span-2 flex items-center justify-end">
                      <span className="font-data text-[10px] tabular-nums font-bold" style={{ color: rc }}>
                        {sat.risk}
                      </span>
                    </div>
                  </motion.button>
                );
              })}
            </AnimatePresence>
            {filteredSatellites.length === 0 && (
              <div className="py-12 text-center">
                <span className="font-data text-[8px] uppercase tracking-wider text-slate-600">EMPTY CATALOG TARGET</span>
              </div>
            )}
          </div>

          {/* Telemetry Locked On HUD (at the bottom of console) */}
          {selectedSat && (
            <div className="p-4 shrink-0 bg-white/[0.005]" style={{ borderBottom: "1px solid var(--c-border)" }}>
              <div className="rounded p-3 flex flex-col gap-2.5" style={{ background: "rgba(4,9,15,0.5)", border: "1px solid var(--c-border)" }}>
                
                {/* ID Header */}
                <div className="flex items-center justify-between pb-1.5 border-b border-white/[0.04]">
                  <div className="flex items-center gap-1.5">
                    <span className="pulse-dot" style={{ background: riskColor }} />
                    <span className="font-data text-[8px] uppercase tracking-widest text-slate-500">LOCKED TELEMETRY</span>
                  </div>
                  <span className="font-data text-[8px] text-white/50">NORAD {selectedSat.id}</span>
                </div>

                {/* Name */}
                <span className="block font-display text-[13px] uppercase tracking-wider text-white truncate">
                  {selectedSat.name}
                </span>

                {/* Telemetry metrics */}
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {[
                    { label: "VELOCITY", val: `${(velNum / 100).toFixed(2)}`, unit: "km/s", icon: TrendingUp },
                    { label: "ALTITUDE", val: altCount.toLocaleString(), unit: "km", icon: Cpu },
                    { label: "RISK INDEX", val: `${riskCount}`, unit: "", icon: AlertTriangle, color: riskColor }
                  ].map(cell => {
                    const Icon = cell.icon;
                    return (
                      <div key={cell.label} className="flex flex-col">
                        <div className="flex items-center gap-1 mb-0.5">
                          <Icon size={8} style={{ color: "var(--c-cyan)", opacity: 0.6 }} />
                          <span className="font-data text-[6.5px] uppercase tracking-wider text-slate-500">{cell.label}</span>
                        </div>
                        <span className="font-data text-[12px] font-bold tabular-nums" style={{ color: cell.color ?? "#fff" }}>
                          {cell.val}
                          <span className="text-[7.5px] font-normal ml-0.5 text-slate-500">{cell.unit}</span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Action Trigger panel */}
          <div className="p-4 shrink-0 flex gap-2">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => selectedId && router.push(`/satellites?id=${selectedId}`)}
              disabled={!selectedId}
              className="w-full h-9 flex items-center justify-center gap-1.5 rounded-sm font-data text-[9px] uppercase tracking-[0.2em] transition-all disabled:opacity-30 btn-primary"
            >
              <Zap size={10} />
              INITIATE ASSESSMENT
            </motion.button>
          </div>
        </div>

      </div>

      {/* ── Error Banner overlay (if API down) ── */}
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute top-14 left-1/2 -translate-x-1/2 z-30"
        >
          <div
            className="px-4 py-2 rounded font-data text-[9px] uppercase tracking-wider"
            style={{ background: "rgba(239,67,67,0.12)", border: "1px solid rgba(239,67,67,0.35)", color: "var(--c-critical)", backdropFilter: "blur(8px)" }}
          >
            ⚠ {error}
          </div>
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 2 — DEBRIS ANALYSIS & PROBLEM RESOLUTION (Scrollable)
          ═══════════════════════════════════════════════════════════════════ */}
      <div 
        className="relative z-20 w-full px-8 py-16"
        style={{ 
          background: "radial-gradient(circle at top, #0b111a 0%, #080c12 100%)",
          borderTop: "1px solid var(--c-border)",
        }}
      >
        <div className="cyber-grid absolute inset-0 opacity-15 pointer-events-none" />

        <div className="relative max-w-5xl mx-auto flex flex-col gap-14">
          
          {/* Header */}
          <div className="flex flex-col gap-2 border-l-2 border-[var(--c-cyan)] pl-4">
            <span className="font-data text-[9px] uppercase tracking-[0.35em]" style={{ color: "var(--c-cyan)" }}>
              SECURE DEBRIS BRIEFING // KESSLER SYNDROME MATRIX
            </span>
            <h2 className="font-display text-3xl uppercase tracking-wider text-white">
              The Orbital Debris Crisis
            </h2>
            <p className="text-[13px] leading-relaxed text-[var(--t-secondary)] max-w-2xl">
              Low Earth Orbit (LEO) is experiencing exponential congestion. Over six decades of spaceflight have accumulated 
              millions of high-velocity debris particles. Today, MOSIP is monitoring 
              <span className="text-[var(--c-cyan)] font-semibold"> {satellites.length ? satellites.length : 15680}+ cataloged objects </span>
              in real-time to prevent collision events and sustain operational access to space.
            </p>
          </div>

          {/* Infographics cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Card 1: Debris Distribution */}
            <div 
              className="p-5 rounded"
              style={{ background: "var(--c-surface-0)", border: "1px solid var(--c-border)" }}
            >
              <span className="label block mb-2">ORBIT REGIME DISTRIBUTION</span>
              <h3 className="font-display text-md uppercase tracking-wide text-white mb-4">LEO Congestion Profile</h3>
              
              <div className="flex flex-col gap-3">
                {[
                  { regime: "Debris & Defunct Satellites", percent: 68, count: "10,660 objs", color: "var(--c-critical)" },
                  { regime: "Active Satellites", percent: 21, count: "3,290 objs", color: "var(--c-cyan)" },
                  { regime: "MEO & GEO Regimes", percent: 11, count: "1,730 objs", color: "var(--c-nominal)" }
                ].map(r => (
                  <div key={r.regime} className="flex flex-col gap-1">
                    <div className="flex justify-between font-data text-[9px]">
                      <span style={{ color: "rgba(255,255,255,0.6)" }}>{r.regime}</span>
                      <span className="font-bold" style={{ color: r.color }}>{r.count}</span>
                    </div>
                    <div className="risk-bar-track">
                      <div className="risk-bar-fill" style={{ width: `${r.percent}%`, background: r.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Card 2: Conjunction Probability */}
            <div 
              className="p-5 rounded"
              style={{ background: "var(--c-surface-0)", border: "1px solid var(--c-border)" }}
            >
              <span className="label block mb-2">THREAT INTELLIGENCE</span>
              <h3 className="font-display text-md uppercase tracking-wide text-white mb-4">Collision & Conjunction Metrics</h3>
              
              <div className="flex items-center justify-between gap-4 py-2">
                <div className="flex flex-col">
                  <span className="font-data text-3xl font-bold text-[var(--c-critical)]">{(metrics?.critical_risk_count ?? 142)}</span>
                  <span className="font-data text-[8px] uppercase tracking-wider text-[var(--t-meta)] mt-1">CRITICAL ALERTS</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-data text-3xl font-bold text-[var(--c-elevated)]">{(metrics?.average_risk_score ?? 48)}%</span>
                  <span className="font-data text-[8px] uppercase tracking-wider text-[var(--t-meta)] mt-1">AVG INDEX RISK</span>
                </div>
              </div>
              
              <div className="mt-4 pt-3 border-t border-white/5 flex flex-col gap-1 text-[10px] text-[var(--t-secondary)] leading-normal">
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--c-critical)] animate-ping" />
                  <span>ALERT: Closest approach distances &lt; 50 meters detected.</span>
                </div>
                <span>Evasion protocols and orbital maneuver calculations have been initialized.</span>
              </div>
            </div>

            {/* Card 3: Regulatory Compliance */}
            <div 
              className="p-5 rounded"
              style={{ background: "var(--c-surface-0)", border: "1px solid var(--c-border)" }}
            >
              <span className="label block mb-2">MITIGATION POLICIES</span>
              <h3 className="font-display text-md uppercase tracking-wide text-white mb-4">ESA & IADC Audits</h3>
              
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className="font-data text-[10px] text-[var(--t-secondary)]">25-Year Disposal Rule</span>
                  <span className="status-tag critical">42% AUDIT FAIL</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-data text-[10px] text-[var(--t-secondary)]">Kinetic Fragmentation Index</span>
                  <span className="status-tag watch">ELEVATED Burden</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-data text-[10px] text-[var(--t-secondary)]">De-orbit Energy Margins</span>
                  <span className="status-tag nominal">92% COMPLIANT</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section: How MOSIP Resolves It */}
          <div className="flex flex-col gap-6 mt-4">
            <div className="flex flex-col gap-1">
              <span className="font-data text-[9px] uppercase tracking-[0.35em]" style={{ color: "var(--c-ai)" }}>
                DISTRIBUTED MULTI-AGENT ARCHITECTURE
              </span>
              <h3 className="font-display text-2xl uppercase tracking-wider text-white">
                How MOSIP Solves The Crisis
              </h3>
              <p className="text-[13px] leading-relaxed text-[var(--t-secondary)] max-w-2xl">
                MOSIP orchestrates a network of **eight specialized autonomous agents** backed by PostgreSQL catalog data, 
                Qdrant policy vector search, and a Groq LLM reasoning layer to solve orbital debris problems in real-time.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  title: "1. Surveillance & Conjunction Projection",
                  desc: "The Surveillance Agent continuously monitors NORAD telemetry. When orbits intersect, the Risk Agent runs conjunction Monte Carlo simulations to project collision probability.",
                  icon: Cpu,
                  color: "var(--c-cyan)",
                  ghostColor: "var(--c-cyan-ghost)"
                },
                {
                  title: "2. Policy Compliance & Burden Scoring",
                  desc: "Using vector search in Qdrant, the Policy Agent checks satellite operational histories against ESA and IADC debris mitigation regulations. The Sustainability Agent scores long-term orbital burden.",
                  icon: Zap,
                  color: "var(--c-ai)",
                  ghostColor: "var(--c-ai-ghost)"
                },
                {
                  title: "3. Autonomous Evasion Maneuvers",
                  desc: "In critical risk scenarios, the Maneuver Agent designs immediate delta-v evasion trajectories. The Groq LLM synthesizes these into natural-language command briefs for flight controllers.",
                  icon: AlertTriangle,
                  color: "var(--c-nominal)",
                  ghostColor: "rgba(61,232,155,0.06)"
                }
              ].map(agent => {
                const Icon = agent.icon;
                return (
                  <div 
                    key={agent.title}
                    className="p-5 rounded flex flex-col gap-3 relative overflow-hidden"
                    style={{ 
                      background: "var(--c-surface-0)", 
                      border: "1px solid var(--c-border)",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-sm" style={{ background: agent.ghostColor }}>
                        <Icon size={16} style={{ color: agent.color }} />
                      </div>
                      <h4 className="font-display text-[14px] uppercase tracking-wider text-white">{agent.title}</h4>
                    </div>
                    <p className="text-[11px] leading-relaxed text-[var(--t-secondary)]">
                      {agent.desc}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Return Call to Action */}
            <div 
              className="p-6 rounded flex flex-col md:flex-row items-center justify-between gap-6 mt-4"
              style={{ 
                background: "rgba(167,139,250,0.04)", 
                border: "1px solid rgba(167,139,250,0.18)",
                borderRadius: "var(--border-r)"
              }}
            >
              <div className="flex flex-col gap-1 text-center md:text-left">
                <span className="font-data text-[8px] uppercase tracking-[0.3em] text-[var(--c-ai)]">Orchestrator Interface Ready</span>
                <span className="font-display text-[15px] uppercase tracking-wide text-white font-semibold">Active Assessment Environment</span>
                <span className="text-[11px] text-[var(--t-secondary)]">Select any satellite in the catalog drawer above and click "Initiate Assessment" to trigger the multi-agent chain.</span>
              </div>
              <button 
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="btn-primary h-8 px-6 flex items-center justify-center gap-2 shrink-0 font-data text-[9px]"
                style={{
                  background: "rgba(167,139,250,0.08)",
                  border: "1px solid var(--c-ai)",
                  color: "var(--c-ai)"
                }}
              >
                Return to Command Deck
              </button>
            </div>

          </div>
        </div>
      </div>

    </div>
  );
}
