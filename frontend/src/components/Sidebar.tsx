"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Cpu, RadioTower } from "lucide-react";
import { navItems } from "@/utils/mosip-data";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="cyber-panel fixed inset-x-0 top-0 z-40 border-x-0 border-t-0 px-3 py-3 lg:inset-y-0 lg:left-0 lg:right-auto lg:w-[280px] lg:border-y-0 lg:border-l-0 lg:px-5 lg:py-6">
      <div className="flex items-center justify-between gap-3 lg:block">
        <Link href="/" className="group flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-md border border-cyan-300/30 bg-cyan-300/10 text-cyan-200 shadow-[0_0_24px_rgba(0,240,255,0.12)]">
            <RadioTower size={20} />
          </div>
          <div>
            <p className="font-digital text-[10px] uppercase tracking-[0.28em] text-cyan-200/70">
              MOSIP
            </p>
            <h1 className="text-sm font-semibold uppercase tracking-[0.18em] text-white">
              Orbital Intel
            </h1>
          </div>
        </Link>

        <div className="hidden items-center gap-2 rounded-md border border-emerald-300/20 bg-emerald-300/10 px-2.5 py-1.5 font-digital text-[10px] uppercase tracking-[0.2em] text-emerald-200 sm:flex lg:mt-6 lg:w-full lg:justify-center">
          <Cpu size={13} />
          Graph Online
        </div>
      </div>

      <nav className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:mt-8 lg:flex-col lg:overflow-visible lg:pb-0">
        {navItems.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex min-w-[176px] items-center gap-3 rounded-md border px-3 py-3 transition lg:min-w-0 ${
                active
                  ? "border-cyan-300/35 bg-cyan-300/12 text-white shadow-[0_0_22px_rgba(0,240,255,0.08)]"
                  : "border-white/5 bg-white/[0.025] text-slate-400 hover:border-cyan-300/20 hover:bg-cyan-300/8 hover:text-slate-100"
              }`}
            >
              <Icon size={18} className={active ? "text-cyan-200" : "text-slate-500"} />
              <span className="min-w-0">
                <span className="block truncate text-xs font-semibold uppercase tracking-[0.12em]">
                  {item.label}
                </span>
                <span className="mt-0.5 block truncate font-digital text-[10px] uppercase tracking-[0.16em] text-slate-500">
                  {item.eyebrow}
                </span>
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
