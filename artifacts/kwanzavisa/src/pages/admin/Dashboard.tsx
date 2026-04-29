import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
    const statusMap: Record<string, { label: string; className: string }> = {
      pendente: { label: "Pendente", className: "bg-yellow-100 text-yellow-800" },
      em_contacto: { label: "Em Contacto", className: "bg-blue-100 text-blue-800" },
      aguarda_pagamento: { label: "Aguarda Pagamento", className: "bg-orange-100 text-orange-800" },
      pago: { label: "Pago", className: "bg-green-100 text-green-800" },
      em_processamento: { label: "Em Processamento", className: "bg-purple-100 text-purple-800" },
      concluido: { label: "Concluído", className: "bg-gray-800 text-white" },
      cancelado: { label: "Cancelado", className: "bg-red-100 text-red-800" },
    };
    const mapped = statusMap[status] || { label: status, className: "bg-gray-100 text-gray-800" };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${mapped.className}`}>{mapped.label}</span>;
  };

  const getServiceLabel = (service: string) => {
    const map: Record<string, string> = {
      cartao_virtual: "Cartão Virtual",
      acesso_assistido: "Acesso Assistido",
      transferencia: "Transferência",
      conta_internacional: "Conta Internacional"
    };
    return map[service] || service;
  };

  return (
    <AdminLayout title="Dashboard">
      <div className="space-y-8">
        
        {/* Câmbio */}
        <Card className="border-border">
          <CardHeader className="bg-gray-50/50 border-b">
            <CardTitle className="text-lg">Gestão de Câmbio</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="max-w-sm">
              <label className="text-sm font-medium mb-2 block">Câmbio USD → Kz</label>
              <div className="flex items-center gap-2">
                <Input 
                  type="number" 
                  placeholder={`Activo: ${exchangeRates?.activeUsd || '---'}`} 
                  value={usdRateInput}
                  onChange={e => setUsdRateInput(e.target.value)}
                />
                <Button onClick={() => handleUpdateRate(usdRateInput)} className="bg-[#1D1D1F]">Guardar</Button>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t text-sm text-gray-500">
              Câmbio activo: 1 USD = <strong className="text-gray-900">{exchangeRates?.activeUsd || '---'} Kz</strong>
            </div>
          </CardContent>
        </Card>

        {/* Metrics */}
        {stats && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Métricas Operacionais</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card><CardContent className="pt-6"><p className="text-sm text-gray-500 mb-1">Pedidos hoje</p><p className="text-3xl font-semibold">{stats.ordersToday}</p></CardContent></Card>
              <Card><CardContent className="pt-6"><p className="text-sm text-gray-500 mb-1">Pedidos esta semana</p><p className="text-3xl font-semibold">{stats.ordersThisWeek}</p></CardContent></Card>
              <Card><CardContent className="pt-6"><p className="text-sm text-gray-500 mb-1">Pedidos este mês</p><p className="text-3xl font-semibold">{stats.ordersThisMonth}</p></CardContent></Card>
              <Card className={stats.pendingOrders > 0 ? "border-[#FF3B30]/30 bg-[#FF3B30]/5" : ""}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div><p className="text-sm text-gray-500 mb-1">Pendentes</p><p className="text-3xl font-semibold">{stats.pendingOrders}</p></div>
                    {stats.pendingOrders > 0 && <span className="flex h-3 w-3 rounded-full bg-[#FF3B30] mt-2"></span>}
                  </div>
                </CardContent>
              </Card>
            </div>

            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mt-8">Métricas Financeiras</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card><CardContent className="pt-6"><p className="text-sm text-gray-500 mb-1">Volume USD (mês)</p><p className="text-2xl font-semibold">${stats.volumeUsdThisMonth?.toLocaleString() || 0}</p></CardContent></Card>
              <Card><CardContent className="pt-6"><p className="text-sm text-gray-500 mb-1">Volume Kz (mês)</p><p className="text-2xl font-semibold">{stats.volumeKwanzaThisMonth?.toLocaleString() || 0} Kz</p></CardContent></Card>
              <Card><CardContent className="pt-6"><p className="text-sm text-gray-500 mb-1">Total concluídos</p><p className="text-2xl font-semibold">{stats.completedOrders}</p></CardContent></Card>
              <Card><CardContent className="pt-6"><p className="text-sm text-gray-500 mb-1">Total clientes</p><p className="text-2xl font-semibold">{stats.totalClients}</p></CardContent></Card>
            </div>
          </div>
        )}

        {/* Charts and Tables */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pedidos nos últimos 30 dias</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {dailyStats?.days ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyStats.days}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dx={-10} allowDecimals={false} />
                      <RechartsTooltip 
                        contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                        formatter={(value) => [`${value} pedidos`, 'Total']}
                        labelFormatter={(label) => `Data: ${label}`}
                      />
                      <Line type="monotone" dataKey="count" stroke="#1D1D1F" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6, stroke: '#1D1D1F', strokeWidth: 0, fill: '#1D1D1F' }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400">A carregar dados...</div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Pedidos Recentes</CardTitle>
              <Link href="/admin/pedidos" className="text-sm font-medium text-blue-600 hover:underline">Ver todos</Link>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">ID</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Serviço</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentOrdersData?.orders?.map(order => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-xs text-gray-500">{order.id.slice(0, 8)}</TableCell>
                      <TableCell className="font-medium">{order.name}</TableCell>
                      <TableCell className="text-sm">{getServiceLabel(order.service)}</TableCell>
                      <TableCell className="text-sm">
                        {order.amountUsd ? `$${order.amountUsd}` : order.amountKwanza ? `${order.amountKwanza.toLocaleString()} Kz` : ''}
                      </TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                    </TableRow>
                  ))}
                  {(!recentOrdersData?.orders || recentOrdersData.orders.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">Nenhum pedido recente</TableCell>
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
