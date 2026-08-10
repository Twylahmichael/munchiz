import { type ReactNode, useEffect, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, UtensilsCrossed, Tag, ShoppingCart, Settings, LogOut, ArrowLeft,
  Users, Truck, Store, Zap, Package, BarChart3, DollarSign, Megaphone, Plus,
  Award, Gift, Headphones, MapPin, Building2, Receipt, TrendingUp,
  ChefHat, Calendar, Target, Wallet, CreditCard, FileText,
  PanelLeftClose, PanelLeft, Bell, ClipboardList, UserPlus
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const SIDEBAR_SECTIONS = [
  {
    title: "Overview",
    items: [
      { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    title: "Menu & Products",
    items: [
      { to: "/admin/meals", label: "Meals", icon: UtensilsCrossed },
      { to: "/admin/addons", label: "Add-ons", icon: Plus },
      { to: "/admin/deals", label: "Deals", icon: Tag },
      { to: "/admin/bundles", label: "Bundles", icon: Package },
      { to: "/admin/flash-sales", label: "Flash Sales", icon: Zap },
    ],
  },
  {
    title: "Orders & Operations",
    items: [
      { to: "/admin/orders", label: "Orders", icon: ShoppingCart },
      { to: "/admin/kitchen", label: "Kitchen", icon: ChefHat },
      { to: "/admin/drivers", label: "Drivers", icon: Truck },
      { to: "/admin/operations", label: "Operations", icon: ClipboardList },
    ],
  },
  {
    title: "Customers & Marketing",
    items: [
      { to: "/admin/users", label: "Users", icon: Users },
      { to: "/admin/rewards", label: "Rewards", icon: Award },
      { to: "/admin/promos", label: "Promos", icon: Gift },
      { to: "/admin/campaigns", label: "Campaigns", icon: Megaphone },
      { to: "/admin/leads", label: "Customer Leads", icon: UserPlus },
      { to: "/admin/support", label: "Support", icon: Headphones },
    ],
  },
  {
    title: "Finance & Reports",
    items: [
      { to: "/admin/sales", label: "Sales", icon: BarChart3 },
      { to: "/admin/financial", label: "Financial", icon: TrendingUp },
      { to: "/admin/expenses", label: "Expenses", icon: Receipt },
      { to: "/admin/payments", label: "Payments", icon: CreditCard },
      { to: "/admin/revenue", label: "Revenue", icon: DollarSign },
      { to: "/admin/reports", label: "Reports", icon: FileText },
    ],
  },
  {
    title: "Settings & Config",
    items: [
      { to: "/admin/vendors", label: "Vendors", icon: Store },
      { to: "/admin/zones", label: "Zones", icon: MapPin },
      { to: "/admin/branches", label: "Branches", icon: Building2 },
      { to: "/admin/pricing", label: "Pricing", icon: Wallet },
      { to: "/admin/settings", label: "Settings", icon: Settings },
    ],
  },
] as const;

export function AdminLayout({ children }: { children: ReactNode }) {
  const { user, profile, loading, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/admin/login" });
    } else if (!loading && user && !isAdmin) {
      navigate({ to: "/" });
    }
  }, [loading, user, isAdmin, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1714] flex items-center justify-center">
        <div className="animate-pulse text-amber-400 text-lg font-display">Loading...</div>
      </div>
    );
  }

  if (!user || !isAdmin) return null;

  function isActive(to: string) {
    if (to === "/admin") return currentPath === "/admin";
    return currentPath.startsWith(to);
  }

  const sidebar = (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        {!collapsed && (
          <div>
            <span className="text-xl font-display text-amber-400 tracking-wider">MUNCHIZ</span>
            <p className="text-white/40 text-[10px] uppercase tracking-widest">Admin Panel</p>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/50 hidden md:block"
        >
          {collapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-2 space-y-4 scrollbar-none">
        {SIDEBAR_SECTIONS.map((section) => (
          <div key={section.title}>
            {!collapsed && (
              <p className="px-3 py-1 text-[10px] uppercase tracking-widest text-white/30 font-semibold">
                {section.title}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(item.to);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? "bg-amber-500/20 text-amber-400"
                        : "text-white/60 hover:bg-white/5 hover:text-white"
                    }`}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon size={18} className="shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-white/10 space-y-1">
        <Link
          to="/"
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-white/60 hover:bg-white/5 hover:text-white transition-colors"
        >
          <ArrowLeft size={18} />
          {!collapsed && <span>Back to Store</span>}
        </Link>
        <button
          onClick={() => signOut()}
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-white/60 hover:bg-red-500/20 hover:text-red-400 transition-colors w-full"
        >
          <LogOut size={18} />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#1a1714] flex">
      <aside className={`hidden md:flex ${collapsed ? "w-16" : "w-60"} bg-[#141210] text-white flex-col transition-all duration-200 border-r border-white/5`}>
        {sidebar}
      </aside>

      {mobileOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setMobileOpen(false)} />
          <aside className="fixed left-0 top-0 bottom-0 w-60 bg-[#141210] text-white z-50 md:hidden">
            {sidebar}
          </aside>
        </>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-[#1e1b17] border-b border-white/5 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden text-white/60 hover:text-white p-1"
            >
              <PanelLeft size={20} />
            </button>
            <h1 className="text-white/80 font-semibold text-sm md:hidden">MUNCHIZ Admin</h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 text-white/40 hover:text-white transition-colors">
              <Bell size={18} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-sm font-bold text-black">
                {(profile?.full_name || "A")[0].toUpperCase()}
              </div>
              <span className="text-sm text-white/60 hidden md:block">
                {profile?.full_name || "Admin"}
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
