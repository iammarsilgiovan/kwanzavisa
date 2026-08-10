import React from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAdminGetExchangeRates, getAdminGetExchangeRatesQueryKey } from "@workspace/api-client-react";
import { TrendingUp } from "lucide-react";

export default function Cambio() {
  const isAuthenticated = localStorage.getItem('kv_admin_auth') === 'true';

  const { data: rates, isLoading } = useAdminGetExchangeRates({
    query: { enabled: isAuthenticated, queryKey: getAdminGetExchangeRatesQueryKey() }
  });

  return (
    <AdminLayout title="Histórico de Câmbio">
      <div className="mb-6 max-w-sm">
        <Card className="bg-[#12121A] border-white/10 text-white rounded-2xl shadow-xl p-5">
          <CardContent className="p-0">
            <div className="flex items-center justify-between text-white/50 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Câmbio USD Activo</span>
              <TrendingUp className="w-4 h-4 text-[#A78BFA]" />
            </div>
            <p className="text-3xl font-extrabold text-[#A78BFA] font-heading">{rates?.activeUsd ? `1 USD = ${rates.activeUsd} Kz` : '---'}</p>
            {rates?.lastUpdated && (
              <p className="text-xs text-white/40 mt-2">
                Última alteração: {new Date(rates.lastUpdated).toLocaleDateString()} por {rates.lastUpdatedBy}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-[#12121A] border-white/10 text-white rounded-2xl shadow-xl overflow-hidden">
        <CardHeader className="bg-white/5 border-b border-white/10 py-4 px-6">
          <CardTitle className="text-base font-bold text-white">Histórico de Alterações de Câmbio</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-white/[0.02]">
              <TableRow className="border-b border-white/10 hover:bg-transparent">
                <TableHead className="pl-6 text-xs text-white/40 uppercase tracking-wider font-bold">Data / Hora</TableHead>
                <TableHead className="text-xs text-white/40 uppercase tracking-wider font-bold">Moeda</TableHead>
                <TableHead className="text-right text-xs text-white/40 uppercase tracking-wider font-bold">Valor Anterior</TableHead>
                <TableHead className="text-right text-xs text-white/40 uppercase tracking-wider font-bold">Novo Valor</TableHead>
                <TableHead className="text-right pr-6 text-xs text-white/40 uppercase tracking-wider font-bold">Alterado Por</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-10 text-white/40">A carregar histórico...</TableCell></TableRow>
              ) : !rates?.history || rates.history.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-10 text-white/40">Nenhum registo de câmbio encontrado.</TableCell></TableRow>
              ) : (
                rates.history.map(record => (
                  <TableRow key={record.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <TableCell className="pl-6 text-xs text-white/60">{record.formattedDate}</TableCell>
                    <TableCell className="font-bold text-sm text-white">{record.currency}</TableCell>
                    <TableCell className="text-right text-sm text-white/40">{record.previousRate ? `${record.previousRate} Kz` : '-'}</TableCell>
                    <TableCell className="text-right font-bold text-sm text-[#A78BFA]">{record.rate} Kz</TableCell>
                    <TableCell className="text-right pr-6 text-xs text-white/60">{record.changedBy}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
