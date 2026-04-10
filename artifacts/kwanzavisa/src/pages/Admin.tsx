import React, { useState, useEffect } from "react";
import { Link } from "wouter";
import { useAdminListOrders, useAdminUpdateOrderStatus, useAdminGetStats, getAdminListOrdersQueryKey, getAdminGetStatsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Admin() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "kwanza2025admin") {
      setAuthenticated(true);
    } else {
      toast({ title: "Senha incorrecta", variant: "destructive" });
    }
  };

  const statusParam = statusFilter === "all" ? undefined : statusFilter as any;
  
  const { data: ordersData, isLoading: isLoadingOrders } = useAdminListOrders(
    { status: statusParam }, 
    { query: { enabled: authenticated, queryKey: getAdminListOrdersQueryKey({ status: statusParam }) } }
  );
  
  const { data: statsData } = useAdminGetStats({ 
    query: { enabled: authenticated, queryKey: getAdminGetStatsQueryKey() } 
  });

  const updateStatus = useAdminUpdateOrderStatus();

  const handleStatusChange = (id: string, newStatus: any) => {
    updateStatus.mutate({ id, data: { status: newStatus } }, {
      onSuccess: () => {
        toast({ title: "Estado actualizado" });
        queryClient.invalidateQueries({ queryKey: getAdminListOrdersQueryKey({ status: statusParam }) });
        queryClient.invalidateQueries({ queryKey: getAdminGetStatsQueryKey() });
      },
      onError: () => {
        toast({ title: "Erro ao actualizar estado", variant: "destructive" });
      }
    });
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-[400px]">
          <CardHeader>
            <CardTitle>Acesso Restrito</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <Input 
                type="password" 
                placeholder="Senha de acesso" 
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <Button type="submit" className="w-full">Entrar</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-semibold tracking-tight">Painel de Controlo</h1>
          <Link href="/" className="text-sm font-medium hover:underline">Voltar ao site</Link>
        </div>

        {statsData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Pedidos</CardTitle></CardHeader>
              <CardContent><p className="text-3xl font-semibold">{statsData.totalOrders}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Clientes Únicos</CardTitle></CardHeader>
              <CardContent><p className="text-3xl font-semibold">{statsData.totalClients}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Concluídos</CardTitle></CardHeader>
              <CardContent><p className="text-3xl font-semibold">{statsData.completedOrders}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Em Processamento</CardTitle></CardHeader>
              <CardContent><p className="text-3xl font-semibold">{statsData.pendingOrders}</p></CardContent>
            </Card>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Pedidos</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" onValueChange={setStatusFilter}>
              <TabsList className="mb-4">
                <TabsTrigger value="all">Todos</TabsTrigger>
                <TabsTrigger value="pendente">Pendentes</TabsTrigger>
                <TabsTrigger value="em_processamento">Em Processamento</TabsTrigger>
                <TabsTrigger value="concluido">Concluídos</TabsTrigger>
                <TabsTrigger value="cancelado">Cancelados</TabsTrigger>
              </TabsList>

              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Serviço</TableHead>
                      <TableHead>Plataforma</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingOrders ? (
                      <TableRow><TableCell colSpan={7} className="text-center py-8">A carregar...</TableCell></TableRow>
                    ) : ordersData?.orders?.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="text-center py-8">Nenhum pedido encontrado.</TableCell></TableRow>
                    ) : (
                      ordersData?.orders?.map(order => (
                        <TableRow key={order.id}>
                          <TableCell className="font-mono text-xs">{order.id}</TableCell>
                          <TableCell>{order.name}</TableCell>
                          <TableCell className="capitalize">{order.service.replace('_', ' ')}</TableCell>
                          <TableCell>{order.platform || order.intlPlatform || '-'}</TableCell>
                          <TableCell>
                            {order.amountUsd && `$${order.amountUsd}`}
                            {order.amountEur && `€${order.amountEur}`}
                            {order.amountKwanza && ` / ${order.amountKwanza.toLocaleString()} Kz`}
                          </TableCell>
                          <TableCell>
                            <Select 
                              value={order.status} 
                              onValueChange={(val) => handleStatusChange(order.id, val)}
                            >
                              <SelectTrigger className="w-[140px] h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pendente">Pendente</SelectItem>
                                <SelectItem value="em_processamento">Em Processamento</SelectItem>
                                <SelectItem value="concluido">Concluído</SelectItem>
                                <SelectItem value="cancelado">Cancelado</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{order.formattedDate}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
