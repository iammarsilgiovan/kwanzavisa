import React, { useState } from "react";
import { useLocation } from "wouter";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search } from "lucide-react";
import { 
  useAdminListClients,
  getAdminListClientsQueryKey
} from "@workspace/api-client-react";

export default function ClientesList() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const isAuthenticated = localStorage.getItem('kv_admin_auth') === 'true';

  const params: any = {};
  if (searchQuery) params.search = searchQuery;

  const { data: clientsData, isLoading } = useAdminListClients(params, {
    query: { enabled: isAuthenticated, queryKey: getAdminListClientsQueryKey(params) }
  });

  return (
    <AdminLayout title="Gestão de Clientes">
      <Card className="bg-[#12121A] border-white/10 text-white rounded-2xl shadow-xl mb-6">
        <CardContent className="p-5 flex gap-4 items-end">
          <div className="flex-1 max-w-md space-y-1.5">
            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider block">Pesquisar Clientes</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3.5 text-white/40" />
              <Input 
                placeholder="Nome, Email ou WhatsApp..." 
                value={searchQuery} 
                onChange={e => setSearchQuery(e.target.value)} 
                className="pl-9 bg-[#0A0A0F] border-white/10 text-white focus-visible:ring-[#7C3AED] h-11 rounded-xl text-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#12121A] border-white/10 text-white rounded-2xl shadow-xl overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-white/5 border-b border-white/10">
              <TableRow className="hover:bg-transparent border-white/10">
                <TableHead className="pl-6 text-xs text-white/50 font-bold uppercase tracking-wider">Nome</TableHead>
                <TableHead className="text-xs text-white/50 font-bold uppercase tracking-wider">Email</TableHead>
                <TableHead className="text-xs text-white/50 font-bold uppercase tracking-wider">WhatsApp</TableHead>
                <TableHead className="text-center text-xs text-white/50 font-bold uppercase tracking-wider">Total Pedidos</TableHead>
                <TableHead className="text-right text-xs text-white/50 font-bold uppercase tracking-wider">Total Gasto</TableHead>
                <TableHead className="text-right text-xs text-white/50 font-bold uppercase tracking-wider">Último Pedido</TableHead>
                <TableHead className="text-right pr-6 text-xs text-white/50 font-bold uppercase tracking-wider">Acções</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-12 text-white/50">A carregar clientes...</TableCell></TableRow>
              ) : !clientsData?.clients || clientsData.clients.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-12 text-white/50">Nenhum cliente encontrado.</TableCell></TableRow>
              ) : (
                clientsData.clients.map(client => (
                  <TableRow key={client.email} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <TableCell className="pl-6 font-semibold text-sm text-white">{client.name}</TableCell>
                    <TableCell className="text-sm text-white/70">{client.email}</TableCell>
                    <TableCell className="text-sm font-mono text-white/70">{client.whatsapp}</TableCell>
                    <TableCell className="text-center font-bold text-sm text-[#A78BFA]">{client.totalOrders}</TableCell>
                    <TableCell className="text-right font-bold text-sm text-white">{client.totalSpentKwanza.toLocaleString('pt-PT')} Kz</TableCell>
                    <TableCell className="text-right text-xs text-white/50">{client.lastOrderDate ? new Date(client.lastOrderDate).toLocaleDateString() : '-'}</TableCell>
                    <TableCell className="text-right pr-6">
                      <Button 
                        size="sm" 
                        onClick={() => setLocation(`/admin/clientes/${encodeURIComponent(client.email)}`)}
                        className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-lg text-xs"
                      >
                        Ver Ficha
                      </Button>
                    </TableCell>
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
