import React from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAdminGetExchangeRates, getAdminGetExchangeRatesQueryKey } from "@workspace/api-client-react";

export default function Cambio() {
  const isAuthenticated = localStorage.getItem('kv_admin_auth') === 'true';

  const { data: rates, isLoading } = useAdminGetExchangeRates({
    query: { enabled: isAuthenticated, queryKey: getAdminGetExchangeRatesQueryKey() }
  });

  return (
    <AdminLayout title="Histórico de Câmbio">
      <div className="mb-8 max-w-xs">
        <Card className="border-border bg-[#1D1D1F] text-white">
          <CardContent className="pt-6">
            <p className="text-sm text-gray-400 font-medium uppercase tracking-wider mb-2">Câmbio USD Activo</p>
            <p className="text-4xl font-bold">{rates?.activeUsd ? `${rates.activeUsd} Kz` : '---'}</p>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6 text-sm text-gray-500">
        {rates?.lastUpdated ? (
          <p>Última actualização: {new Date(rates.lastUpdated).toLocaleString('pt-PT')} por <span className="font-medium text-gray-900">{rates.lastUpdatedBy}</span></p>
        ) : (
          <p>Para alterar as taxas, utilize a página de Dashboard.</p>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Alterações</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Data / Hora</TableHead>
                <TableHead>Moeda</TableHead>
                <TableHead className="text-right">Valor Anterior</TableHead>
                <TableHead className="text-right">Novo Valor</TableHead>
                <TableHead className="text-right pr-6">Alterado por</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-500">A carregar histórico...</TableCell></TableRow>
              ) : !rates?.history || rates.history.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-500">Nenhum registo de câmbio encontrado.</TableCell></TableRow>
              ) : (
                rates.history.map(record => (
                  <TableRow key={record.id}>
                    <TableCell className="pl-6 text-sm">{record.formattedDate}</TableCell>
                    <TableCell className="font-medium">{record.currency}</TableCell>
                    <TableCell className="text-right text-gray-500">{record.previousRate ? `${record.previousRate} Kz` : '-'}</TableCell>
                    <TableCell className="text-right font-medium">{record.rate} Kz</TableCell>
                    <TableCell className="text-right pr-6 text-gray-500 text-sm">{record.changedBy}</TableCell>
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
