"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sliders, Gauge, RotateCcw, Zap, AlertTriangle, CheckCircle, ShieldCheck } from "lucide-react";
import {
  ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis,
  BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, CartesianGrid,
} from "recharts";

/* ── Simulation Engine ─────────────────────────────────────────────────────── */
function simulateOrbit(altitude: number, inclination: number, eccentricity: number, debrisDensity: number, conjunctions: number) {
  const riskScore = Math.min(100, Math.round(
    (altitude / 1200) * 18 + debrisDensity * 3.1 + conjunctions * 4.2 +
    eccentricity * 120 + Math.max(0, (inclination - 80) * 0.4)
  ));
  const burden = Math.min(100, Math.round((altitude / 900) * 22 + debrisDensity * 2.8 + 12));
  const sustainability = Math.max(0, 100 - burden);
  let grade = "A", status = "COMPLIANT";
  let violations: string[] = [];

  if (riskScore >= 70) {
    grade = "D"; status = "NON-COMPLIANT";
    violations = [
      "Orbital lifetime exceeds 25-year IADC post-mission disposal rule.",
      "Conjunction probability above 1×10⁻⁵/yr threshold.",
    ];
  } else if (riskScore >= 50) {
    grade = "C+"; status = "CONDITIONAL";
    violations = ["Deorbit timeline marginally exceeds IADC 15-year recommended window."];
  } else if (riskScore >= 30) {
    grade = "B+"; status = "COMPLIANT";
  }

  const velocity = parseFloat((7.9 - (altitude / 1000) * 0.48).toFixed(2));
  const apogee = Math.round(altitude + altitude * eccentricity * 12);
  const perigee = Math.round(altitude - altitude * eccentricity * 12);
  const period = Math.round(84.3 * Math.pow((6371 + altitude) / 6371, 1.5));
  const regime = altitude > 2000 ? "MEO" : altitude < 300 ? "VLEO" : "LEO";

  const forecast = [
    { name: "Now", risk: riskScore },
    { name: "5Y", risk: Math.min(100, Math.round(riskScore * 1.12)) },
    { name: "10Y", risk: Math.min(100, Math.round(riskScore * 1.28)) },
    { name: "25Y", risk: Math.min(100, Math.round(riskScore * 1.58)) },
  ];

  const chartData = [
    { name: "Collision Risk", score: riskScore },
    { name: "Eco Burden", score: burden },
    { name: "Sustainability", score: sustainability },
  ];

  const feedback: string[] = [];
  if (altitude >= 750 && altitude <= 950) feedback.push("⚠ CRITICAL BELT: Altitude overlaps 750–950 km peak debris shell. Lower below 640 km or raise above 1,100 km.");
  if (conjunctions >= 5) feedback.push("⚠ CONJUNCTION OVERLOAD: >5 events/week exceeds ESA Rule 4.2. Autonomous collision-avoidance thrusters required.");
  if (altitude < 500) feedback.push("✓ DRAG DEORBIT ADVANTAGE: <500 km guarantees passive deorbit within 5–7 years — IADC compliant.");
  if (inclination >= 95 && inclination <= 100) feedback.push("⚠ SUN-SYNC CONGESTION: 97°–99° shares crowded sun-synchronous corridor.");
  if (eccentricity > 0.02) feedback.push("⚠ HIGH ECCENTRICITY: Sweeps multiple altitude shells, multiplying conjunction exposure.");
  if (feedback.length === 0) feedback.push("✓ NOMINAL DESIGN: Orbital parameters within safe operational margins.");

  return { riskScore, burden, sustainability, grade, status, violations, velocity, apogee, perigee, period, regime, forecast, chartData, feedback };
}

function riskColor(score: number) {
  if (score >= 70) return "#ff3366";
  if (score >= 50) return "#ffb700";
  return "#00ff9d";
}

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function SimulatorPage() {
  const [altitude, setAltitude] = useState(650);
  const [inclination, setInclination] = useState(55.2);
  const [eccentricity, setEccentricity] = useState(0.001);
  const [debrisDensity, setDebrisDensity] = useState(12.4);
  const [conjunctions, setConjunctions] = useState(3.5);
  const [simulating, setSimulating] = useState(false);
  const [results, setResults] = useState<ReturnType<typeof simulateOrbit> | null>(null);

  const runSim = async () => {
    setSimulating(true);
    setResults(null);
    await new Promise((r) => setTimeout(r, 1400));
    setResults(simulateOrbit(altitude, inclination, eccentricity, debrisDensity, conjunctions));
    setSimulating(false);
  };

  const resetAll = () => {
    setAltitude(650); setInclination(55.2); setEccentricity(0.001);
    setDebrisDensity(12.4); setConjunctions(3.5); setResults(null);
  };

  const sliders = [
    { label: "Mean Altitude", value: altitude, set: setAltitude, min: 200, max: 2500, step: 10, unit: "km", decimals: 0 },
    { label: "Orbit Inclination", value: inclination, set: setInclination, min: 0, max: 180, step: 0.1, unit: "°", decimals: 1 },
    { label: "Eccentricity", value: eccentricity, set: setEccentricity, min: 0, max: 0.05, step: 0.0001, unit: "", decimals: 4 },
    { label: "Debris Density", value: debrisDensity, set: setDebrisDensity, min: 0, max: 30, step: 0.1, unit: "obj/km³", decimals: 1 },
    { label: "Conjunction Events", value: conjunctions, set: setConjunctions, min: 0, max: 20, step: 0.1, unit: "/week", decimals: 1 },
  ];

  return (
    <div className="min-h-[calc(100vh-var(--topbar-h))] cyber-grid p-5 lg:p-7">
      <div className="mb-5">
        <span className="eyebrow block mb-1">Pre-Launch Orbital Modeler</span>
        <h1 className="text-2xl font-bold uppercase tracking-wider text-white">Virtual Flight Simulator</h1>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* ── Left Panel — Sliders ─────────────────────────────────────────── */}
        <div className="xl:col-span-4">
          <div className="cyber-panel p-5 flex flex-col gap-5 sticky top-20">
            <div className="flex items-center justify-between border-b border-white/[0.05] pb-4">
              <div>
                <span className="eyebrow block mb-1">Flight Parameters</span>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-white">Orbital Config</h2>
              </div>
              <Sliders size={18} className="text-[#00d4ff]/40" />
            </div>

            <div className="flex flex-col gap-5">
              {sliders.map((s) => (
                <div key={s.label}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-digital text-[10px] uppercase tracking-wider text-slate-400">{s.label}</span>
                    <span className="font-digital text-xs font-bold text-[#00d4ff]">
                      {s.decimals === 4 ? s.value.toFixed(4) : s.decimals === 1 ? s.value.toFixed(1) : s.value}
                      {s.unit && <span className="text-slate-500 font-normal ml-0.5">{s.unit}</span>}
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="range"
                      min={s.min}
                      max={s.max}
                      step={s.step}
                      value={s.value}
                      onChange={(e) => s.set(parseFloat(e.target.value))}
                      className="w-full h-1 rounded-full outline-none"
                      style={{
                        background: `linear-gradient(to right, #00d4ff ${((s.value - s.min) / (s.max - s.min)) * 100}%, rgba(255,255,255,0.06) 0%)`,
                        accentColor: "#00d4ff",
                      }}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="font-digital text-[8px] text-slate-600">{s.min}{s.unit}</span>
                    <span className="font-digital text-[8px] text-slate-600">{s.max}{s.unit}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-2 border-t border-white/[0.05]">
              <button onClick={resetAll} className="btn-ghost flex items-center gap-1.5 rounded-lg px-4 py-2 font-digital text-[10px] uppercase tracking-wider">
                <RotateCcw size={11} /> Reset
              </button>
              <motion.button
                onClick={runSim}
                disabled={simulating}
                whileTap={{ scale: 0.96, y: 2 }}
                className="cta-glow flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 font-digital text-xs uppercase tracking-[0.2em] disabled:opacity-50"
                style={{ boxShadow: simulating ? "none" : "0 4px 0 rgba(0,212,255,0.15), 0 0 20px rgba(0,212,255,0.1)" }}
              >
                {simulating ? <Gauge size={14} className="animate-pulse" /> : <Zap size={14} />}
                {simulating ? "Computing..." : "Run Simulation"}
              </motion.button>
            </div>
          </div>
        </div>

        {/* ── Right Panel — Results ────────────────────────────────────────── */}
        <div className="xl:col-span-8">
          <AnimatePresence mode="wait">
            {!results && !simulating && (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="cyber-panel flex min-h-[500px] flex-col items-center justify-center gap-4"
              >
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                  <Sliders size={30} className="text-slate-600" />
                </div>
                <div className="text-center">
                  <p className="font-digital text-xs uppercase tracking-[0.3em] text-slate-500">Simulator Idle</p>
                  <p className="text-sm text-slate-600 mt-1">Configure parameters and run simulation</p>
                </div>
              </motion.div>
            )}

            {simulating && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="cyber-panel flex min-h-[500px] flex-col items-center justify-center gap-5"
              >
                <div className="relative">
                  <Gauge size={48} className="text-[#00d4ff] animate-pulse" />
                  <div className="absolute inset-0 rounded-full" style={{ boxShadow: "0 0 30px rgba(0,212,255,0.2)" }} />
                </div>
                <p className="font-digital text-xs uppercase tracking-[0.3em] text-[#00d4ff]">Propagating Orbital Envelope</p>
                <div className="w-64 h-1 bg-white/[0.04] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-[#00d4ff]/70 rounded-full"
                    initial={{ width: "0%" }}
                    animate={{ width: "90%" }}
                    transition={{ duration: 1.3, ease: "easeOut" }}
                  />
                </div>
              </motion.div>
            )}

            {results && !simulating && (
              <motion.div
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-5"
              >
                {/* Metric Cards Row */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: "Collision Risk", value: results.riskScore, unit: "%", color: riskColor(results.riskScore) },
                    { label: "Eco Burden", value: results.burden, unit: "%", color: "#00d4ff" },
                    { label: "Sustainability", value: results.sustainability, unit: "/100", color: "#00ff9d" },
                  ].map((card, i) => (
                    <motion.div
                      key={card.label}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="cyber-panel p-4 text-center"
                      style={{ borderColor: `${card.color}18` }}
                    >
                      <span className="eyebrow block mb-2">{card.label}</span>
                      <span className="font-digital text-3xl font-bold" style={{ color: card.color }}>
                        {card.value}
                        <span className="text-sm font-normal text-slate-500 ml-1">{card.unit}</span>
                      </span>
                    </motion.div>
                  ))}
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Risk Donut */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="cyber-panel p-5"
                  >
                    <span className="eyebrow block mb-3">Risk Score (Radial)</span>
                    <div className="h-[160px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart cx="50%" cy="50%" innerRadius="65%" outerRadius="95%" data={[{ value: results.riskScore }]} startAngle={90} endAngle={-270}>
                          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                          <RadialBar dataKey="value" cornerRadius={6} fill={riskColor(results.riskScore)} background={{ fill: "rgba(255,255,255,0.04)" }} />
                        </RadialBarChart>
                      </ResponsiveContainer>
                    </div>
                    <p className="font-digital text-center text-xs text-slate-500 -mt-3">{results.riskScore}% — {results.status}</p>
                  </motion.div>

                  {/* Bar Chart */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className="cyber-panel p-5"
                  >
                    <span className="eyebrow block mb-3">Orbital Metrics</span>
                    <div className="h-[160px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={results.chartData} barSize={18}>
                          <XAxis dataKey="name" tick={{ fill: "#475569", fontSize: 8, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: "#475569", fontSize: 8, fontFamily: "monospace" }} axisLine={false} tickLine={false} domain={[0, 100]} />
                          <Tooltip contentStyle={{ backgroundColor: "#080810", borderColor: "rgba(0,212,255,0.15)", color: "#fff", fontSize: "10px", fontFamily: "monospace" }} />
                          <Bar dataKey="score" fill="#00d4ff" radius={[3, 3, 0, 0]} fillOpacity={0.8} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </motion.div>
                </div>

                {/* Forecast Line Chart */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="cyber-panel p-5"
                >
                  <span className="eyebrow block mb-3">25-Year Risk Forecast</span>
                  <div className="h-[140px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={results.forecast}>
                        <XAxis dataKey="name" tick={{ fill: "#475569", fontSize: 9, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: "#475569", fontSize: 9, fontFamily: "monospace" }} axisLine={false} tickLine={false} domain={[0, 100]} />
                        <Tooltip contentStyle={{ backgroundColor: "#080810", borderColor: "rgba(0,212,255,0.15)", color: "#fff", fontSize: "10px", fontFamily: "monospace" }} />
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                        <Line type="monotone" dataKey="risk" stroke={riskColor(results.riskScore)} strokeWidth={2} dot={{ r: 4, fill: riskColor(results.riskScore) }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>

                {/* Compliance Badge + Feedback */}
                <div className="grid grid-cols-2 gap-4">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="cyber-panel p-5 flex flex-col items-center justify-center gap-3"
                  >
                    <span className="eyebrow block">Compliance Grade</span>
                    <div
                      className="flex h-20 w-20 items-center justify-center rounded-full border-2 animate-border-glow"
                      style={{ borderColor: results.riskScore >= 70 ? "#ff3366" : results.riskScore >= 50 ? "#ffb700" : "#00ff9d" }}
                    >
                      <span className="font-digital text-3xl font-bold" style={{ color: results.riskScore >= 70 ? "#ff3366" : results.riskScore >= 50 ? "#ffb700" : "#00ff9d" }}>
                        {results.grade}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {results.violations.length === 0 ? (
                        <ShieldCheck size={13} className="text-[#00ff9d]" />
                      ) : (
                        <AlertTriangle size={13} className="text-[#ffb700]" />
                      )}
                      <span className="font-digital text-[9px] uppercase tracking-wider" style={{ color: results.riskScore >= 70 ? "#ff3366" : results.riskScore >= 50 ? "#ffb700" : "#00ff9d" }}>
                        {results.status}
                      </span>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.65 }}
                    className={`cyber-panel p-4 overflow-y-auto max-h-[200px] ${results.violations.length > 0 ? "cyber-panel-danger" : ""}`}
                  >
                    <span className="eyebrow block mb-3">Intelligence Feedback</span>
                    <div className="flex flex-col gap-2">
                      {results.feedback.map((f, i) => (
                        <p key={i} className={`font-digital text-[9px] leading-relaxed ${f.startsWith("✓") ? "text-[#00ff9d]" : "text-[#ffb700]"}`}>
                          {f}
                        </p>
                      ))}
                    </div>
                  </motion.div>
                </div>

                {/* Orbital details */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="cyber-panel p-4 grid grid-cols-5 gap-3"
                >
                  {[
                    { label: "Velocity", value: `${results.velocity} km/s` },
                    { label: "Apogee", value: `${results.apogee} km` },
                    { label: "Perigee", value: `${results.perigee} km` },
                    { label: "Period", value: `${results.period} min` },
                    { label: "Regime", value: results.regime },
                  ].map((f) => (
                    <div key={f.label} className="text-center">
                      <span className="eyebrow block mb-1">{f.label}</span>
                      <span className="font-digital text-xs text-white">{f.value}</span>
                    </div>
                  ))}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
