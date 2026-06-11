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

export type Severity = "nominal" | "watch" | "elevated" | "critical";

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

export type AgentStep = {
  name: string;
  status: "complete" | "running" | "queued";
  latency: string;
  detail: string;
};

export type MetricPoint = {
  label: string;
  risk: number;
  burden: number;
  compliance: number;
};

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

export const satellites: SatelliteTrack[] = [
  {
    id: 25544,
    name: "ISS (ZARYA)",
    orbit: "LEO",
    lat: 18,
    lng: -42,
    alt: 420,
    velocity: "7.66 km/s",
    risk: 42,
    compliance: "A-",
    sustainability: 81,
    forecast: "watch",
    operator: "International",
  },
  {
    id: 43013,
    name: "SENTINEL-5P",
    orbit: "LEO",
    lat: -23,
    lng: 76,
    alt: 824,
    velocity: "7.45 km/s",
    risk: 63,
    compliance: "B+",
    sustainability: 68,
    forecast: "elevated",
    operator: "ESA",
  },
  {
    id: 40294,
    name: "HIMAWARI-8",
    orbit: "GEO",
    lat: 0,
    lng: 140,
    alt: 35786,
    velocity: "3.07 km/s",
    risk: 18,
    compliance: "A",
    sustainability: 89,
    forecast: "nominal",
    operator: "JMA",
  },
  {
    id: 33591,
    name: "NOAA-19",
    orbit: "LEO",
    lat: 57,
    lng: -108,
    alt: 870,
    velocity: "7.41 km/s",
    risk: 78,
    compliance: "C",
    sustainability: 51,
    forecast: "critical",
    operator: "NOAA",
  },
  {
    id: 41866,
    name: "GALILEO 15",
    orbit: "MEO",
    lat: -12,
    lng: 12,
    alt: 23222,
    velocity: "3.87 km/s",
    risk: 29,
    compliance: "A",
    sustainability: 84,
    forecast: "nominal",
    operator: "EU",
  },
  {
    id: 39084,
    name: "LANDSAT 8",
    orbit: "LEO",
    lat: 39,
    lng: 31,
    alt: 705,
    velocity: "7.50 km/s",
    risk: 55,
    compliance: "B",
    sustainability: 72,
    forecast: "watch",
    operator: "USGS/NASA",
  },
];

export const agentTimeline: AgentStep[] = [
  { name: "Supervisor", status: "complete", latency: "00.18s", detail: "Assessment graph initialized" },
  { name: "Orbital", status: "complete", latency: "00.42s", detail: "Regime, apogee, perigee resolved" },
  { name: "Collision", status: "complete", latency: "00.71s", detail: "Debris density vectors scored" },
  { name: "Compliance", status: "running", latency: "02.14s", detail: "ESA/IADC clauses retrieved" },
  { name: "Sustainability", status: "queued", latency: "--", detail: "Burden model waiting" },
  { name: "Forecast", status: "queued", latency: "--", detail: "5/10/25 year propagation" },
  { name: "Mitigation", status: "queued", latency: "--", detail: "Action synthesis" },
  { name: "Documentation", status: "queued", latency: "--", detail: "Executive report draft" },
];

export const forecastSeries: MetricPoint[] = [
  { label: "Now", risk: 42, burden: 28, compliance: 82 },
  { label: "5Y", risk: 51, burden: 38, compliance: 76 },
  { label: "10Y", risk: 63, burden: 51, compliance: 68 },
  { label: "25Y", risk: 81, burden: 73, compliance: 49 },
];

export const architectureNodes = [
  { title: "Satellite Data", subtitle: "CelesTrak + UCS + PostgreSQL", icon: Orbit },
  { title: "Regulatory Corpus", subtitle: "ESA, NASA, IADC PDF chunks", icon: BookOpen },
  { title: "Unified Intelligence", subtitle: "Feature fusion + RAG context", icon: Binary },
  { title: "LangGraph Agents", subtitle: "8-node orbital reasoning chain", icon: BrainCircuit },
  { title: "Executive Synthesis", subtitle: "Mitigations, evidence, reports", icon: Sparkles },
];

export const telemetryCards = [
  { label: "Tracked assets", value: "19,842", delta: "+214 today", icon: Orbit, tone: "cyan" },
  { label: "High risk objects", value: "1,246", delta: "63 critical", icon: TriangleAlert, tone: "red" },
  { label: "Compliance grade", value: "B+", delta: "ESA/IADC weighted", icon: ShieldCheck, tone: "green" },
  { label: "Agent throughput", value: "96.4%", delta: "graph uptime", icon: Activity, tone: "amber" },
];

export function severityColor(severity: Severity) {
  if (severity === "critical") return "text-[#ff2e5f]";
  if (severity === "elevated") return "text-[#ffb700]";
  if (severity === "watch") return "text-[#1fb6ff]";
  return "text-[#10b981]";
}

export function riskTone(score: number) {
  if (score >= 75) return "text-[#ff2e5f]";
  if (score >= 55) return "text-[#ffb700]";
  return "text-[#10b981]";
}
