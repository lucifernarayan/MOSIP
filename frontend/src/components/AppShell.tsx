import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen overflow-hidden bg-[#030307] text-slate-100">
      <div className="starfield fixed inset-0 opacity-40" />
      <div className="fixed inset-0 cyber-grid opacity-70" />
      <div className="scanline" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(31,182,255,0.13),transparent_34%),radial-gradient(circle_at_85%_75%,rgba(16,185,129,0.08),transparent_28%)]" />
      <Sidebar />
      <main className="relative z-10 pt-[120px] lg:pl-[280px] lg:pt-0">
        {children}
      </main>
    </div>
  );
}
