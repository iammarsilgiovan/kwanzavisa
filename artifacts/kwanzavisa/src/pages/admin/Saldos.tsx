import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { ExternalLink } from "lucide-react";
import { 
  useAdminGetBalances,
  useAdminUpdateBalance,
  getAdminGetBalancesQueryKey
} from "@workspace/api-client-react";

export default function Saldos() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const isAuthenticated = localStorage.getItem('kv_admin_auth') === 'true';

  const { data: balancesData, isLoading } = useAdminGetBalances({
    query: { enabled: isAuthenticated, queryKey: getAdminGetBalancesQueryKey() }
  });

  const updateBalance = useAdminUpdateBalance();

  const [editAccount, setEditAccount] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const handleEdit = (account: string, currentBalance: number) => {
    setEditAccount(account);
    setEditValue(currentBalance.toString());
  };

  const handleSave = (account: string, currency: string): void => {
    const balance = parseFloat(editValue);
    if (isNaN(balance)) { toast({ title: "Valor inválido", variant: "destructive" }); return; }

    updateBalance.mutate({ account, data: { balance, currency, updatedBy: "Administrador" } }, {
      onSuccess: () => {
        toast({ title: "Saldo actualizado com sucesso" });
        setEditAccount(null);
        queryClient.invalidateQueries({ queryKey: getAdminGetBalancesQueryKey() });
      }
    });
  };

  const getAccountInfo = (account: string) => {
    const map: Record<string, { label: string, currency: string, link?: string }> = {
      angola_bank: { label: "Conta Bancária Angola", currency: "AOA" },
      airtm_usd: { label: "Conta Airtm", currency: "USD", link: "https://app.airtm.com/" },
      wise_eur: { label: "Conta Wise (EUR)", currency: "EUR", link: "https://wise.com/login/" },
      wise_usd: { label: "Conta Wise (USD)", currency: "USD", link: "https://wise.com/login/" }
    };
    return map[account] || { label: account, currency: "AOA" };
  };

  return (
    <AdminLayout title="Controlo de Saldos">
      <div className="mb-6 bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-800">
        Actualiza os saldos após cada movimento nas contas Airtm, Wise e bancária. Os contravalores em Kwanza são calculados com base na taxa de câmbio activa definida no Dashboard.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {isLoading ? (
          <div className="col-span-2 py-12 text-center text-gray-500">A carregar saldos...</div>
        ) : (
          balancesData?.balances.map(b => {
            const info = getAccountInfo(b.account);
            const isEditing = editAccount === b.account;
            
            return (
              <Card key={b.account}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider">{info.label}</CardTitle>
                    {info.link && (
                      <a href={info.link} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                        Abrir <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <div className="flex items-center gap-2 mt-2">
                      <Input type="number" value={editValue} onChange={e => setEditValue(e.target.value)} className="font-mono" />
                      <Button size="sm" onClick={() => handleSave(b.account, info.currency)} className="bg-[#1D1D1F]">Guardar</Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditAccount(null)}>Cancelar</Button>
                    </div>
                  ) : (
                    <div className="flex justify-between items-end mt-2">
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold">{b.balance.toLocaleString()}</span>
                        <span className="text-sm font-medium text-gray-500">{info.currency === 'AOA' ? 'Kz' : info.currency}</span>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => handleEdit(b.account, b.balance)}>Actualizar</Button>
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mt-4">Actualizado em: {b.formattedDate}</p>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {balancesData && (
        <Card className="mb-8 bg-[#1D1D1F] text-white border-0">
          <CardContent className="p-8 text-center">
            <p className="text-sm font-medium text-gray-400 uppercase tracking-widest mb-2">Total Consolidado (Equivalente em Kz)</p>
            <p className="text-5xl font-bold">{balancesData.totalKwanza.toLocaleString()} Kz</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Actualizações</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Data</TableHead>
                <TableHead>Conta</TableHead>
                <TableHead className="text-right">Valor Anterior</TableHead>
                <TableHead className="text-right">Novo Valor</TableHead>
                <TableHead className="text-right pr-6">Actualizado por</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8">A carregar...</TableCell></TableRow>
              ) : !balancesData?.history || balancesData.history.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-500">Sem histórico</TableCell></TableRow>
              ) : (
                balancesData.history.map((h, i) => {
                  const info = getAccountInfo(h.account);
                  const curr = info.currency === 'AOA' ? 'Kz' : info.currency;
                  return (
                    <TableRow key={i}>
                      <TableCell className="pl-6 text-sm">{h.formattedDate}</TableCell>
                      <TableCell className="font-medium">{info.label}</TableCell>
                      <TableCell className="text-right text-gray-500">{h.previousBalance != null ? `${h.previousBalance.toLocaleString()} ${curr}` : '-'}</TableCell>
                      <TableCell className="text-right font-medium">{h.newBalance.toLocaleString()} {curr}</TableCell>
                      <TableCell className="text-right pr-6 text-sm text-gray-500">{h.updatedBy}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

    </AdminLayout>
  );
}
