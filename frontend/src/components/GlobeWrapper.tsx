"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef } from "react";
import type { SatelliteTrack } from "@/utils/mosip-data";

const Globe = dynamic(() => import("react-globe.gl"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full min-h-[420px] place-items-center rounded-lg border border-cyan-300/10 bg-black/40 font-digital text-xs uppercase tracking-[0.3em] text-cyan-100/60">
      Initializing orbital renderer
    </div>
  ),
});

type GlobeWrapperProps = {
  satellites: SatelliteTrack[];
  selectedId: number;
  onSelect: (satellite: SatelliteTrack) => void;
};

type GlobeMethods = {
  controls?: () => { autoRotate?: boolean; autoRotateSpeed?: number };
  pointOfView?: (point: { lat: number; lng: number; altitude: number }, ms?: number) => void;
};

export function GlobeWrapper({ satellites, selectedId, onSelect }: GlobeWrapperProps) {
  const globeRef = useRef<GlobeMethods | undefined>(undefined);

  const arcs = useMemo(
    () =>
      satellites.map((satellite, index) => ({
        ...satellite,
        startLat: satellite.lat,
        startLng: satellite.lng,
        endLat: satellite.lat * -0.72,
        endLng: satellite.lng + 110 - index * 18,
      })),
    [satellites],
  );

  useEffect(() => {
    const controls = globeRef.current?.controls?.();
    if (controls) {
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.32;
    }
  }, []);

  useEffect(() => {
    const selected = satellites.find((satellite) => satellite.id === selectedId);
    if (selected) {
      globeRef.current?.pointOfView?.(
        { lat: selected.lat, lng: selected.lng, altitude: 1.85 },
        1200,
      );
    }
  }, [satellites, selectedId]);

  return (
    <div className="relative h-[480px] overflow-hidden rounded-lg lg:h-[calc(100vh-220px)] lg:min-h-[600px]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,240,255,0.14),transparent_54%)]" />
      <Globe
        ref={globeRef}
        backgroundColor="rgba(0,0,0,0)"
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        showAtmosphere
        atmosphereColor="#00f0ff"
        atmosphereAltitude={0.16}
        pointsData={satellites}
        pointLat="lat"
        pointLng="lng"
        pointAltitude={(satellite: object) => {
          const item = satellite as SatelliteTrack;
          return item.orbit === "GEO" ? 0.42 : item.orbit === "MEO" ? 0.31 : 0.18;
        }}
        pointRadius={(satellite: object) => {
          const item = satellite as SatelliteTrack;
          return item.id === selectedId ? 0.55 : 0.32;
        }}
        pointColor={(satellite: object) => {
          const item = satellite as SatelliteTrack;
          if (item.risk >= 75) return "#ff2e5f";
          if (item.risk >= 55) return "#ffb700";
          return "#00f0ff";
        }}
        pointsTransitionDuration={900}
        onPointClick={(satellite: object) => onSelect(satellite as SatelliteTrack)}
        arcsData={arcs}
        arcStartLat="startLat"
        arcStartLng="startLng"
        arcEndLat="endLat"
        arcEndLng="endLng"
        arcAltitude={(satellite: object) => {
          const item = satellite as SatelliteTrack;
          return item.orbit === "GEO" ? 0.55 : 0.25;
        }}
        arcStroke={0.45}
        arcDashLength={0.54}
        arcDashGap={2}
        arcDashAnimateTime={4200}
        arcColor={(satellite: object) => {
          const item = satellite as SatelliteTrack;
          return item.id === selectedId ? ["#00f0ff", "#ffffff"] : ["#1fb6ff", "#0f172a"];
        }}
        width={900}
        height={720}
      />
      <div className="pointer-events-none absolute inset-x-4 top-4 flex items-center justify-between font-digital text-[10px] uppercase tracking-[0.24em] text-cyan-100/55">
        <span>Three.js orbital scene</span>
        <span>Live congestion layer</span>
      </div>
    </div>
  );
}
