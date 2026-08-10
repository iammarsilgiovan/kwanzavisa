import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { ExternalLink, Wallet, Info } from "lucide-react";
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
      wise_usd: { label: "Conta Wise (USD)", currency: "USD", link: "https://wise.com/login/" }
    };
    return map[account] || { label: account, currency: "AOA" };
  };

  return (
    <AdminLayout title="Controlo de Saldos">
      <div className="mb-6 bg-[#7C3AED]/10 border border-[#7C3AED]/30 rounded-2xl p-4 text-xs text-white/80 flex items-start gap-3">
        <Info className="w-4 h-4 text-[#A78BFA] shrink-0 mt-0.5" />
        <span>
          Actualize os saldos após cada movimento nas contas Airtm, Wise e bancária. Os contravalores em Kwanza são calculados com base na taxa de câmbio activa definida no Dashboard.
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {isLoading ? (
          <div className="col-span-2 py-12 text-center text-white/40">A carregar saldos...</div>
        ) : (
          balancesData?.balances.map(b => {
            const info = getAccountInfo(b.account);
            const isEditing = editAccount === b.account;
            
            return (
              <Card key={b.account} className="bg-[#12121A] border-white/10 text-white rounded-2xl shadow-xl overflow-hidden">
                <CardHeader className="bg-white/5 border-b border-white/10 py-4 px-6">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-xs font-bold text-white/50 uppercase tracking-wider">{info.label}</CardTitle>
                    {info.link && (
                      <a href={info.link} target="_blank" rel="noopener noreferrer" className="text-xs text-[#A78BFA] hover:text-white flex items-center gap-1">
                        Abrir <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {isEditing ? (
                    <div className="flex items-center gap-2 mt-1">
                      <Input 
                        type="number" 
                        value={editValue} 
                        onChange={e => setEditValue(e.target.value)} 
                        className="bg-[#0A0A0F] border-white/10 text-white font-mono text-lg h-11 rounded-xl" 
                      />
                      <Button size="sm" onClick={() => handleSave(b.account, info.currency)} className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white h-11 px-4 rounded-xl font-semibold text-xs border-0">
                        Guardar
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditAccount(null)} className="text-white/50 hover:text-white h-11 px-3">
                        Cancelar
                      </Button>
                    </div>
                  ) : (
                    <div className="flex justify-between items-end mt-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-extrabold text-white font-heading">{b.balance.toLocaleString('pt-PT')}</span>
                        <span className="text-sm font-bold text-[#A78BFA]">{info.currency === 'AOA' ? 'Kz' : info.currency}</span>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => handleEdit(b.account, b.balance)} className="border-white/10 text-white hover:bg-white/5 rounded-xl text-xs">
                        Actualizar
                      </Button>
                    </div>
                  )}
                  <p className="text-[11px] text-white/40 mt-4">Actualizado em: {b.formattedDate}</p>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {balancesData && (
        <Card className="mb-8 bg-gradient-to-br from-[#7C3AED]/25 via-[#12121A] to-[#12121A] text-white border border-violet-500/30 rounded-2xl shadow-2xl">
          <CardContent className="p-8 text-center">
            <p className="text-xs font-bold text-violet-300 uppercase tracking-widest mb-2">Total Consolidado (Equivalente em Kz)</p>
            <p className="text-5xl font-black text-white font-heading">{balancesData.totalKwanza.toLocaleString('pt-PT')} Kz</p>
          </CardContent>
        </Card>
      )}

      <Card className="bg-[#12121A] border-white/10 text-white rounded-2xl shadow-xl overflow-hidden">
        <CardHeader className="bg-white/5 border-b border-white/10 py-4 px-6">
          <CardTitle className="text-base font-bold text-white">Histórico de Actualizações</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-white/[0.02]">
              <TableRow className="border-b border-white/10 hover:bg-transparent">
                <TableHead className="pl-6 text-xs text-white/40 uppercase tracking-wider font-bold">Data</TableHead>
                <TableHead className="text-xs text-white/40 uppercase tracking-wider font-bold">Conta</TableHead>
                <TableHead className="text-right text-xs text-white/40 uppercase tracking-wider font-bold">Valor Anterior</TableHead>
                <TableHead className="text-right text-xs text-white/40 uppercase tracking-wider font-bold">Novo Valor</TableHead>
                <TableHead className="text-right pr-6 text-xs text-white/40 uppercase tracking-wider font-bold">Actualizado por</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-10 text-white/40">A carregar...</TableCell></TableRow>
              ) : !balancesData?.history || balancesData.history.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-10 text-white/40">Sem histórico</TableCell></TableRow>
              ) : (
                balancesData.history.map((h, i) => {
                  const info = getAccountInfo(h.account);
                  const curr = info.currency === 'AOA' ? 'Kz' : info.currency;
                  return (
                    <TableRow key={i} className="border-b border-white/5 hover:bg-white/[0.02]">
                      <TableCell className="pl-6 text-xs text-white/60">{h.formattedDate}</TableCell>
                      <TableCell className="font-semibold text-sm text-white">{info.label}</TableCell>
                      <TableCell className="text-right text-sm text-white/40">{h.previousBalance != null ? `${h.previousBalance.toLocaleString('pt-PT')} ${curr}` : '-'}</TableCell>
                      <TableCell className="text-right font-bold text-sm text-[#A78BFA]">{h.newBalance.toLocaleString('pt-PT')} {curr}</TableCell>
                      <TableCell className="text-right pr-6 text-xs text-white/60">{h.updatedBy}</TableCell>
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
