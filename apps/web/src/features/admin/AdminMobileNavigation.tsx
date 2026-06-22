"use client";

import { clsx } from "clsx";
import type { LucideIcon } from "lucide-react";
import type { AdminView } from "./admin-view";

type AdminNavItem = {
  icon: LucideIcon;
  id: AdminView;
  label: string;
};

type AdminMobileNavigationProps = {
  activeView: AdminView;
  documentCount: number;
  items: AdminNavItem[];
  onViewChange: (view: AdminView) => void;
};

export function AdminMobileNavigation({
  activeView,
  documentCount,
  items,
  onViewChange
}: AdminMobileNavigationProps) {
  return (
    <nav
      aria-label="Workspace navigation"
      className="border-b border-zinc-200 bg-[#f4f4f2]/95 px-3 py-2 lg:hidden"
    >
      <div className="flex gap-2 overflow-x-auto pb-1">
        {items.map((item) => (
          <MobileNavButton
            active={activeView === item.id}
            badge={item.id === "documents" ? documentCount : undefined}
            icon={item.icon}
            key={item.id}
            label={item.label}
            onClick={() => onViewChange(item.id)}
          />
        ))}
      </div>
    </nav>
  );
}

function MobileNavButton({
  active,
  badge,
  icon: Icon,
  label,
  onClick
}: {
  active: boolean;
  badge?: number;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={clsx(
        "flex h-9 shrink-0 items-center gap-2 rounded-md border px-3 text-sm transition",
        active
          ? "border-zinc-950 bg-zinc-950 text-white shadow-sm"
          : "border-zinc-200 bg-white text-zinc-600 shadow-sm hover:text-zinc-950"
      )}
      type="button"
      onClick={onClick}
    >
      <Icon aria-hidden className="h-4 w-4" />
      <span>{label}</span>
      {badge !== undefined ? (
        <span
          className={clsx(
            "rounded-full px-1.5 font-mono text-[10px]",
            active ? "bg-white/15 text-white" : "bg-zinc-100 text-zinc-500"
          )}
        >
          {badge}
        </span>
      ) : null}
    </button>
  );
}
