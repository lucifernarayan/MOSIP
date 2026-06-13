"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, Cpu, ShieldCheck, Gauge, TrendingUp, Target, FileText,
  CheckCircle, Play, RefreshCw, AlertTriangle, ShieldAlert, Activity,
  AlertOctagon, BookOpen, FileCheck, Printer,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
  LineChart, Line,
} from "recharts";
import { agentTimeline, sourceColor } from "@/utils/mosip-data";
import { assessNorad, searchSatellites, type AssessmentPayload, type RegulationSearchResult, type SatelliteSummary } from "@/utils/api";
import { DashboardCard } from "@/components/DashboardCard";

const agentIcons = [Brain, Cpu, ShieldCheck, Gauge, TrendingUp, Target, FileText, CheckCircle];

type AssessmentTab = "risk" | "compliance" | "sustainability" | "forecast" | "recommendations";

function sectionValue(section: Record<string, unknown> | undefined, key: string) {
  return section?.[key];
}

function sectionNumber(section: Record<string, unknown> | undefined, keys: string[]) {
  for (const key of keys) {
    const numeric = Number(sectionValue(section, key));
    if (Number.isFinite(numeric)) return numeric;
  }
  return 0;
}

function sectionString(section: Record<string, unknown> | undefined, keys: string[], fallback = "N/A") {
  for (const key of keys) {
    const value = sectionValue(section, key);
    if (typeof value === "string" && value.trim()) return value;
    if (typeof value === "number") return String(value);
  }
  return fallback;
}

function sectionList(section: Record<string, unknown> | undefined, keys: string[]) {
  for (const key of keys) {
    const value = sectionValue(section, key);
    if (Array.isArray(value)) return value.map(String);
  }
  return [];
}

function satelliteName(sat: SatelliteSummary | null) {
  return sat?.object_name ?? "Satellite Intelligence";
}

function satelliteNorad(sat: SatelliteSummary | null) {
  return sat?.norad_id ?? "";
}

function regulationTitle(reg: RegulationSearchResult) {
  return reg.document || reg.source || "Retrieved regulation";
}

function buildForecastData(assessment: AssessmentPayload | null) {
  const projections = assessment?.forecast?.projections;
  if (projections && typeof projections === "object") {
    const projectionMap = projections as Record<string, Record<string, unknown>>;
    return [
      {
        label: "Now",
        risk: sectionNumber(assessment?.forecast, ["baseline_risk_score"]),
        burden: sectionNumber(assessment?.sustainability_analysis, ["environmental_burden", "orbital_burden_score"]),
        compliance: sectionNumber(assessment?.compliance_analysis, ["compliance_score"]),
      },
      ...(["5yr", "10yr", "25yr"] as const).map((key) => ({
        label: key.replace("yr", "Y"),
        risk: Number(projectionMap[key]?.projected_risk_score) || 0,
        burden: Number(projectionMap[key]?.shell_growth_pct) || 0,
        compliance: sectionNumber(assessment?.compliance_analysis, ["compliance_score"]),
      })),
    ];
  }
  return [];
}

/* ── Agent Timeline Component ─────────────────────────────────────────────── */
function AgentTimeline({ active }: { active: boolean }) {
  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => {
    if (!active) {
      const reset = setTimeout(() => setCompletedCount(0), 0);
      return () => clearTimeout(reset);
    }
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setCompletedCount(i);
      if (i >= agentTimeline.length) clearInterval(interval);
    }, 350);
    return () => clearInterval(interval);
  }, [active]);

  return (
    <div className="cyber-panel p-5">
      <div className="mb-4">
        <span className="eyebrow block mb-1">LangGraph Agent Pipeline</span>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
          8-Agent Sequential Execution
        </h3>
      </div>
      <div className="flex items-center overflow-x-auto pb-2">
        {agentTimeline.map((agent, i) => {
          const Icon = agentIcons[i];
          const done = completedCount > i;
          return (
            <div key={agent.name} className="flex items-center shrink-0">
              <motion.div
                className="flex flex-col items-center gap-1"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: active ? 1 : 0.4, scale: active ? 1 : 0.9 }}
                transition={{ delay: i * 0.35, duration: 0.3 }}
              >
                <div
                  className="relative flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-500"
                  style={{
                    borderColor: done ? "#00ff9d" : active && completedCount === i ? "#00d4ff" : "rgba(255,255,255,0.1)",
                    background: done ? "rgba(0,255,157,0.08)" : active && completedCount === i ? "rgba(0,212,255,0.08)" : "rgba(255,255,255,0.02)",
                    boxShadow: done ? "0 0 12px rgba(0,255,157,0.2)" : active && completedCount === i ? "0 0 12px rgba(0,212,255,0.2)" : "none",
                  }}
                >
                  <Icon size={15} className={done ? "text-[#00ff9d]" : completedCount === i ? "text-[#00d4ff]" : "text-slate-600"} />
                  {done && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#00ff9d]"
                    >
                      <CheckCircle size={9} className="text-black" />
                    </motion.div>
                  )}
                </div>
                <span className="font-digital text-[8px] uppercase tracking-wider text-center text-slate-500 max-w-[52px] leading-tight">
                  {agent.name}
                </span>
                <span className="font-digital text-[7px] text-slate-600">{agent.latency}</span>
              </motion.div>
              {i < agentTimeline.length - 1 && (
                <div className="mx-1 h-px w-8 shrink-0" style={{ background: done ? "rgba(0,255,157,0.3)" : "rgba(255,255,255,0.06)" }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Sparkline ────────────────────────────────────────────────────────────── */
function Sparkline({ data, color }: { data: number[]; color: string }) {
  const pts = data.map((v, i) => ({ i, v }));
  return (
    <ResponsiveContainer width="100%" height={36}>
      <LineChart data={pts}>
        <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

/* ── Main Content ─────────────────────────────────────────────────────────── */
function SatelliteIntelContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const satelliteIdParam = searchParams.get("id");

  const [noradId, setNoradId] = useState(satelliteIdParam || "");
  const [selectedSat, setSelectedSat] = useState<SatelliteSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [assessment, setAssessment] = useState<AssessmentPayload | null>(null);
  const [activeTab, setActiveTab] = useState<AssessmentTab>("risk");
  const [timelineActive, setTimelineActive] = useState(false);

  const runAssessment = async (idToAssess: string) => {
    setLoading(true);
    setError(null);
    setAssessment(null);
    setTimelineActive(false);

    const stages = [
      "Supervisor: Dispatching agents...",
      "Orbital: Analyzing TLE coefficients...",
      "Collision: Evaluating debris density clusters...",
      "Compliance: Querying ESA/IADC RAG vectors...",
      "Sustainability: Computing ecological footprint...",
      "Forecast: Propagating 25-year trajectory...",
      "Mitigation: Synthesizing avoidance strategies...",
      "Documentation: Compiling executive brief...",
    ];

    let stageIdx = 0;
    setLoadingStep(stages[0]);
    const timer = setInterval(() => {
      stageIdx++;
      if (stageIdx < stages.length) setLoadingStep(stages[stageIdx]);
    }, 1100);

    try {
      const result = await assessNorad(idToAssess);
      clearInterval(timer);
      if (result.errors && result.errors.length > 0) throw new Error(result.errors[0]);
      setAssessment(result);
      setSelectedSat({
        norad_id: Number(result.satellite?.norad_id ?? idToAssess),
        object_name: sectionString(result.satellite, ["object_name", "name"], `NORAD ${idToAssess}`),
        object_id: sectionString(result.satellite, ["object_id"], ""),
        altitude_km: sectionNumber(result.orbital_analysis, ["altitude_km", "altitude"]),
        orbit_type: sectionString(result.orbital_analysis, ["orbit_type", "regime", "orbital_regime"], "UNKNOWN"),
        risk_score: sectionNumber(result.collision_analysis, ["risk_score"]),
        risk_level: sectionString(result.collision_analysis, ["risk_level"], "UNKNOWN"),
      });
      setTimelineActive(true);
    } catch (err: unknown) {
      clearInterval(timer);
      setError(err instanceof Error ? err.message : `Assessment failed for NORAD ${idToAssess}.`);
    } finally {
      setLoading(false);
      setLoadingStep("");
    }
  };

  useEffect(() => {
    if (satelliteIdParam) {
      void Promise.resolve().then(() => {
        setNoradId(satelliteIdParam);
        runAssessment(satelliteIdParam);
      });
    }
  }, [satelliteIdParam]);

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = noradId.trim();
    if (!trimmed) return;
    if (/^\d+$/.test(trimmed)) {
      router.push(`/satellites?id=${trimmed}`);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const payload = await searchSatellites(trimmed, 1);
      const match = payload.results[0];
      if (!match) throw new Error(`No satellite found for "${trimmed}".`);
      setSelectedSat(match);
      setNoradId(String(match.norad_id));
      router.push(`/satellites?id=${match.norad_id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Satellite search failed.");
    } finally {
      setLoading(false);
    }
  };

  const sat = selectedSat;
  const forecastData = buildForecastData(assessment);
  const riskScore = Number(assessment?.collision_analysis?.risk_score) || 0;
  const sustainabilityIndex = Number(assessment?.sustainability_analysis?.sustainability_index) || 0;

  // 4 agent metric cards data
  const agentCards = assessment ? [
    {
      eyebrow: "Orbital Agent",
      metric: `${(assessment.orbital_analysis?.altitude as number) || 0}`,
      unit: "km",
      detail: `${assessment.orbital_analysis?.regime || "LEO"} · ${assessment.orbital_analysis?.velocity || ""}`,
      spark: [320, 350, 330, 365, 380, 370, 390],
      color: "#00d4ff",
    },
    {
      eyebrow: "Collision Agent",
      metric: `${riskScore}`,
      unit: "%",
      detail: `Risk level: ${assessment.collision_analysis?.risk_level || "NOMINAL"}`,
      spark: [20, 35, 28, 45, 40, 55, riskScore],
      color: riskScore >= 75 ? "#ff3366" : riskScore >= 55 ? "#ffb700" : "#00ff9d",
    },
    {
      eyebrow: "Compliance Agent",
      metric: `${assessment.compliance_analysis?.compliance_grade || "A"}`,
      unit: "",
      detail: assessment.compliance_analysis?.status as string || "COMPLIANT",
      spark: [90, 85, 88, 82, 86, 80, 84],
      color: "#00d4ff",
    },
    {
      eyebrow: "Sustainability Agent",
      metric: `${sustainabilityIndex}`,
      unit: "/100",
      detail: `Burden: ${assessment.sustainability_analysis?.orbital_burden_score || 0}/100`,
      spark: [80, 75, 78, 72, 70, 68, sustainabilityIndex || 70],
      color: "#00ff9d",
    },
  ] : [];

  return (
    <div className="flex flex-col gap-5 p-5 lg:p-7 cyber-grid min-h-full">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="flex flex-col justify-between gap-4 border-b border-white/[0.06] pb-5 sm:flex-row sm:items-center">
        <div>
          <span className="eyebrow block mb-1">Multi-Agent Synthesis Engine</span>
          <h1 className="text-2xl font-bold uppercase tracking-wider text-white">
            {satelliteName(sat)}
          </h1>
          {sat && (
            <div className="mt-2 flex items-center gap-2">
              <span className="font-digital text-[10px] text-slate-500">NORAD {satelliteNorad(sat)}</span>
              <span className="text-white/10">|</span>
              <span
                className="rounded-full border px-2 py-0.5 font-digital text-[9px] uppercase"
                style={{
                  borderColor: riskScore >= 75 ? "rgba(255,51,102,0.4)" : riskScore >= 55 ? "rgba(255,183,0,0.4)" : "rgba(0,212,255,0.3)",
                  color: riskScore >= 75 ? "#ff3366" : riskScore >= 55 ? "#ffb700" : "#00d4ff",
                  background: riskScore >= 75 ? "rgba(255,51,102,0.05)" : riskScore >= 55 ? "rgba(255,183,0,0.05)" : "rgba(0,212,255,0.05)",
                }}
              >
                {riskScore >= 75 ? "⬛ CRITICAL" : riskScore >= 55 ? "⬛ ELEVATED" : "● NOMINAL"}
              </span>
              <span className="font-digital text-[9px] text-slate-500">{sat.object_id || "Catalogued"}</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <input
            type="text"
            placeholder="Enter NORAD ID..."
            value={noradId}
            onChange={(e) => setNoradId(e.target.value)}
            className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-2 font-digital text-xs text-white placeholder-slate-500 outline-none focus:border-[#00d4ff]/30 focus:bg-[#00d4ff]/[0.03] w-[170px]"
          />
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg bg-[#00d4ff]/10 border border-[#00d4ff]/25 px-4 py-2 font-digital text-xs uppercase font-semibold text-[#00d4ff] hover:bg-[#00d4ff]/20 transition disabled:opacity-40"
          >
            {loading ? <RefreshCw size={13} className="animate-spin" /> : <Play size={13} />}
            Analyze
          </button>
        </form>
      </header>

      {/* ── Loading ─────────────────────────────────────────────────────────── */}
      {loading && (
        <div className="cyber-panel rounded-xl p-10 flex flex-col items-center justify-center min-h-[300px] relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,212,255,0.06),transparent_60%)]" />
          <div className="relative z-10 flex flex-col items-center gap-4">
            <div className="relative h-20 w-20">
              <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#00d4ff]/20 animate-[spin_10s_linear_infinite]" />
              <div className="absolute inset-3 rounded-full border border-[#00d4ff]/30 animate-pulse" />
              <div className="absolute inset-0 grid place-items-center">
                <div className="h-2 w-2 rounded-full bg-[#00d4ff]" style={{ boxShadow: "0 0 12px #00d4ff" }} />
              </div>
            </div>
            <p className="font-digital text-xs uppercase tracking-[0.25em] text-[#00d4ff]">Executing Multi-Agent Graph</p>
            <p className="font-digital text-[10px] text-slate-400 text-center max-w-sm animate-pulse">{loadingStep}</p>
            <div className="mt-2 w-52 h-0.5 bg-white/[0.04] rounded-full overflow-hidden">
              <div className="h-full bg-[#00d4ff]/70 rounded-full" style={{ animation: "loading 9s ease-in-out forwards" }} />
            </div>
          </div>
        </div>
      )}

      {/* ── Error ───────────────────────────────────────────────────────────── */}
      {error && !loading && (
        <div className="cyber-panel cyber-panel-danger p-5 flex items-center gap-3">
          <AlertOctagon size={20} className="text-[#ff3366] shrink-0" />
          <div>
            <h3 className="font-semibold text-[#ff3366] uppercase tracking-wider text-xs">Assessment Ingestion Fault</h3>
            <p className="text-xs text-slate-400 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* ── Results ─────────────────────────────────────────────────────────── */}
      {!loading && assessment && (
        <>
          {/* Agent Timeline */}
          <AgentTimeline active={timelineActive} />

          {/* 4 Agent Metric Cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {agentCards.map((card, i) => (
              <motion.div
                key={card.eyebrow}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className="cyber-panel p-4"
                style={{ borderColor: `${card.color}15` }}
              >
                <span className="eyebrow block mb-2">{card.eyebrow}</span>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="font-digital text-2xl font-bold" style={{ color: card.color }}>
                    {card.metric}
                  </span>
                  <span className="font-digital text-xs text-slate-500">{card.unit}</span>
                </div>
                <p className="font-digital text-[9px] text-slate-500 uppercase mb-2">{card.detail}</p>
                <Sparkline data={card.spark} color={card.color} />
              </motion.div>
            ))}
          </div>

          {/* Tabs + Detail */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
            <div className="xl:col-span-8">
              <div className="cyber-panel p-5">
                <nav className="flex flex-wrap gap-2 border-b border-white/[0.05] pb-4 mb-5">
                  {[
                    { id: "risk", label: "Collision Risk", icon: ShieldAlert },
                    { id: "compliance", label: "Compliance", icon: BookOpen },
                    { id: "sustainability", label: "Sustainability", icon: Activity },
                    { id: "forecast", label: "Forecast", icon: TrendingUp },
                    { id: "recommendations", label: "Mitigation", icon: FileCheck },
                  ].map((tab) => {
                    const Icon = tab.icon;
                    const active = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as AssessmentTab)}
                        className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 font-digital text-[10px] uppercase tracking-wider transition-all ${
                          active
                            ? "border-[#00d4ff]/30 bg-[#00d4ff]/08 text-[#00d4ff]"
                            : "border-white/[0.05] bg-white/[0.02] text-slate-500 hover:border-white/10 hover:text-slate-300"
                        }`}
                      >
                        <Icon size={11} />
                        {tab.label}
                      </button>
                    );
                  })}
                </nav>

                <div className="min-h-[260px]">
                  {/* Risk Tab */}
                  {activeTab === "risk" && (
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-white">Debris Collision Assessment</h3>
                        <span className="font-digital text-2xl font-bold" style={{ color: riskScore >= 75 ? "#ff3366" : riskScore >= 55 ? "#ffb700" : "#00ff9d" }}>
                          {riskScore}%
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ul className="flex flex-col gap-2">
                          {((assessment.collision_analysis?.risk_drivers as string[]) || []).map((d, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                              <AlertTriangle size={12} className="text-[#ffb700] mt-0.5 shrink-0" />
                              {d}
                            </li>
                          ))}
                        </ul>
                        <div className="bg-white/[0.02] border border-white/[0.05] p-3 rounded-lg font-digital text-xs">
                          <p className="eyebrow mb-2">Space Density Matrix</p>
                          <div className="flex justify-between py-1.5 border-b border-white/[0.05]">
                            <span className="text-slate-400">Debris Density Score</span>
                            <span className="text-white">{assessment.collision_analysis?.debris_density_score as number || 0}/100</span>
                          </div>
                          <div className="flex justify-between py-1.5">
                            <span className="text-slate-400">Conjunction Frequency</span>
                            <span className="text-white">{assessment.collision_analysis?.conjunction_frequency as string || "N/A"}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Compliance Tab */}
                  {activeTab === "compliance" && (
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-white">Regulatory Compliance</h3>
                        <span className="font-digital text-2xl font-bold text-[#00d4ff]">
                          {assessment.compliance_analysis?.compliance_grade as string || "A"}
                        </span>
                      </div>
                      <div className="border-l-2 border-[#00d4ff]/20 pl-4 py-1 text-xs text-slate-300 leading-relaxed">
                        {assessment.compliance_analysis?.reasoning as string}
                      </div>
                      <div className="flex flex-col gap-1.5">
                        {((assessment.compliance_analysis?.violations as string[]) || []).length === 0 ? (
                          <div className="flex items-center gap-2 text-xs text-[#00ff9d] bg-[#00ff9d]/05 border border-[#00ff9d]/10 p-2.5 rounded-lg">
                            <ShieldCheck size={13} />
                            Zero safety or deorbit regulatory infractions detected.
                          </div>
                        ) : (
                          ((assessment.compliance_analysis?.violations as string[]) || []).map((v, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs text-[#ff3366] bg-[#ff3366]/05 border border-[#ff3366]/15 p-2.5 rounded-lg">
                              <ShieldAlert size={13} className="mt-0.5 shrink-0" />
                              {v}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {/* Sustainability Tab */}
                  {activeTab === "sustainability" && (
                    <div className="flex flex-col gap-4">
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-white">Ecological Orbital Footprint</h3>
                      <div className="grid grid-cols-3 gap-3 font-digital">
                        {[
                          { label: "Sustainability Index", value: `${assessment.sustainability_analysis?.sustainability_index || 0}/100`, color: "#00ff9d" },
                          { label: "Environmental Burden", value: `${assessment.sustainability_analysis?.orbital_burden_score || 0}/100`, color: "#00d4ff" },
                          { label: "Space Occupancy", value: assessment.sustainability_analysis?.operational_footprint as string || "N/A", color: "#ffb700" },
                        ].map((m) => (
                          <div key={m.label} className="cyber-panel p-3 text-center">
                            <span className="block text-[8px] uppercase text-slate-500 mb-1">{m.label}</span>
                            <span className="block text-lg font-bold" style={{ color: m.color }}>{m.value}</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed border border-white/[0.04] bg-white/[0.01] p-3 rounded-lg">
                        Cross-sectional area of {assessment.sustainability_analysis?.cross_section_sqm as number || 0} m² weighed against orbital lifetime and local shell population. Lower values indicate elevated cascade collision potential.
                      </p>
                    </div>
                  )}

                  {/* Forecast Tab */}
                  {activeTab === "forecast" && (
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-white">25-Year Risk Propagation</h3>
                        <span className="font-digital text-xs text-slate-400">Decay est: {assessment.forecast?.decay_estimate_years as number || 0}y</span>
                      </div>
                      <div className="h-[180px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={forecastData}>
                            <defs>
                              <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={riskScore >= 75 ? "#ff3366" : "#ffb700"} stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#02040a" stopOpacity={0.1} />
                              </linearGradient>
                            </defs>
                            <XAxis dataKey="label" tick={{ fill: "#475569", fontSize: 9, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: "#475569", fontSize: 9, fontFamily: "monospace" }} axisLine={false} tickLine={false} domain={[0, 100]} />
                            <Tooltip contentStyle={{ backgroundColor: "#080810", borderColor: "rgba(0,212,255,0.15)", color: "#fff", fontSize: "10px", fontFamily: "monospace" }} />
                            <Area type="monotone" dataKey="risk" stroke={riskScore >= 75 ? "#ff3366" : "#ffb700"} strokeWidth={2} fill="url(#riskGrad)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  {/* Recommendations Tab */}
                  {activeTab === "recommendations" && (
                    <div className="flex flex-col gap-3">
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-white">Actionable Mitigation Mandates</h3>
                      {(assessment.recommendations || []).map((rec, i: number) => (
                        <div key={i} className="cyber-panel p-4 flex items-start gap-3">
                          <div className={`rounded-lg p-1.5 shrink-0 ${String(rec.priority || "") === "HIGH" ? "bg-[#ff3366]/10 text-[#ff3366]" : "bg-[#00d4ff]/10 text-[#00d4ff]"}`}>
                            <Brain size={14} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-xs font-semibold text-white uppercase tracking-wider">{String(rec.title || "Recommendation")}</h4>
                              <span className={`font-digital text-[8px] uppercase px-1.5 py-0.5 rounded ${String(rec.priority || "") === "HIGH" ? "bg-[#ff3366]/10 text-[#ff3366]" : "bg-white/[0.04] text-slate-400"}`}>
                                {String(rec.priority || "INFO")}
                              </span>
                            </div>
                            <p className="text-xs text-slate-300">{String(rec.action || "")}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Satellite Profile Card */}
            <div className="xl:col-span-4 flex flex-col gap-4">
              <DashboardCard title="Target Identity" eyebrow="Primary Orbital Properties" isActive>
                <div className="flex flex-col gap-3 font-digital text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Operator", value: assessment.satellite?.operator as string || "N/A" },
                      { label: "Regime", value: assessment.orbital_analysis?.regime as string || "N/A" },
                      { label: "Altitude", value: `${assessment.orbital_analysis?.altitude as number || 0} km`, className: "text-[#00d4ff]" },
                      { label: "Velocity", value: assessment.orbital_analysis?.velocity as string || "N/A", className: "text-[#00d4ff]" },
                      { label: "Apogee", value: `${assessment.orbital_analysis?.apogee as number || 0} km` },
                      { label: "Perigee", value: `${assessment.orbital_analysis?.perigee as number || 0} km` },
                      { label: "Inclination", value: `${assessment.satellite?.inclination_deg as number || 0}°` },
                      { label: "Period", value: `${assessment.orbital_analysis?.period_min as number || 0} min` },
                    ].map((f) => (
                      <div key={f.label}>
                        <span className="block text-[8px] uppercase text-slate-500">{f.label}</span>
                        <span className={`block truncate ${f.className || "text-slate-200"}`}>{f.value}</span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => router.push(`/reports?id=${noradId}`)}
                    className="btn-ghost flex items-center justify-center gap-1.5 rounded-lg py-2 text-[10px] uppercase tracking-wider"
                  >
                    <Printer size={11} /> Generate Report
                  </button>
                </div>
              </DashboardCard>

              {/* RAG Regulations */}
              <div className="cyber-panel p-4">
                <span className="eyebrow block mb-3">RAG — Retrieved Regulations</span>
                <div className="bg-black/50 border border-white/[0.04] rounded-lg p-3 font-digital text-[10px] text-slate-400 space-y-3 max-h-[200px] overflow-y-auto">
                  {(assessment.regulations || []).slice(0, 3).map((reg, i) => (
                    <div key={`${reg.source || "reg"}-${reg.document || i}`}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[8px] uppercase px-1.5 py-0.5 rounded" style={{ background: `${sourceColor(reg.source || "")}15`, color: sourceColor(reg.source || "") }}>{reg.source || "RAG"}</span>
                        <span className="text-white/60 truncate">{regulationTitle(reg)}</span>
                      </div>
                      <p className="text-slate-500 leading-relaxed line-clamp-2">§ {(reg.text || "").slice(0, 140)}...</p>
                    </div>
                  ))}
                  {(!assessment.regulations || assessment.regulations.length === 0) && (
                    <p className="text-slate-500">No regulation evidence returned by the assessment pipeline.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function SatelliteIntelligencePage() {
  return (
    <Suspense fallback={
      <div className="grid h-full min-h-screen place-items-center font-digital text-xs uppercase tracking-[0.3em] text-[#00d4ff]/40">
        Loading assessment engine...
      </div>
    }>
      <SatelliteIntelContent />
    </Suspense>
  );
}
