"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import type { SatelliteTrack } from "@/utils/mosip-data";

const Globe = dynamic(() => import("react-globe.gl"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full min-h-[420px] place-items-center rounded-xl border font-digital text-xs uppercase tracking-[0.3em] text-[#00d4ff]/40"
      style={{ borderColor: "var(--color-border)", background: "rgba(0,0,0,0.4)" }}>
      <div className="flex flex-col items-center gap-2">
        <div className="h-8 w-8 rounded-full border-2 border-[#00d4ff]/20 border-t-[#00d4ff] animate-spin" />
        <span>Initializing orbital renderer</span>
      </div>
    </div>
  ),
});

type GlobeWrapperProps = {
  satellites: SatelliteTrack[];
  selectedId: number;
  onSelect: (satellite: SatelliteTrack) => void;
};

export function GlobeWrapper({ satellites, selectedId, onSelect }: GlobeWrapperProps) {
  const globeRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  const arcs = useMemo(
    () =>
      satellites.map((s, i) => ({
        ...s,
        startLat: s.lat,
        startLng: s.lng,
        endLat: s.lat * -0.72,
        endLng: s.lng + 110 - i * 18,
      })),
    [satellites],
  );

  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width || 800,
          height: entry.contentRect.height || 600,
        });
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    const controls = globeRef.current?.controls?.();
    if (controls) {
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.3;
      controls.enableZoom = true;
      controls.minDistance = 150;
      controls.maxDistance = 500;
    }
  }, []);

  useEffect(() => {
    const sel = satellites.find((s) => s.id === selectedId);
    if (sel) {
      globeRef.current?.pointOfView?.(
        { lat: sel.lat, lng: sel.lng, altitude: 1.85 },
        1200,
      );
    }
  }, [satellites, selectedId]);

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden rounded-xl" style={{ minHeight: 420 }}>
      {/* Atmosphere glow */}
      <div className="absolute inset-0 pointer-events-none z-10"
        style={{
          background: "radial-gradient(circle at center, rgba(0,212,255,0.08) 0%, transparent 55%)",
        }}
      />

      <Globe
        ref={globeRef}
        backgroundColor="rgba(0,0,0,0)"
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        showAtmosphere
        atmosphereColor="#00d4ff"
        atmosphereAltitude={0.18}
        pointsData={satellites}
        pointLat="lat"
        pointLng="lng"
        pointAltitude={(s: object) => {
          const sat = s as SatelliteTrack;
          return sat.orbit === "GEO" ? 0.42 : sat.orbit === "MEO" ? 0.31 : 0.18;
        }}
        pointRadius={(s: object) => {
          const sat = s as SatelliteTrack;
          return sat.id === selectedId ? 0.6 : 0.3;
        }}
        pointColor={(s: object) => {
          const sat = s as SatelliteTrack;
          if (sat.risk >= 75) return "#ff3366";
          if (sat.risk >= 55) return "#ffb700";
          return "#00d4ff";
        }}
        pointsTransitionDuration={900}
        onPointClick={(s: object) => onSelect(s as SatelliteTrack)}
        arcsData={arcs}
        arcStartLat="startLat"
        arcStartLng="startLng"
        arcEndLat="endLat"
        arcEndLng="endLng"
        arcAltitude={(s: object) => {
          const sat = s as SatelliteTrack;
          return sat.orbit === "GEO" ? 0.55 : 0.25;
        }}
        arcStroke={0.4}
        arcDashLength={0.5}
        arcDashGap={2}
        arcDashAnimateTime={4200}
        arcColor={(s: object) => {
          const sat = s as SatelliteTrack;
          return sat.id === selectedId ? ["#00d4ff", "#ffffff"] : ["#00d4ff22", "#02040a"];
        }}
        width={dimensions.width}
        height={dimensions.height}
      />

      {/* Corner HUD overlays */}
      <div className="pointer-events-none absolute inset-x-4 top-4 flex items-center justify-between font-digital text-[9px] uppercase tracking-[0.3em] z-20">
        <span className="text-[#00d4ff]/40">Three.js orbital scene</span>
        <span className="flex items-center gap-1.5 text-[#00ff9d]/50">
          <span className="pulse-dot" style={{ background: "#00ff9d", width: 4, height: 4 }} />
          Live render
        </span>
      </div>
    </div>
  );
}
