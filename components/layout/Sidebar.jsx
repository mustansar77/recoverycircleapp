"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import {
  LayoutDashboard, Users, ShoppingBag, ClipboardList,
  Video, Award, LogOut, Coins, Heart, Gift,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const NAV = {
  superadmin: [
    { href: "/superadmin",           icon: LayoutDashboard, label: "Dashboard" },
    { href: "/superadmin/users",     icon: Users,           label: "Users" },
    { href: "/superadmin/store",     icon: ShoppingBag,     label: "Store" },
    { href: "/superadmin/orders",    icon: ClipboardList,   label: "Orders" },
    { href: "/superadmin/requests",  icon: Coins,           label: "Requests" },
    { href: "/superadmin/meetings",  icon: Video,           label: "Meetings" },
  ],
  admin: [
    { href: "/admin",          icon: LayoutDashboard, label: "Dashboard" },
    { href: "/admin/meetings", icon: Video,           label: "Meetings" },
    { href: "/admin/rewards",  icon: Gift,            label: "Give Rewards" },
  ],
  guide: [
    { href: "/guide",          icon: LayoutDashboard, label: "Dashboard" },
    { href: "/guide/meetings", icon: Video,           label: "My Meetings" },
    { href: "/guide/store",    icon: ShoppingBag,     label: "Store" },
  ],
  user: [
    { href: "/user",                icon: LayoutDashboard, label: "Dashboard" },
    { href: "/user/meetings",       icon: Video,           label: "Meetings" },
    { href: "/user/store",          icon: ShoppingBag,     label: "Store" },
    { href: "/user/certification",  icon: Award,           label: "Certification" },
  ],
};

const ROLE_LABEL = {
  superadmin: "Super Admin",
  admin: "Administrator",
  guide: "Guide",
  user: "Member",
};

export default function Sidebar({ role }) {
  const pathname = usePathname();
  const router = useRouter();
  const links = NAV[role] ?? NAV.user;

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <aside
      className="flex w-60 flex-shrink-0 flex-col"
      style={{
        backgroundColor: "var(--surface)",
        borderRight: "1px solid var(--border)",
      }}
    >
      {/* Logo */}
      <div
        className="flex h-14 items-center gap-3 px-5"
        style={{ borderBottom: "1px solid var(--border-sub)" }}
      >
        <div
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg shadow-md"
          style={{ background: "linear-gradient(135deg, #3b82f6, #2563eb)" }}
        >
          <Heart size={15} className="text-white" fill="white" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold leading-tight truncate" style={{ color: "var(--text)" }}>
            RecoveryCircle
          </p>
          <p className="text-xs leading-tight" style={{ color: "var(--text-3)" }}>
            {ROLE_LABEL[role] ?? "Member"}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        <p className="px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
          Navigation
        </p>
        {links.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || (href !== `/${role}` && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                isActive ? "shadow-sm" : "hover:bg-[color:var(--hover)]"
              )}
              style={
                isActive
                  ? { backgroundColor: "var(--blue-bg)", color: "var(--blue-light)", border: "1px solid var(--blue-border)" }
                  : { color: "var(--text-2)", border: "1px solid transparent" }
              }
            >
              <Icon size={16} className="flex-shrink-0" />
              <span className="truncate">{label}</span>
              {isActive && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: "var(--blue)" }} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-3" style={{ borderTop: "1px solid var(--border-sub)" }}>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all"
          style={{ color: "var(--text-3)", border: "1px solid transparent" }}
          onMouseEnter={e => {
            e.currentTarget.style.backgroundColor = "var(--red-bg)";
            e.currentTarget.style.color = "var(--red)";
            e.currentTarget.style.borderColor = "var(--red-border)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.color = "var(--text-3)";
            e.currentTarget.style.borderColor = "transparent";
          }}
        >
          <LogOut size={16} className="flex-shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
