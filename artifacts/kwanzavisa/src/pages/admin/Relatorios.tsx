import React, { useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from "recharts";
import { useAdminGetReports, getAdminGetReportsQueryKey } from "@workspace/api-client-react";
import { TrendingUp, DollarSign, PieChart, ShoppingBag, CheckCircle, XCircle } from "lucide-react";

const MONTHS = [
  { value: "1", label: "Janeiro" },
  { value: "2", label: "Fevereiro" },
  { value: "3", label: "Março" },
  { value: "4", label: "Abril" },
  { value: "5", label: "Maio" },
  { value: "6", label: "Junho" },
  { value: "7", label: "Julho" },
  { value: "8", label: "Agosto" },
  { value: "9", label: "Setembro" },
  { value: "10", label: "Outubro" },
  { value: "11", label: "Novembro" },
  { value: "12", label: "Dezembro" }
];

export default function Relatorios() {
  const currentMonth = (new Date().getMonth() + 1).toString();
  const currentYear = new Date().getFullYear().toString();

  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);

  const isAuthenticated = localStorage.getItem('kv_admin_auth') === 'true';

  const params = { month: parseInt(month), year: parseInt(year) };
  const { data: report, isLoading } = useAdminGetReports(params, {
    query: { enabled: isAuthenticated, queryKey: getAdminGetReportsQueryKey(params) }
  });

  const getServiceLabel = (service: string) => {
    const map: Record<string, string> = {
      cartao_virtual: "Cartão Virtual",
      acesso_assistido: "Acesso Assistido",
      transferencia: "Transferência",
    };
    return map[service] || service;
  };

  const downloadCSV = () => {
    if (!report?.byService) return;
    const headers = ["Serviço", "Pedidos", "Volume Kz", "Receita Bruta", "Custo", "Lucro", "Margem %"];
    const rows = report.byService.map(s => [
      getServiceLabel(s.service),
      s.count,
      s.volumeKwanza,
      s.revenue,
      s.cost,
      s.profit,
      s.margin
    ]);
    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `relatorio_financeiro_${year}_${month}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AdminLayout title="Relatórios Financeiros & Desempenho">
      <Card className="bg-[#12121A] border-white/10 text-white rounded-2xl shadow-xl mb-8">
        <CardContent className="p-5 flex flex-col sm:flex-row items-end gap-4">
          <div className="w-[200px] space-y-1.5">
            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider block">Mês</label>
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger className="bg-[#0A0A0F] border-white/10 text-white h-11 rounded-xl text-sm"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-[#12121A] border-white/10 text-white">
                {MONTHS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="w-[120px] space-y-1.5">
            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider block">Ano</label>
            <Input type="number" value={year} onChange={e => setYear(e.target.value)} className="bg-[#0A0A0F] border-white/10 text-white h-11 rounded-xl text-sm" />
          </div>
          <Button variant="outline" className="ml-auto h-11 border-white/10 text-white hover:bg-white/5 rounded-xl" onClick={downloadCSV} disabled={!report}>
            Exportar CSV
          </Button>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="py-20 text-center text-white/40">A processar relatório...</div>
      ) : report ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-[#12121A] border-white/10 text-white rounded-2xl p-5 shadow-lg">
              <p className="text-xs text-white/40 uppercase tracking-wider font-semibold mb-1">Total Pedidos</p>
              <p className="text-3xl font-extrabold text-white font-heading">{report.totalOrders}</p>
            </Card>
            <Card className="bg-[#12121A] border-white/10 text-white rounded-2xl p-5 shadow-lg">
              <p className="text-xs text-white/40 uppercase tracking-wider font-semibold mb-1">Concluídos</p>
              <p className="text-3xl font-extrabold text-emerald-400 font-heading">{report.completedOrders}</p>
            </Card>
            <Card className="bg-[#12121A] border-white/10 text-white rounded-2xl p-5 shadow-lg">
              <p className="text-xs text-white/40 uppercase tracking-wider font-semibold mb-1">Cancelados</p>
              <p className="text-3xl font-extrabold text-red-400 font-heading">{report.cancelledOrders}</p>
            </Card>
            <Card className="bg-[#12121A] border-white/10 text-white rounded-2xl p-5 shadow-lg">
              <p className="text-xs text-white/40 uppercase tracking-wider font-semibold mb-1">Taxa de Conclusão</p>
              <p className="text-3xl font-extrabold text-[#A78BFA] font-heading">{report.completionRate.toFixed(1)}%</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4">
            <Card className="xl:col-span-2 bg-gradient-to-br from-[#7C3AED]/30 via-[#12121A] to-[#12121A] border border-violet-500/30 text-white rounded-2xl p-6 shadow-xl">
              <p className="text-xs text-violet-300 uppercase tracking-wider font-bold mb-1">Lucro Líquido</p>
              <p className="text-4xl font-black text-white font-heading">{report.netProfit.toLocaleString('pt-PT')} Kz</p>
              <p className="text-xs mt-2 text-emerald-400 font-semibold">Margem global: {report.margin.toFixed(1)}%</p>
            </Card>

            <Card className="bg-[#12121A] border-white/10 text-white rounded-2xl p-5 shadow-lg">
              <p className="text-xs text-white/40 uppercase tracking-wider font-semibold mb-1">Receita Bruta</p>
              <p className="text-xl font-bold text-white font-heading">{report.grossRevenue.toLocaleString('pt-PT')} Kz</p>
            </Card>

            <Card className="bg-[#12121A] border-white/10 text-white rounded-2xl p-5 shadow-lg">
              <p className="text-xs text-white/40 uppercase tracking-wider font-semibold mb-1">Custo Total</p>
              <p className="text-xl font-bold text-red-400 font-heading">{report.totalCost.toLocaleString('pt-PT')} Kz</p>
            </Card>

            <Card className="bg-[#12121A] border-white/10 text-white rounded-2xl p-5 shadow-lg">
              <p className="text-xs text-white/40 uppercase tracking-wider font-semibold mb-1">Volume Kz</p>
              <p className="text-xl font-bold text-white font-heading">{report.volumeKwanza.toLocaleString('pt-PT')} Kz</p>
              <p className="text-[10px] text-white/30 mt-1">excl. cancelados</p>
            </Card>

            <Card className="bg-[#12121A] border-white/10 text-white rounded-2xl p-5 shadow-lg">
              <p className="text-xs text-white/40 uppercase tracking-wider font-semibold mb-1">Volume USD</p>
              <p className="text-xl font-bold text-emerald-400 font-heading">${report.volumeUsd.toLocaleString()}</p>
              <p className="text-[10px] text-white/30 mt-1">excl. cancelados</p>
            </Card>
          </div>

          <Card className="bg-[#12121A] border-white/10 text-white rounded-2xl shadow-xl overflow-hidden">
            <CardHeader className="bg-white/5 border-b border-white/10 py-4 px-6">
              <CardTitle className="text-base font-bold text-white">Financeiro por Semana</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-[340px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={report.weeklyFinancials} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }} tickFormatter={(val) => `${(val/1000).toFixed(0)}k`} />
                    <RechartsTooltip 
                      formatter={(value: number) => [`${value.toLocaleString('pt-PT')} Kz`, '']}
                      contentStyle={{ backgroundColor: '#0A0A0F', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <Bar dataKey="revenue" name="Receita" fill="#A78BFA" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="cost" name="Custo" fill="#EF4444" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="profit" name="Lucro" fill="#10B981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#12121A] border-white/10 text-white rounded-2xl shadow-xl overflow-hidden">
            <CardHeader className="bg-white/5 border-b border-white/10 py-4 px-6">
              <CardTitle className="text-base font-bold text-white">Desempenho por Serviço</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-white/[0.02]">
                    <TableRow className="border-b border-white/10 hover:bg-transparent">
                      <TableHead className="pl-6 text-xs text-white/40 uppercase tracking-wider font-bold">Serviço</TableHead>
                      <TableHead className="text-center text-xs text-white/40 uppercase tracking-wider font-bold">Pedidos</TableHead>
                      <TableHead className="text-right text-xs text-white/40 uppercase tracking-wider font-bold">Volume (Kz)</TableHead>
                      <TableHead className="text-right text-xs text-white/40 uppercase tracking-wider font-bold">Receita Bruta</TableHead>
                      <TableHead className="text-right text-xs text-white/40 uppercase tracking-wider font-bold">Custo</TableHead>
                      <TableHead className="text-right font-bold text-[#A78BFA] text-xs uppercase tracking-wider">Lucro</TableHead>
                      <TableHead className="text-right pr-6 text-xs text-white/40 uppercase tracking-wider font-bold">Margem</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.byService.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="text-center py-10 text-white/40">Sem dados para o período</TableCell></TableRow>
                    ) : (
                      report.byService.map(service => (
                        <TableRow key={service.service} className="border-b border-white/5 hover:bg-white/[0.02]">
                          <TableCell className="pl-6 font-semibold text-sm text-white">{getServiceLabel(service.service)}</TableCell>
                          <TableCell className="text-center font-bold text-sm text-[#A78BFA]">{service.count}</TableCell>
                          <TableCell className="text-right text-sm text-white/60">{service.volumeKwanza.toLocaleString('pt-PT')}</TableCell>
                          <TableCell className="text-right text-sm text-white font-medium">{service.revenue.toLocaleString('pt-PT')}</TableCell>
                          <TableCell className="text-right text-sm text-red-400 font-medium">{service.cost.toLocaleString('pt-PT')}</TableCell>
                          <TableCell className="text-right font-bold text-sm text-emerald-400">{service.profit.toLocaleString('pt-PT')} Kz</TableCell>
                          <TableCell className="text-right pr-6">
                            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${service.margin >= 20 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
                              {service.margin.toFixed(1)}%
                            </span>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </AdminLayout>
  );
}
