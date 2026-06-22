"use client";

import { clsx } from "clsx";
import {
  BarChart3,
  Bell,
  BotMessageSquare,
  CreditCard,
  FileText,
  LayoutDashboard,
  LogOut,
  Palette,
  Search,
  Settings,
  Sparkles,
  Shield,
  Users
} from "lucide-react";
import type { ReactNode } from "react";
import type { ApiMember, ApiSession, ApiTenantBranding } from "@/lib/api-client";
import { AdminMobileNavigation } from "./AdminMobileNavigation";
import type { AdminView } from "./admin-view";

type AdminShellProps = {
  activeView: AdminView;
  branding: ApiTenantBranding | null;
  children: ReactNode;
  documentCount: number;
  isLoading: boolean;
  memberCount: number;
  members: ApiMember[];
  onLogout?: () => void;
  onViewChange: (view: AdminView) => void;
  session: ApiSession;
};

const navItems: Array<{
  icon: typeof LayoutDashboard;
  id: AdminView;
  label: string;
}> = [
  { icon: LayoutDashboard, id: "overview", label: "Overview" },
  { icon: FileText, id: "documents", label: "Documents" },
  { icon: BotMessageSquare, id: "chat", label: "Chat" },
  { icon: Users, id: "users", label: "Users" },
  { icon: BarChart3, id: "analytics", label: "Analytics" },
  { icon: CreditCard, id: "billing", label: "Billing" },
  { icon: Palette, id: "branding", label: "Branding" },
  { icon: Shield, id: "platform", label: "Platform" },
  { icon: Settings, id: "settings", label: "Settings" }
];

const viewLabels: Record<AdminView, string> = {
  analytics: "Analytics",
  billing: "Billing",
  branding: "Branding",
  chat: "Chat",
  documents: "Documents",
  overview: "Overview",
  platform: "Platform",
  settings: "Settings",
  users: "Users"
};

export function AdminShell({
  activeView,
  branding,
  children,
  documentCount,
  isLoading,
  memberCount,
  members,
  onLogout,
  onViewChange,
  session
}: AdminShellProps) {
  const workspaceName = branding?.portalName || "Relay workspace";
  const currentUser = members.find((member) => member.id === session.userId);
  const userName = currentUser?.name ?? "Admin user";
  const tenantShortName = workspaceName.split(" ")[0] ?? "Tenant";
  const visibleNavItems =
    session.role === "platform_admin"
      ? navItems
      : navItems.filter((item) => item.id !== "platform");

  return (
    <main className="flex min-h-screen bg-[#fbfbfa] text-zinc-950">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-zinc-200 bg-[#f4f4f2] lg:flex">
        <div className="flex h-14 items-center gap-2 border-b border-zinc-200 px-4">
          <BrandMark name={workspaceName} />
          <p className="text-sm font-semibold tracking-normal">Relay</p>
          <div className="ml-auto flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-600 shadow-sm">
            {tenantShortName}
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-4">
          <p className="px-3 pb-2 font-mono text-[10px] uppercase tracking-normal text-zinc-400">
            Workspace
          </p>
          <div className="grid gap-1">
            {visibleNavItems.map((item) => (
              <SidebarButton
                active={activeView === item.id}
                badge={item.id === "documents" ? documentCount : undefined}
                icon={item.icon}
                key={item.id}
                label={item.label}
                onClick={() => onViewChange(item.id)}
              />
            ))}
          </div>

          <p className="mt-6 px-3 pb-2 font-mono text-[10px] uppercase tracking-normal text-zinc-400">
            Product
          </p>
          <SidebarButton
            active={false}
            icon={Sparkles}
            label="Onboarding"
            onClick={() => onViewChange("overview")}
          />
        </nav>

        <div className="border-t border-zinc-200 p-3">
          <div className="flex items-center gap-2 rounded-md px-1 py-1">
            <div className="grid h-8 w-8 place-items-center rounded-full bg-[#c4574b] text-xs font-semibold text-white">
              {initials(userName)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{userName}</p>
              <p className="truncate text-xs text-zinc-500">
                {memberCount} users · {session.role ?? "admin"}
              </p>
            </div>
            {onLogout ? (
              <button
                aria-label="Sign out"
                className="rounded-md p-2 text-zinc-500 transition hover:bg-zinc-200 hover:text-zinc-950"
                type="button"
                onClick={onLogout}
              >
                <LogOut aria-hidden className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-zinc-200 bg-[#fbfbfa]/95 px-4 backdrop-blur">
          <div className="flex min-w-0 items-center gap-2 lg:hidden">
            <BrandMark name={workspaceName} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">Relay</p>
              <p className="truncate text-[11px] text-zinc-500">{viewLabels[activeView]}</p>
            </div>
          </div>
          <div className="hidden min-w-0 text-sm lg:block">
            <span className="text-zinc-500">Workspace</span>
            <span className="px-2 text-zinc-300">/</span>
            <span className="font-medium">{viewLabels[activeView]}</span>
          </div>
          <div className="ml-auto hidden h-9 w-80 items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-400 shadow-sm md:flex">
            <Search aria-hidden className="h-4 w-4" />
            <span>Search anything...</span>
            <span className="ml-auto rounded border border-zinc-200 px-1.5 font-mono text-[10px]">
              ⌘K
            </span>
          </div>
          <span
            className={clsx(
              "rounded-full border px-2 py-1 text-xs font-medium",
              isLoading
                ? "border-amber-200 bg-amber-50 text-amber-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
            )}
          >
            {isLoading ? "Loading" : "Live"}
          </span>
          <button
            aria-label="Notifications"
            className="rounded-md border border-zinc-200 bg-white p-2 text-zinc-500 shadow-sm transition hover:text-zinc-950"
            type="button"
          >
            <Bell aria-hidden className="h-4 w-4" />
          </button>
        </header>

          <AdminMobileNavigation
          activeView={activeView}
          documentCount={documentCount}
          items={visibleNavItems}
          onViewChange={onViewChange}
        />

        <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </div>
      </section>
    </main>
  );
}

function SidebarButton({
  active,
  badge,
  icon: Icon,
  label,
  onClick
}: {
  active: boolean;
  badge?: number;
  icon: typeof LayoutDashboard;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={clsx(
        "flex h-8 w-full items-center gap-2 rounded-md px-3 text-left text-sm transition",
        active
          ? "bg-white text-zinc-950 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_0_0_1px_rgba(0,0,0,0.04)]"
          : "text-zinc-600 hover:bg-zinc-200/70 hover:text-zinc-950"
      )}
      type="button"
      onClick={onClick}
    >
      <Icon aria-hidden className="h-4 w-4 shrink-0" />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {badge !== undefined ? (
        <span className="font-mono text-[11px] text-zinc-400">{badge}</span>
      ) : null}
    </button>
  );
}

function BrandMark({ name }: { name: string }) {
  return (
    <div className="grid h-7 w-7 place-items-center rounded-md bg-zinc-950 font-mono text-[11px] font-semibold text-white">
      {initials(name)}
    </div>
  );
}

function initials(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
