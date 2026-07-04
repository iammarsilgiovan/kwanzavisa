import React, { useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from "recharts";
import { useAdminGetReports, getAdminGetReportsQueryKey } from "@workspace/api-client-react";

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
    <AdminLayout title="Relatórios Financeiros">
      <Card className="mb-8">
        <CardContent className="p-4 flex items-end gap-4">
          <div className="w-[200px]">
            <label className="text-xs text-gray-500 mb-1 block">Mês</label>
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {MONTHS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="w-[120px]">
            <label className="text-xs text-gray-500 mb-1 block">Ano</label>
            <Input type="number" value={year} onChange={e => setYear(e.target.value)} />
          </div>
          <Button variant="outline" className="ml-auto" onClick={downloadCSV} disabled={!report}>
            Exportar CSV
          </Button>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="py-20 text-center text-gray-500">A processar relatório...</div>
      ) : report ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card><CardContent className="pt-6"><p className="text-sm text-gray-500 mb-1">Total Pedidos</p><p className="text-3xl font-semibold">{report.totalOrders}</p></CardContent></Card>
            <Card><CardContent className="pt-6"><p className="text-sm text-gray-500 mb-1">Concluídos</p><p className="text-3xl font-semibold text-green-600">{report.completedOrders}</p></CardContent></Card>
            <Card><CardContent className="pt-6"><p className="text-sm text-gray-500 mb-1">Cancelados</p><p className="text-3xl font-semibold text-red-600">{report.cancelledOrders}</p></CardContent></Card>
            <Card><CardContent className="pt-6"><p className="text-sm text-gray-500 mb-1">Taxa Conclusão</p><p className="text-3xl font-semibold">{report.completionRate.toFixed(1)}%</p></CardContent></Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4">
            <Card className="xl:col-span-2 bg-[#1D1D1F] text-white">
              <CardContent className="pt-6">
                <p className="text-sm text-gray-400 uppercase tracking-wider font-semibold mb-1">Lucro Líquido</p>
                <p className="text-4xl font-bold">{report.netProfit.toLocaleString()} Kz</p>
                <p className="text-sm mt-2 text-green-400">Margem global: {report.margin.toFixed(1)}%</p>
              </CardContent>
            </Card>
            <Card><CardContent className="pt-6"><p className="text-sm text-gray-500 mb-1">Receita Bruta</p><p className="text-2xl font-semibold">{report.grossRevenue.toLocaleString()} Kz</p></CardContent></Card>
            <Card><CardContent className="pt-6"><p className="text-sm text-gray-500 mb-1">Custo Total</p><p className="text-2xl font-semibold text-red-600">{report.totalCost.toLocaleString()} Kz</p></CardContent></Card>
            <Card><CardContent className="pt-6"><p className="text-sm text-gray-500 mb-1">Volume Kz</p><p className="text-2xl font-semibold">{report.volumeKwanza.toLocaleString()} Kz</p></CardContent></Card>
            <Card><CardContent className="pt-6"><p className="text-sm text-gray-500 mb-1">Volume USD</p><p className="text-2xl font-semibold">${report.volumeUsd.toLocaleString()}</p></CardContent></Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Financeiro por Semana</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={report.weeklyFinancials} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} tickFormatter={(val) => `${(val/1000).toFixed(0)}k`} />
                    <RechartsTooltip 
                      formatter={(value: number) => [`${value.toLocaleString()} Kz`, '']}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <Bar dataKey="revenue" name="Receita" fill="#9CA3AF" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="cost" name="Custo" fill="#FCA5A5" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="profit" name="Lucro" fill="#1D1D1F" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Desempenho por Serviço</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Serviço</TableHead>
                    <TableHead className="text-center">Pedidos</TableHead>
                    <TableHead className="text-right">Volume (Kz)</TableHead>
                    <TableHead className="text-right">Receita Bruta</TableHead>
                    <TableHead className="text-right">Custo</TableHead>
                    <TableHead className="text-right font-bold text-gray-900">Lucro</TableHead>
                    <TableHead className="text-right pr-6">Margem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.byService.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8">Sem dados para o período</TableCell></TableRow>
                  ) : (
                    report.byService.map(service => (
                      <TableRow key={service.service}>
                        <TableCell className="pl-6 font-medium">{getServiceLabel(service.service)}</TableCell>
                        <TableCell className="text-center">{service.count}</TableCell>
                        <TableCell className="text-right text-gray-500">{service.volumeKwanza.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{service.revenue.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-red-600">{service.cost.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-bold text-gray-900">{service.profit.toLocaleString()} Kz</TableCell>
                        <TableCell className="text-right pr-6">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${service.margin >= 20 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {service.margin.toFixed(1)}%
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </AdminLayout>
  );
}
