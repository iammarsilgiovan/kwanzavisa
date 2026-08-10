import React from "react";
import { Link, useLocation } from "wouter";
import { useAdminGetStats, getAdminGetStatsQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, ShoppingCart, Users, Coins, BarChart3, Wallet, LogOut, ArrowLeft } from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  actions?: React.ReactNode;
}

export function AdminLayout({ children, title, actions }: AdminLayoutProps) {
  const [, setLocation] = useLocation();
  const [location] = useLocation();
  
  const { data: statsData } = useAdminGetStats({ 
    query: { 
      queryKey: getAdminGetStatsQueryKey(),
      enabled: localStorage.getItem('kv_admin_auth') === 'true',
      refetchInterval: 30000 
    } 
  });
  
  const pendingCount = statsData?.pendingOrders || 0;

  const handleLogout = () => {
    localStorage.removeItem('kv_admin_auth');
    localStorage.removeItem('kv_admin_auth_token');
    setLocation("/");
  };

  const navItems = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/pedidos", label: "Pedidos", icon: ShoppingCart, badge: pendingCount > 0 },
    { href: "/admin/clientes", label: "Clientes", icon: Users },
    { href: "/admin/cambio", label: "Câmbio", icon: Coins },
    { href: "/admin/relatorios", label: "Relatórios", icon: BarChart3 },
    { href: "/admin/saldos", label: "Saldos", icon: Wallet },
  ];

  return (
    <div className="min-h-screen flex bg-[#0A0A0F] text-white selection:bg-[#7C3AED] selection:text-white font-sans bg-grid">
      {/* Sidebar */}
      <aside className="w-64 bg-[#12121A]/90 backdrop-blur-xl border-r border-white/10 text-white flex flex-col fixed h-full z-20">
        <div className="p-6 flex items-center justify-between border-b border-white/5">
          <Link href="/admin">
            <div className="flex items-center gap-3 cursor-pointer">
              <div className="relative w-8 h-8 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#9F67F5] flex items-center justify-center font-bold text-white shadow-md shadow-[#7C3AED]/20">
                Z
              </div>
              <div>
                <h2 className="text-lg font-bold tracking-tight font-heading leading-none">ZYVA</h2>
                <span className="text-[10px] text-[#A78BFA] font-medium tracking-wider uppercase">Painel Admin</span>
              </div>
            </div>
          </Link>
        </div>
        
        <nav className="flex-1 px-3 space-y-1.5 mt-6">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.href === "/admin" 
              ? location === "/admin" || location === "/admin/dashboard"
              : location.startsWith(item.href);
              
            return (
              <Link key={item.href} href={item.href}>
                <div 
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-pointer transition-all duration-200 text-sm font-medium ${
                    isActive 
                      ? 'bg-[#7C3AED] text-white shadow-lg shadow-[#7C3AED]/25 font-semibold' 
                      : 'text-white/60 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-white/60'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-pulse"></span>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center justify-between px-3 py-2 bg-white/5 rounded-xl border border-white/5">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-7 h-7 rounded-full bg-[#7C3AED]/30 text-[#A78BFA] flex items-center justify-center text-xs font-bold shrink-0">
                A
              </div>
              <span className="text-xs text-white/70 truncate font-medium">Admin ZYVA</span>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="text-white/50 hover:text-red-400 hover:bg-white/5 h-8 w-8 rounded-lg shrink-0">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
          <Link href="/" className="mt-3 text-xs text-white/40 hover:text-white/70 flex items-center gap-1.5 justify-center py-1 transition-colors">
            <ArrowLeft className="w-3 h-3" /> Ir para o Site Principal
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 flex flex-col min-h-screen">
        <header className="h-16 px-8 flex items-center justify-between border-b border-white/10 bg-[#0A0A0F]/80 backdrop-blur-xl sticky top-0 z-10">
          <h1 className="text-xl font-bold text-white font-heading">{title}</h1>
          <div className="flex items-center gap-4">
            {actions}
          </div>
        </header>
        
        <div className="p-8 flex-1">
          <div className="max-w-6xl mx-auto space-y-6">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
