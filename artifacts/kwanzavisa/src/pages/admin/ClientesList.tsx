import React, { useState } from "react";
import { useLocation } from "wouter";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
    <AdminLayout title="Clientes">
      <Card className="mb-6">
        <CardContent className="p-4 flex gap-4 items-end">
          <div className="flex-1 max-w-md">
            <label className="text-xs text-gray-500 mb-1 block">Pesquisar Clientes</label>
            <Input 
              placeholder="Nome, Email ou WhatsApp..." 
              value={searchQuery} 
              onChange={e => setSearchQuery(e.target.value)} 
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>WhatsApp</TableHead>
                <TableHead className="text-center">Total Pedidos</TableHead>
                <TableHead className="text-right">Total Gasto (Kz)</TableHead>
                <TableHead className="text-right">Último Pedido</TableHead>
                <TableHead className="text-right pr-6">Acções</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-gray-500">A carregar clientes...</TableCell></TableRow>
              ) : !clientsData?.clients || clientsData.clients.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-gray-500">Nenhum cliente encontrado.</TableCell></TableRow>
              ) : (
                clientsData.clients.map(client => (
                  <TableRow key={client.email}>
                    <TableCell className="pl-6 font-medium">{client.name}</TableCell>
                    <TableCell className="text-sm text-gray-600">{client.email}</TableCell>
                    <TableCell className="text-sm font-mono text-gray-600">{client.whatsapp}</TableCell>
                    <TableCell className="text-center font-medium">{client.totalOrders}</TableCell>
                    <TableCell className="text-right font-medium">{client.totalSpentKwanza.toLocaleString()} Kz</TableCell>
                    <TableCell className="text-right text-sm text-gray-500">{client.lastOrderDate ? new Date(client.lastOrderDate).toLocaleDateString() : '-'}</TableCell>
                    <TableCell className="text-right pr-6">
                      <Button variant="outline" size="sm" onClick={() => setLocation(`/admin/clientes/${encodeURIComponent(client.email)}`)}>
                        Ver ficha
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
