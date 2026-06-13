"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  AlertOctagon,
  ChevronRight,
  Download,
  FileText,
  Printer,
  RefreshCw,
  Search,
} from "lucide-react";
import {
  assessNorad,
  listSatellites,
  searchSatellites,
  type AssessmentSection,
  type AssessmentPayload,
  type SatelliteSummary,
} from "@/utils/api";

type SatelliteLike = SatelliteSummary | AssessmentSection | undefined;

function fieldValue(source: SatelliteLike, key: string) {
  return source ? source[key as keyof typeof source] : undefined;
}

function fieldString(source: SatelliteLike, keys: string[], fallback = "") {
  for (const key of keys) {
    const value = fieldValue(source, key);
    if (typeof value === "string" && value.trim()) return value;
    if (typeof value === "number") return String(value);
  }
  return fallback;
}

function fieldNumber(source: SatelliteLike, keys: string[]) {
  for (const key of keys) {
    const value = fieldValue(source, key);
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return numeric;
  }
  return undefined;
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function satelliteName(sat?: SatelliteLike) {
  return fieldString(sat, ["object_name", "name"], "Unknown Satellite");
}

function satelliteNorad(sat?: SatelliteLike) {
  return fieldNumber(sat, ["norad_id", "id"]) ?? null;
}

function normalizeRisk(value: unknown) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.round(numeric) : 0;
}

function riskColor(score: number) {
  if (score >= 75) return "#ff3366";
  if (score >= 55) return "#ffb700";
  return "#00ff9d";
}

function reportFromAssessment(assessment: AssessmentPayload | null) {
  if (!assessment) return "";
  return assessment.report?.trim() || "";
}

function ReportCenterContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const idParam = searchParams.get("id");

  const [query, setQuery] = useState("");
  const [targets, setTargets] = useState<SatelliteSummary[]>([]);
  const [selectedId, setSelectedId] = useState(idParam || "");
  const [assessment, setAssessment] = useState<AssessmentPayload | null>(null);
  const [loadingTargets, setLoadingTargets] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedSat = useMemo(() => {
    const fromList = targets.find((sat) => String(sat.norad_id) === selectedId);
    if (fromList) return fromList;
    if (assessment?.satellite) {
      return {
        norad_id: Number(satelliteNorad(assessment.satellite) ?? selectedId),
        object_name: satelliteName(assessment.satellite),
        altitude_km: fieldNumber(assessment.satellite, ["altitude_km"]),
        orbit_type: fieldString(assessment.satellite, ["orbit_type"]) || null,
        risk_score: fieldNumber(assessment.satellite, ["risk_score"]),
        risk_level: fieldString(assessment.satellite, ["risk_level"]) || null,
      };
    }
    return null;
  }, [assessment, selectedId, targets]);

  const reportText = reportFromAssessment(assessment);
  const riskScore = normalizeRisk(
    fieldValue(assessment?.collision_analysis, "risk_score") ??
      fieldValue(assessment?.satellite, "risk_score") ??
      selectedSat?.risk_score,
  );

  useEffect(() => {
    let cancelled = false;

    async function loadInitialTargets() {
      setLoadingTargets(true);
      setError(null);
      try {
        const payload = await listSatellites(75, 0);
        if (cancelled) return;
        setTargets(payload.satellites);
        const firstId = idParam || String(payload.satellites[0]?.norad_id ?? "");
        setSelectedId(firstId);
      } catch (err: unknown) {
        if (!cancelled) {
          setError(errorMessage(err, "Unable to load satellites from MOSIP API."));
        }
      } finally {
        if (!cancelled) setLoadingTargets(false);
      }
    }

    loadInitialTargets();
    return () => {
      cancelled = true;
    };
  }, [idParam]);

  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;

    async function loadReport() {
      setLoadingReport(true);
      setError(null);
      try {
        const result = await assessNorad(selectedId);
        if (cancelled) return;
        if (result.errors?.length) throw new Error(result.errors[0]);
        setAssessment(result);
      } catch (err: unknown) {
        if (!cancelled) {
          setAssessment(null);
          setError(errorMessage(err, `Unable to generate assessment for NORAD ${selectedId}.`));
        }
      } finally {
        if (!cancelled) setLoadingReport(false);
      }
    }

    loadReport();
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const runSearch = async (event?: React.FormEvent) => {
    event?.preventDefault();
    const trimmed = query.trim();
    setLoadingTargets(true);
    setError(null);

    try {
      const payload = trimmed.length >= 2
        ? await searchSatellites(trimmed, 50)
        : await listSatellites(75, 0);
      const nextTargets = "results" in payload ? payload.results : payload.satellites;
      setTargets(nextTargets);
      if (nextTargets.length && !nextTargets.some((sat) => String(sat.norad_id) === selectedId)) {
        const nextId = String(nextTargets[0].norad_id);
        setSelectedId(nextId);
        router.push(`/reports?id=${nextId}`);
      }
    } catch (err: unknown) {
      setError(errorMessage(err, "Satellite search failed."));
    } finally {
      setLoadingTargets(false);
    }
  };

  const selectSatellite = (noradId: number) => {
    const nextId = String(noradId);
    setSelectedId(nextId);
    router.push(`/reports?id=${nextId}`);
  };

  const handlePrint = () => {
    if (!reportText || !selectedSat) return;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<html><head><title>MOSIP Report - ${satelliteName(selectedSat)}</title>
      <style>body{background:#02040a;color:#cbd5e1;font-family:'Courier New',monospace;font-size:12px;padding:32px;white-space:pre-wrap;line-height:1.7}</style>
      </head><body>${reportText.replace(/[&<>]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[char] || char)}</body></html>`);
    w.document.close();
    w.print();
  };

  const handleDownload = () => {
    if (!reportText || !selectedSat) return;
    const blob = new Blob([reportText], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `MOSIP-${selectedSat.norad_id}-report.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="flex h-[calc(100vh-var(--topbar-h))] overflow-hidden cyber-grid">
      <div className="w-[320px] shrink-0 border-r border-white/[0.04] flex flex-col" style={{ background: "rgba(2,4,10,0.7)" }}>
        <div className="border-b border-white/[0.05] p-4">
          <span className="eyebrow block mb-1">PostgreSQL Target Search</span>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-white">Report Target</h2>
          <form onSubmit={runSearch} className="mt-4 flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2">
            <Search size={13} className="shrink-0 text-[#00d4ff]/50" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Name or NORAD ID..."
              className="min-w-0 flex-1 bg-transparent font-digital text-[11px] text-white outline-none placeholder:text-slate-600"
            />
            <button
              type="submit"
              disabled={loadingTargets}
              className="font-digital text-[9px] uppercase tracking-wider text-[#00d4ff] disabled:opacity-40"
            >
              {loadingTargets ? "..." : "Search"}
            </button>
          </form>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {targets.map((sat) => {
            const isSelected = String(sat.norad_id) === selectedId;
            const score = normalizeRisk(sat.risk_score);
            return (
              <button
                key={sat.norad_id}
                onClick={() => selectSatellite(sat.norad_id)}
                className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition-all mb-0.5 border-l-2 ${
                  isSelected
                    ? "bg-[rgba(0,212,255,0.06)] border-[#00d4ff]"
                    : "border-transparent hover:bg-white/[0.02] hover:border-white/10"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <span className="block truncate text-xs font-semibold text-white">{sat.object_name}</span>
                  <span className="font-digital text-[9px] text-slate-500">
                    {sat.norad_id} · {sat.orbit_type || "pending orbit"}
                  </span>
                </div>
                {sat.risk_score != null && (
                  <span className="font-digital text-xs font-bold" style={{ color: riskColor(score) }}>{score}%</span>
                )}
                {isSelected && <ChevronRight size={10} className="text-[#00d4ff]/50 shrink-0" />}
              </button>
            );
          })}

          {!loadingTargets && targets.length === 0 && (
            <div className="px-4 py-10 text-center font-digital text-[10px] uppercase tracking-wider text-slate-600">
              No satellites matched this search.
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        <div
          className="flex items-center justify-between border-b border-white/[0.04] px-6 py-3"
          style={{ background: "rgba(2,4,10,0.88)", backdropFilter: "blur(12px)" }}
        >
          <div className="flex items-center gap-3">
            <FileText size={14} className="text-[#00d4ff]/60" />
            <div>
              <span className="eyebrow block">LangGraph Report</span>
              <span className="text-xs font-semibold text-white">{selectedSat ? satelliteName(selectedSat) : "No target selected"}</span>
            </div>
            {selectedSat && (
              <span
                className="font-digital text-[8px] uppercase px-2 py-0.5 rounded border"
                style={{
                  borderColor: `${riskColor(riskScore)}55`,
                  color: riskColor(riskScore),
                }}
              >
                NORAD {selectedSat.norad_id} · {selectedSat.orbit_type || "orbit pending"} · {riskScore || "N/A"}%
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              disabled={!reportText}
              className="btn-ghost flex items-center gap-1.5 rounded-lg px-4 py-2 font-digital text-[10px] uppercase tracking-wider disabled:opacity-40"
            >
              <Download size={12} />
              Download .txt
            </button>
            <button
              onClick={handlePrint}
              disabled={!reportText}
              className="btn-ghost flex items-center gap-1.5 rounded-lg px-4 py-2 font-digital text-[10px] uppercase tracking-wider disabled:opacity-40"
            >
              <Printer size={12} />
              Print / PDF
            </button>
          </div>
        </div>

        <motion.div
          key={selectedId || "empty"}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex-1 overflow-y-auto p-6"
        >
          {error && (
            <div className="mb-4 flex items-start gap-3 rounded-lg border border-[#ff3366]/25 bg-[#ff3366]/5 p-4">
              <AlertOctagon size={18} className="mt-0.5 shrink-0 text-[#ff3366]" />
              <div>
                <h3 className="font-digital text-[10px] uppercase tracking-wider text-[#ff3366]">Backend Connection Fault</h3>
                <p className="mt-1 text-xs text-slate-400">{error}</p>
                <p className="mt-1 text-xs text-slate-500">Start the FastAPI backend on port 8000 and confirm PostgreSQL/Qdrant are available.</p>
              </div>
            </div>
          )}

          <div className="relative rounded-xl border border-white/[0.04] overflow-hidden" style={{ background: "#030308", minHeight: "600px" }}>
            {loadingReport && (
              <div className="absolute inset-0 z-20 grid place-items-center bg-[#030308]/80 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-3">
                  <RefreshCw size={20} className="animate-spin text-[#00d4ff]" />
                  <span className="font-digital text-[10px] uppercase tracking-[0.25em] text-[#00d4ff]/70">
                    Running MOSIP assessment pipeline
                  </span>
                </div>
              </div>
            )}

            <pre
              className="relative z-10 p-6 font-digital text-[10.5px] text-slate-300 leading-[1.75] whitespace-pre-wrap select-text"
              style={{ fontFamily: "'JetBrains Mono', 'Courier New', monospace" }}
            >
              {reportText || "Search for a satellite and select a target to generate a live MOSIP intelligence report."}
            </pre>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  return (
    <Suspense fallback={
      <div className="grid h-full min-h-screen place-items-center font-digital text-xs uppercase tracking-[0.3em] text-[#00d4ff]/40">
        Loading report engine...
      </div>
    }>
      <ReportCenterContent />
    </Suspense>
  );
}
