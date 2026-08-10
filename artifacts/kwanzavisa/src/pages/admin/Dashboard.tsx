import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { 
  useAdminGetStats, 
  useAdminGetDailyStats, 
  useAdminListOrders, 
  useAdminGetExchangeRates,
  useAdminSetExchangeRate,
  getAdminGetExchangeRatesQueryKey,
  getAdminGetStatsQueryKey,
  getAdminGetDailyStatsQueryKey,
  getAdminListOrdersQueryKey
} from "@workspace/api-client-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";
import { ArrowUpRight, TrendingUp, DollarSign, Users, ShoppingBag, Clock } from "lucide-react";

export default function Dashboard() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [usdRateInput, setUsdRateInput] = useState("");

  const isAuthenticated = localStorage.getItem('kv_admin_auth') === 'true';

  const { data: exchangeRates } = useAdminGetExchangeRates({
    query: { enabled: isAuthenticated, queryKey: getAdminGetExchangeRatesQueryKey() }
  });

  const { data: stats } = useAdminGetStats({
    query: { enabled: isAuthenticated, queryKey: getAdminGetStatsQueryKey() }
  });

  const { data: dailyStats } = useAdminGetDailyStats(
    { days: 30 },
    { query: { enabled: isAuthenticated, queryKey: getAdminGetDailyStatsQueryKey({ days: 30 }) } }
  );

  const { data: recentOrdersData } = useAdminListOrders(
    { limit: 10 },
    { query: { enabled: isAuthenticated, queryKey: getAdminListOrdersQueryKey({ limit: 10 }) } }
  );

  const setExchangeRate = useAdminSetExchangeRate();

  const handleUpdateRate = (rateStr: string): void => {
    const rate = parseFloat(rateStr);
    if (isNaN(rate) || rate <= 0) {
      toast({ title: "Valor inválido", variant: "destructive" });
      return;
    }
    
    setExchangeRate.mutate(
      { data: { currency: "USD", rate, changedBy: "Administrador" } },
      {
        onSuccess: () => {
          toast({ title: "Câmbio USD actualizado com sucesso" });
          setUsdRateInput("");
          queryClient.invalidateQueries({ queryKey: getAdminGetExchangeRatesQueryKey() });
        },
        onError: () => {
          toast({ title: "Erro ao actualizar câmbio USD", variant: "destructive" });
        }
      }
    );
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; bg: string; text: string; border: string }> = {
      pendente: { label: "Pendente", bg: "bg-yellow-500/10", text: "text-yellow-400", border: "border-yellow-500/20" },
      em_contacto: { label: "Em Contacto", bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20" },
      aguarda_pagamento: { label: "Aguarda Pagamento", bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" },
      comprovativo_enviado: { label: "A Verificar Pagamento", bg: "bg-violet-500/20", text: "text-violet-300 font-bold", border: "border-violet-500/40" },
      pago: { label: "Pago", bg: "bg-green-500/10", text: "text-green-400", border: "border-green-500/20" },
      em_processamento: { label: "Em Processamento", bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/20" },
      concluido: { label: "Concluído", bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
      cancelado: { label: "Cancelado", bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20" },
    };
    const mapped = statusMap[status] || { label: status, bg: "bg-white/5", text: "text-white/70", border: "border-white/10" };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${mapped.bg} ${mapped.text} ${mapped.border}`}>
        {mapped.label}
      </span>
    );
  };

  const getServiceLabel = (service: string) => {
    const map: Record<string, string> = {
      cartao_virtual: "Cartão Virtual",
      acesso_assistido: "Acesso Assistido",
      transferencia: "Transferência",
    };
    return map[service] || service;
  };

  return (
    <AdminLayout title="Visão Geral & Dashboard">
      <div className="space-y-8">
        
        {/* Câmbio Quick Bar */}
        <Card className="bg-[#12121A] border-white/10 text-white rounded-2xl shadow-xl overflow-hidden">
          <CardHeader className="bg-white/5 border-b border-white/10 py-4 px-6">
            <CardTitle className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#A78BFA]" />
              Gestão de Taxa de Câmbio
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div>
                <p className="text-xs text-white/50 uppercase tracking-wider font-semibold mb-1">Câmbio Activo USD → Kz</p>
                <div className="text-3xl font-extrabold text-[#A78BFA] font-heading">
                  1 USD = {exchangeRates?.activeUsd || '---'} Kz
                </div>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Input 
                  type="number" 
                  placeholder="Nova taxa (ex: 960)" 
                  value={usdRateInput}
                  onChange={e => setUsdRateInput(e.target.value)}
                  className="bg-[#0A0A0F] border-white/10 text-white h-11 rounded-xl text-sm w-44 focus-visible:ring-[#7C3AED]"
                />
                <Button onClick={() => handleUpdateRate(usdRateInput)} className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white h-11 px-5 rounded-xl font-semibold text-sm border-0">
                  Actualizar Taxa
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Metrics */}
        {stats && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider">Métricas Operacionais</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-[#12121A] border-white/10 text-white rounded-2xl p-5 shadow-lg">
                <div className="flex items-center justify-between text-white/50 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Pedidos Hoje</span>
                  <Clock className="w-4 h-4 text-[#A78BFA]" />
                </div>
                <p className="text-3xl font-extrabold text-white font-heading">{stats.ordersToday}</p>
              </Card>

              <Card className="bg-[#12121A] border-white/10 text-white rounded-2xl p-5 shadow-lg">
                <div className="flex items-center justify-between text-white/50 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Esta Semana</span>
                  <ShoppingBag className="w-4 h-4 text-[#A78BFA]" />
                </div>
                <p className="text-3xl font-extrabold text-white font-heading">{stats.ordersThisWeek}</p>
              </Card>

              <Card className="bg-[#12121A] border-white/10 text-white rounded-2xl p-5 shadow-lg">
                <div className="flex items-center justify-between text-white/50 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Este Mês</span>
                  <ShoppingBag className="w-4 h-4 text-[#A78BFA]" />
                </div>
                <p className="text-3xl font-extrabold text-white font-heading">{stats.ordersThisMonth}</p>
              </Card>

              <Card className={`bg-[#12121A] rounded-2xl p-5 shadow-lg border ${stats.pendingOrders > 0 ? "border-amber-500/40 bg-amber-500/5" : "border-white/10"}`}>
                <div className="flex items-center justify-between text-white/50 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">A Aguardar Acção</span>
                  {stats.pendingOrders > 0 && <span className="flex h-2.5 w-2.5 rounded-full bg-amber-400 animate-ping"></span>}
                </div>
                <p className="text-3xl font-extrabold text-amber-300 font-heading">{stats.pendingOrders}</p>
              </Card>
            </div>

            <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider mt-8">Métricas Financeiras & Clientes</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-[#12121A] border-white/10 text-white rounded-2xl p-5 shadow-lg">
                <div className="flex items-center justify-between text-white/50 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Volume USD (Mês)</span>
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-2xl font-bold text-emerald-400 font-heading">${stats.volumeUsdThisMonth?.toLocaleString() || 0}</p>
              </Card>

              <Card className="bg-[#12121A] border-white/10 text-white rounded-2xl p-5 shadow-lg">
                <div className="flex items-center justify-between text-white/50 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Volume Kz (Mês)</span>
                  <TrendingUp className="w-4 h-4 text-[#A78BFA]" />
                </div>
                <p className="text-2xl font-bold text-white font-heading">{stats.volumeKwanzaThisMonth?.toLocaleString('pt-PT') || 0} Kz</p>
              </Card>

              <Card className="bg-[#12121A] border-white/10 text-white rounded-2xl p-5 shadow-lg">
                <div className="flex items-center justify-between text-white/50 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Concluídos</span>
                  <ShoppingBag className="w-4 h-4 text-[#A78BFA]" />
                </div>
                <p className="text-2xl font-bold text-white font-heading">{stats.completedOrders}</p>
              </Card>

              <Card className="bg-[#12121A] border-white/10 text-white rounded-2xl p-5 shadow-lg">
                <div className="flex items-center justify-between text-white/50 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Total Clientes</span>
                  <Users className="w-4 h-4 text-[#A78BFA]" />
                </div>
                <p className="text-2xl font-bold text-white font-heading">{stats.totalClients}</p>
              </Card>
            </div>
          </div>
        )}

        {/* Charts and Tables */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Chart */}
          <Card className="bg-[#12121A] border-white/10 text-white rounded-2xl shadow-xl overflow-hidden">
            <CardHeader className="bg-white/5 border-b border-white/10 py-4 px-6">
              <CardTitle className="text-base font-bold text-white">Evolução de Pedidos (30 dias)</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-[280px]">
                {dailyStats?.days ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyStats.days}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }} dx={-10} allowDecimals={false} />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#0A0A0F', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }}
                        formatter={(value) => [`${value} pedidos`, 'Total']}
                        labelFormatter={(label) => `Data: ${label}`}
                      />
                      <Line type="monotone" dataKey="count" stroke="#7C3AED" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#7C3AED' }} activeDot={{ r: 6, stroke: '#A78BFA', strokeWidth: 2, fill: '#7C3AED' }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-white/30">A carregar gráfico...</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Orders */}
          <Card className="bg-[#12121A] border-white/10 text-white rounded-2xl shadow-xl overflow-hidden">
            <CardHeader className="bg-white/5 border-b border-white/10 py-4 px-6 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-bold text-white">Pedidos Recentes</CardTitle>
              <Link href="/admin/pedidos" className="text-xs font-semibold text-[#A78BFA] hover:text-white flex items-center gap-1 transition-colors">
                Ver todos <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-white/[0.02]">
                  <TableRow className="border-b border-white/10 hover:bg-transparent">
                    <TableHead className="text-xs text-white/40 uppercase tracking-wider font-bold">ID</TableHead>
                    <TableHead className="text-xs text-white/40 uppercase tracking-wider font-bold">Cliente</TableHead>
                    <TableHead className="text-xs text-white/40 uppercase tracking-wider font-bold">Serviço</TableHead>
                    <TableHead className="text-xs text-white/40 uppercase tracking-wider font-bold">Valor</TableHead>
                    <TableHead className="text-xs text-white/40 uppercase tracking-wider font-bold">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentOrdersData?.orders?.map(order => (
                    <TableRow key={order.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                      <TableCell className="font-mono text-xs font-bold text-[#A78BFA]">{order.id}</TableCell>
                      <TableCell className="font-medium text-sm text-white">{order.name}</TableCell>
                      <TableCell className="text-sm text-white/70">{getServiceLabel(order.service)}</TableCell>
                      <TableCell className="text-sm text-white font-medium">
                        {order.amountUsd ? `$${order.amountUsd}` : order.amountKwanza ? `${order.amountKwanza.toLocaleString('pt-PT')} Kz` : '-'}
                      </TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                    </TableRow>
                  ))}
                  {(!recentOrdersData?.orders || recentOrdersData.orders.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10 text-white/40">Nenhum pedido recente</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

      </div>
    </AdminLayout>
  );
}
