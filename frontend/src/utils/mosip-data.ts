import {
  Activity,
  Binary,
  BookOpen,
  BrainCircuit,
  FileText,
  Gauge,
  Globe2,
  Network,
  Orbit,
  Radar,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/* ── Severity levels ──────────────────────────────────────────────────────── */
export type Severity = "nominal" | "watch" | "elevated" | "critical";

/* ── Satellite type ───────────────────────────────────────────────────────── */
export type SatelliteTrack = {
  id: number;
  name: string;
  orbit: "LEO" | "MEO" | "GEO" | "HEO";
  lat: number;
  lng: number;
  alt: number;
  velocity: string;
  risk: number;
  compliance: string;
  sustainability: number;
  forecast: Severity;
  operator: string;
};

/* ── Agent step ───────────────────────────────────────────────────────────── */
export type AgentStep = {
  name: string;
  status: "complete" | "running" | "queued";
  latency: string;
  detail: string;
};

/* ── Metric point ─────────────────────────────────────────────────────────── */
export type MetricPoint = {
  label: string;
  risk: number;
  burden: number;
  compliance: number;
};

/* ── Nav item ─────────────────────────────────────────────────────────────── */
export type NavItem = {
  href: string;
  label: string;
  eyebrow: string;
  icon: LucideIcon;
};

export const navItems: NavItem[] = [
  { href: "/", label: "Mission Control", eyebrow: "Live orbit map", icon: Globe2 },
  { href: "/satellites", label: "Satellite Intel", eyebrow: "NORAD assessment", icon: Radar },
  { href: "/simulator", label: "Simulator", eyebrow: "Pre-launch what-if", icon: Gauge },
  { href: "/regulations", label: "Regulations", eyebrow: "Semantic retrieval", icon: BookOpen },
  { href: "/reports", label: "Reports", eyebrow: "Executive output", icon: FileText },
  { href: "/architecture", label: "Architecture", eyebrow: "Agent graph", icon: Network },
];

/* ── 19 Satellites ────────────────────────────────────────────────────────── */
export const satellites: SatelliteTrack[] = [
  { id: 25544, name: "ISS (ZARYA)", orbit: "LEO", lat: 18, lng: -42, alt: 420, velocity: "7.66 km/s", risk: 42, compliance: "A-", sustainability: 81, forecast: "watch", operator: "International" },
  { id: 43013, name: "SENTINEL-5P", orbit: "LEO", lat: -23, lng: 76, alt: 824, velocity: "7.45 km/s", risk: 63, compliance: "B+", sustainability: 68, forecast: "elevated", operator: "ESA" },
  { id: 40294, name: "HIMAWARI-8", orbit: "GEO", lat: 0, lng: 140, alt: 35786, velocity: "3.07 km/s", risk: 18, compliance: "A", sustainability: 89, forecast: "nominal", operator: "JMA" },
  { id: 33591, name: "NOAA-19", orbit: "LEO", lat: 57, lng: -108, alt: 870, velocity: "7.41 km/s", risk: 78, compliance: "C", sustainability: 51, forecast: "critical", operator: "NOAA" },
  { id: 41866, name: "GALILEO 15", orbit: "MEO", lat: -12, lng: 12, alt: 23222, velocity: "3.87 km/s", risk: 29, compliance: "A", sustainability: 84, forecast: "nominal", operator: "EU" },
  { id: 39084, name: "LANDSAT 8", orbit: "LEO", lat: 39, lng: 31, alt: 705, velocity: "7.50 km/s", risk: 55, compliance: "B", sustainability: 72, forecast: "watch", operator: "USGS/NASA" },
  { id: 27424, name: "ENVISAT", orbit: "LEO", lat: 68, lng: -35, alt: 790, velocity: "7.44 km/s", risk: 91, compliance: "F", sustainability: 12, forecast: "critical", operator: "ESA (Defunct)" },
  { id: 48274, name: "STARLINK-3127", orbit: "LEO", lat: -5, lng: -120, alt: 550, velocity: "7.59 km/s", risk: 34, compliance: "B+", sustainability: 77, forecast: "nominal", operator: "SpaceX" },
  { id: 29107, name: "METOP-A", orbit: "LEO", lat: 82, lng: 14, alt: 817, velocity: "7.45 km/s", risk: 61, compliance: "B-", sustainability: 64, forecast: "elevated", operator: "EUMETSAT" },
  { id: 36508, name: "SDO", orbit: "GEO", lat: 0, lng: -75, alt: 35790, velocity: "3.07 km/s", risk: 14, compliance: "A", sustainability: 93, forecast: "nominal", operator: "NASA" },
  { id: 43600, name: "BEIDOU-3 M13", orbit: "MEO", lat: -20, lng: 105, alt: 21528, velocity: "3.89 km/s", risk: 26, compliance: "A-", sustainability: 86, forecast: "nominal", operator: "CNSA" },
  { id: 28654, name: "NOAA-18", orbit: "LEO", lat: -45, lng: 170, alt: 854, velocity: "7.42 km/s", risk: 72, compliance: "C+", sustainability: 55, forecast: "elevated", operator: "NOAA" },
  { id: 25338, name: "IRIDIUM 33 DEB", orbit: "LEO", lat: 72, lng: 100, alt: 780, velocity: "7.45 km/s", risk: 95, compliance: "F", sustainability: 5, forecast: "critical", operator: "Debris" },
  { id: 37849, name: "TIANGONG-1", orbit: "LEO", lat: 10, lng: 45, alt: 340, velocity: "7.69 km/s", risk: 88, compliance: "D", sustainability: 18, forecast: "critical", operator: "CNSA (Defunct)" },
  { id: 44713, name: "ONEWEB-0064", orbit: "LEO", lat: -55, lng: -30, alt: 1200, velocity: "7.32 km/s", risk: 38, compliance: "B+", sustainability: 75, forecast: "watch", operator: "OneWeb" },
  { id: 41240, name: "JASON-3", orbit: "LEO", lat: 30, lng: -90, alt: 1336, velocity: "7.25 km/s", risk: 44, compliance: "A-", sustainability: 79, forecast: "watch", operator: "NASA/CNES" },
  { id: 38771, name: "COSMOS 2499", orbit: "LEO", lat: 65, lng: 48, alt: 1169, velocity: "7.33 km/s", risk: 69, compliance: "C-", sustainability: 42, forecast: "elevated", operator: "Roscosmos" },
  { id: 43566, name: "GPS III SV01", orbit: "MEO", lat: -15, lng: -165, alt: 20200, velocity: "3.91 km/s", risk: 21, compliance: "A", sustainability: 88, forecast: "nominal", operator: "USSF" },
  { id: 40697, name: "ASTRO-H", orbit: "LEO", lat: 32, lng: 132, alt: 575, velocity: "7.57 km/s", risk: 82, compliance: "D+", sustainability: 29, forecast: "critical", operator: "JAXA (Defunct)" },
];

/* ── Agent timeline ───────────────────────────────────────────────────────── */
export const agentTimeline: AgentStep[] = [
  { name: "Supervisor", status: "complete", latency: "00.18s", detail: "Assessment graph initialized" },
  { name: "Orbital", status: "complete", latency: "00.42s", detail: "Regime, apogee, perigee resolved" },
  { name: "Collision", status: "complete", latency: "00.71s", detail: "Debris density vectors scored" },
  { name: "Compliance", status: "complete", latency: "02.14s", detail: "ESA/IADC clauses retrieved via RAG" },
  { name: "Sustainability", status: "complete", latency: "01.31s", detail: "Orbital burden model computed" },
  { name: "Forecast", status: "complete", latency: "01.87s", detail: "5/10/25 year propagation complete" },
  { name: "Mitigation", status: "complete", latency: "01.56s", detail: "Action synthesis with priorities" },
  { name: "Documentation", status: "complete", latency: "00.94s", detail: "Executive report compiled" },
];

/* ── Forecast series (for selected satellite, recalculated per-satellite) ── */
export function buildForecast(sat: SatelliteTrack): MetricPoint[] {
  const r = sat.risk;
  return [
    { label: "Now", risk: r, burden: Math.round(100 - sat.sustainability), compliance: Math.round(r < 50 ? 85 : r < 70 ? 68 : 45) },
    { label: "5Y", risk: Math.min(100, Math.round(r * 1.12)), burden: Math.min(100, Math.round((100 - sat.sustainability) * 1.18)), compliance: Math.round(r < 50 ? 78 : r < 70 ? 61 : 38) },
    { label: "10Y", risk: Math.min(100, Math.round(r * 1.28)), burden: Math.min(100, Math.round((100 - sat.sustainability) * 1.38)), compliance: Math.round(r < 50 ? 70 : r < 70 ? 52 : 30) },
    { label: "25Y", risk: Math.min(100, Math.round(r * 1.58)), burden: Math.min(100, Math.round((100 - sat.sustainability) * 1.72)), compliance: Math.round(r < 50 ? 58 : r < 70 ? 40 : 18) },
  ];
}

/* ── Architecture nodes ───────────────────────────────────────────────────── */
export const architectureNodes = [
  { title: "Satellite Data", subtitle: "CelesTrak + UCS + PostgreSQL", icon: Orbit },
  { title: "Regulatory Corpus", subtitle: "ESA, NASA, IADC PDF chunks", icon: BookOpen },
  { title: "Unified Intelligence", subtitle: "Feature fusion + RAG context", icon: Binary },
  { title: "LangGraph Agents", subtitle: "8-node orbital reasoning chain", icon: BrainCircuit },
  { title: "Executive Synthesis", subtitle: "Mitigations, evidence, reports", icon: Sparkles },
];

/* ── Telemetry cards ──────────────────────────────────────────────────────── */
export const telemetryCards = [
  { label: "Tracked assets", value: "19,274", delta: "+214 today", icon: Orbit, tone: "cyan" },
  { label: "High risk objects", value: "1,246", delta: "63 critical", icon: TriangleAlert, tone: "red" },
  { label: "Compliance grade", value: "B+", delta: "ESA/IADC weighted", icon: ShieldCheck, tone: "green" },
  { label: "Agent throughput", value: "96.4%", delta: "graph uptime", icon: Activity, tone: "amber" },
];

/* ── Regulations data ─────────────────────────────────────────────────────── */
export type Regulation = {
  id: string;
  name: string;
  source: "ESA" | "IADC" | "NASA" | "UN";
  excerpt: string;
  year: number;
};

export const regulations: Regulation[] = [
  { id: "R001", name: "25-Year LEO Disposal Rule", source: "IADC", excerpt: "Spacecraft operating in LEO shall limit post-mission orbital lifetime to 25 years. Active deorbit or passive drag augmentation shall be utilized to ensure compliance.", year: 2007 },
  { id: "R002", name: "ESA Space Debris Mitigation", source: "ESA", excerpt: "ESA-ADMIN-IPOL(2014)2: All ESA missions shall demonstrate post-mission disposal compliance. Residual propellant and stored energy must be passivated within 30 days of end-of-life.", year: 2014 },
  { id: "R003", name: "NASA-STD-8719.14B", source: "NASA", excerpt: "Process for Limiting Orbital Debris: Probability of collision with large objects shall not exceed 0.001 during mission lifetime. Controlled reentry shall target unpopulated ocean zones.", year: 2019 },
  { id: "R004", name: "UN Space Debris Mitigation Guidelines", source: "UN", excerpt: "A/RES/62/217: Member States should voluntarily implement measures to limit generation of new debris including design, manufacturing, and operational practices.", year: 2007 },
  { id: "R005", name: "IADC Protection Manual", source: "IADC", excerpt: "IADC-04-03: Shielding requirements for spacecraft with orbital lifetime exceeding 5 years in altitude bands 750-1000 km. Minimum Whipple shield or equivalent required.", year: 2021 },
  { id: "R006", name: "ESA CleanSpace Initiative", source: "ESA", excerpt: "Active Debris Removal missions shall target catalogued objects with highest environmental criticality index. Priority targets include defunct satellites exceeding 1000 kg in 750-900 km band.", year: 2023 },
  { id: "R007", name: "NASA ODMSP Conjunction Assessment", source: "NASA", excerpt: "Conjunction screening cadence shall not exceed 72 hours for protected assets. Emergency collision avoidance maneuvers require authorization within 4-hour decision window.", year: 2020 },
  { id: "R008", name: "IADC Collision Avoidance Guidelines", source: "IADC", excerpt: "IADC-12-08: When probability of collision exceeds 1×10⁻⁵, spacecraft operators shall execute avoidance maneuver with minimum delta-V of 0.3 m/s perpendicular to velocity vector.", year: 2012 },
  { id: "R009", name: "UN Registration Convention", source: "UN", excerpt: "Convention on Registration of Objects Launched into Outer Space (1976): All launching states shall furnish orbital parameters, general function, and designator of space objects.", year: 1976 },
  { id: "R010", name: "ESA Zero Debris Charter", source: "ESA", excerpt: "By 2030, all ESA missions must achieve zero net debris generation. Missions in LEO shall deorbit within 5 years of end-of-life. GEO missions shall re-orbit to graveyard ±300 km.", year: 2023 },
];

/* ── Color utilities ──────────────────────────────────────────────────────── */
export function severityColor(severity: Severity): string {
  if (severity === "critical") return "text-[#ff3366]";
  if (severity === "elevated") return "text-[#ffb700]";
  if (severity === "watch") return "text-[#00d4ff]";
  return "text-[#00ff9d]";
}

export function riskTone(score: number): string {
  if (score >= 75) return "text-[#ff3366]";
  if (score >= 55) return "text-[#ffb700]";
  return "text-[#00ff9d]";
}

export function riskBg(score: number): string {
  if (score >= 75) return "bg-[#ff3366]";
  if (score >= 55) return "bg-[#ffb700]";
  return "bg-[#00ff9d]";
}

export function riskLabel(score: number): string {
  if (score >= 75) return "CRITICAL";
  if (score >= 55) return "ELEVATED";
  if (score >= 35) return "WATCH";
  return "NOMINAL";
}

export function riskGradient(score: number): string {
  if (score >= 75) return "linear-gradient(90deg, #ff3366, #ff6b6b)";
  if (score >= 55) return "linear-gradient(90deg, #ffb700, #ff8c00)";
  if (score >= 35) return "linear-gradient(90deg, #00d4ff, #0099cc)";
  return "linear-gradient(90deg, #00ff9d, #00cc7a)";
}

export function sourceColor(source: string): string {
  if (source === "ESA") return "#00d4ff";
  if (source === "IADC") return "#ffb700";
  if (source === "NASA") return "#ff3366";
  return "#00ff9d";
}
