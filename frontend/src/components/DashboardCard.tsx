import type { ReactNode } from "react";

type DashboardCardProps = {
  children: ReactNode;
  className?: string;
  title?: string;
  eyebrow?: string;
  tone?: "cyan" | "red" | "green" | "amber";
};

const toneClass = {
  cyan: "cyber-panel",
  red: "cyber-panel cyber-panel-danger",
  green: "cyber-panel cyber-panel-success",
  amber: "cyber-panel cyber-panel-warning",
};

export function DashboardCard({
  children,
  className = "",
  title,
  eyebrow,
  tone = "cyan",
}: DashboardCardProps) {
  return (
    <section className={`${toneClass[tone]} rounded-lg p-4 ${className}`}>
      {(title || eyebrow) && (
        <header className="mb-4 flex items-start justify-between gap-3">
          <div>
            {eyebrow && (
              <p className="font-digital text-[10px] uppercase tracking-[0.24em] text-cyan-200/55">
                {eyebrow}
              </p>
            )}
            {title && (
              <h2 className="mt-1 text-sm font-semibold uppercase tracking-[0.12em] text-slate-100">
                {title}
              </h2>
            )}
          </div>
          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(0,240,255,0.9)]" />
        </header>
      )}
      {children}
    </section>
  );
}
