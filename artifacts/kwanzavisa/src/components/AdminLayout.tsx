import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAdminGetStats, getAdminGetStatsQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LayoutDashboard, ShoppingCart, Users, Coins, BarChart3, Wallet, LogOut } from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  actions?: React.ReactNode;
}

export function AdminLayout({ children, title, actions }: AdminLayoutProps) {
  const [, setLocation] = useLocation();
  const [location] = useLocation();
  
  // To handle the red badge on Pedidos
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
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-[#1D1D1F] text-white flex flex-col fixed h-full z-10">
        <div className="p-6">
          <Link href="/admin">
            <h2 className="text-xl font-bold tracking-tight cursor-pointer">KwanzaVisa Admin</h2>
          </Link>
        </div>
        
        <nav className="flex-1 px-4 space-y-1 mt-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            // Exact match for dashboard, prefix match for others
            const isActive = item.href === "/admin" 
              ? location === "/admin" 
              : location.startsWith(item.href);
              
            return (
              <Link key={item.href} href={item.href}>
                <div className={`flex items-center justify-between px-3 py-2.5 rounded-md cursor-pointer transition-colors text-sm font-medium ${isActive ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="w-2 h-2 rounded-full bg-[#FF3B30]"></span>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-sm text-gray-400">Administrador</span>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="text-gray-400 hover:text-white hover:bg-white/10 h-8 w-8">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 flex flex-col min-h-screen">
        <header className="h-16 px-8 flex items-center justify-between border-b bg-white sticky top-0 z-10">
          <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
          <div className="flex items-center gap-4">
            {actions}
          </div>
        </header>
        
        <div className="p-8 flex-1">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
