"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Zap, AlertTriangle, Cpu, TrendingUp } from "lucide-react";
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

  // Time speedup to make motion visible (e.g. 150x)
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

  // Calculate velocity: v = sqrt(GM / a)
  const vel = Math.sqrt(GM / a); // km/s

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
    lat: 0, // computed dynamically
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

  const riskToneClass =
    (selectedSat?.risk ?? 0) >= 75 ? "text-[#ff3366]" : (selectedSat?.risk ?? 0) >= 55 ? "text-[#ffb700]" : "text-[#00ff9d]";

  return (
    <div className="relative flex h-[calc(100vh-var(--topbar-h))] overflow-hidden cyber-grid">
      {/* ═══ LEFT PANEL — 38% ══════════════════════════════════════════════ */}
      <div className="scanline relative flex w-[38%] min-w-[340px] flex-col gap-4 overflow-hidden border-r border-white/[0.04] bg-[rgba(2,4,10,0.6)] p-6 backdrop-blur-sm">

        {/* ── Hero counter ─────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <div className="relative">
            <span className="font-digital text-5xl font-bold leading-none tracking-tight text-[#00d4ff] md:text-6xl"
              style={{ textShadow: "0 0 40px rgba(0,212,255,0.3)" }}>
              {heroCount.toLocaleString()}
            </span>
            <span className="absolute -top-1 right-0 flex items-center gap-1">
              <span className="pulse-dot" style={{ background: "#00ff9d", width: 5, height: 5 }} />
              <span className="font-digital text-[8px] uppercase tracking-widest text-[#00ff9d]/60">Live</span>
            </span>
          </div>
          <span className="eyebrow mt-2 block">Objects in active orbital surveillance</span>
        </motion.div>

        {/* ── Status pills 2×2 ──────────────────────────────────────────── */}
        <motion.div
          className="grid grid-cols-2 gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          {[
            { label: "Active Tracking", value: (metrics?.total_satellites ?? 0).toLocaleString(), dot: "#00ff9d" },
            { label: "Risk Alerts", value: String(metrics?.critical_risk_count ?? 0), dot: "#ff3366", valueClass: "text-[#ff3366]" },
            { label: "Agents Online", value: "8/8", dot: "#00d4ff", valueClass: "text-[#00d4ff]" },
            { label: "Avg Risk", value: `${metrics?.average_risk_score ?? 0}%`, dot: "#ffb700", valueClass: "text-[#ffb700]" },
          ].map((pill) => (
            <div key={pill.label} className="cyber-panel flex items-center gap-2 px-3 py-2">
              <span className="pulse-dot shrink-0" style={{ background: pill.dot, width: 5, height: 5 }} />
              <div className="flex flex-col min-w-0">
                <span className="font-digital text-[8px] uppercase tracking-wider text-white/40 leading-tight">{pill.label}</span>
                <span className={`font-digital text-xs font-bold leading-tight ${pill.valueClass || "text-white/80"}`}>
                  {pill.value}
                </span>
              </div>
            </div>
          ))}
        </motion.div>

        {/* ── Search ───────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
        >
          <div className="search-glass">
            <Search size={13} className="shrink-0 text-[#00d4ff]/50" />
            <input
              type="text"
              placeholder="Search satellites by name or NORAD ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent font-digital text-[11px] text-white/80 placeholder:text-white/20 outline-none"
            />
          </div>
          {error && (
            <p className="mt-2 font-digital text-[9px] uppercase tracking-wider text-[#ff3366]">{error}</p>
          )}
        </motion.div>

        {/* ── Satellite list ──────────────────────────────────────────── */}
        <motion.div
          className="flex-1 overflow-y-auto space-y-0.5 min-h-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
        >
          <AnimatePresence mode="popLayout">
            {filteredSatellites.map((sat) => {
              const isSelected = sat.id === selectedId;
              return (
                <motion.button
                  key={sat.id}
                  layout
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.18 }}
                  onClick={() => setSelectedId(sat.id)}
                  className={`group flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-all duration-150 ${
                    isSelected
                      ? "bg-[rgba(0,212,255,0.06)] border-l-2 border-[#00d4ff]"
                      : "border-l-2 border-transparent hover:bg-white/[0.02] hover:border-white/10"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-semibold text-white">{sat.name}</span>
                    <span className="font-digital text-[9px] text-slate-500">{sat.id}</span>
                  </div>
                  <span className={`shrink-0 rounded-full border px-1.5 py-0.5 font-digital text-[8px] uppercase ${orbitBorder(sat.orbit)}`}>
                    {sat.orbit}
                  </span>
                  <div className="risk-bar-track w-14 shrink-0">
                    <div className="risk-bar-fill" style={{ width: `${sat.risk}%`, background: riskGradient(sat.risk) }} />
                  </div>
                </motion.button>
              );
            })}
          </AnimatePresence>
          {filteredSatellites.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Search size={20} className="text-slate-600 mb-2" />
              <span className="font-digital text-[10px] uppercase tracking-widest text-slate-600">No match found</span>
            </div>
          )}
        </motion.div>

        {/* ── ENGAGE CTA ──────────────────────────────────────────────── */}
        <motion.button
          className="cta-glow h-12 w-full font-digital text-xs uppercase tracking-[0.25em]"
          whileHover={{ scale: 1.015 }}
          whileTap={{ scale: 0.985 }}
          onClick={() => selectedId && router.push(`/satellites?id=${selectedId}`)}
          disabled={!selectedId}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <span className="flex items-center justify-center gap-2">
            <Zap size={13} />
            Engage Assessment
          </span>
        </motion.button>
      </div>

      {/* ═══ RIGHT PANEL — 62% ══════════════════════════════════════════ */}
      <div className="relative flex flex-1 flex-col">
        {/* Globe */}
        <div className="relative flex-1 overflow-hidden">
          <GlobeWrapper satellites={propagatedSatellites} selectedId={selectedId ?? 0} onSelect={handleSelect} orbitPath={orbitPath} />
        </div>

        {/* ── Telemetry strip ──────────────────────────────────────────── */}
        <motion.div
          className="grid grid-cols-3 border-t border-white/[0.04]"
          style={{ background: "rgba(2,4,10,0.88)", backdropFilter: "blur(12px)" }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          {[
            {
              icon: TrendingUp,
              label: "Velocity",
              value: `${(velNum / 100).toFixed(2)}`,
              unit: "km/s",
            },
            {
              icon: Cpu,
              label: "Altitude",
              value: altCount.toLocaleString(),
              unit: "km",
            },
            {
              icon: AlertTriangle,
              label: "Risk Index",
              value: `${riskCount}`,
              unit: "/100",
              valueClass: riskToneClass,
            },
          ].map((col, i) => {
            const Icon = col.icon;
            return (
              <div
                key={col.label}
                className={`px-5 py-4 ${i > 0 ? "border-l border-white/[0.06]" : ""}`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon size={10} className="text-[#00d4ff]/50" />
                  <span className="eyebrow">{col.label}</span>
                </div>
                <span className={`font-digital text-xl font-bold text-white ${col.valueClass || ""}`}>
                  {col.value}
                  <span className="ml-1 text-[11px] font-normal text-white/25">{col.unit}</span>
                </span>
              </div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}
