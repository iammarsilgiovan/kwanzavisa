import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { 
  useAdminListOrders,
  useAdminUpdateOrderStatus,
  useAdminUpdateOrderNote,
  useAdminUpdateOrderCost,
  useAdminGetOrderDetail,
  getAdminListOrdersQueryKey,
  getAdminGetOrderDetailQueryKey
} from "@workspace/api-client-react";

const STATUS_OPTIONS = [
  { value: "todos", label: "Todos" },
  { value: "pendente", label: "Pendente" },
  { value: "em_contacto", label: "Em Contacto" },
  { value: "aguarda_pagamento", label: "Aguarda Pagamento" },
  { value: "pago", label: "Pago" },
  { value: "em_processamento", label: "Em Processamento" },
  { value: "concluido", label: "Concluído" },
  { value: "cancelado", label: "Cancelado" },
];

const SERVICE_OPTIONS = [
  { value: "todos", label: "Todos" },
  { value: "cartao_virtual", label: "Cartão Virtual" },
  { value: "acesso_assistido", label: "Acesso Assistido" },
  { value: "transferencia", label: "Transferência" },
  { value: "conta_internacional", label: "Conta Internacional" },
];

export default function Pedidos() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const isAuthenticated = localStorage.getItem('kv_admin_auth') === 'true';

  // Filters
  const [statusFilter, setStatusFilter] = useState("todos");
  const [serviceFilter, setServiceFilter] = useState("todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  // Detail Modal
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [costInput, setCostInput] = useState("");
  const [noteInput, setNoteInput] = useState("");

  const params: any = { page, limit: 20 };
  if (statusFilter !== "todos") params.status = statusFilter;
  if (serviceFilter !== "todos") params.service = serviceFilter;
  if (searchQuery) params.search = searchQuery;
  if (dateFrom) params.dateFrom = dateFrom;
  if (dateTo) params.dateTo = dateTo;

  const { data: ordersData, isLoading } = useAdminListOrders(params, {
    query: { enabled: isAuthenticated, queryKey: getAdminListOrdersQueryKey(params) }
  });

  const { data: orderDetail } = useAdminGetOrderDetail(selectedOrderId || "", {
    query: { 
      enabled: !!selectedOrderId && isModalOpen,
      queryKey: getAdminGetOrderDetailQueryKey(selectedOrderId || "") 
    }
  });

  const updateStatus = useAdminUpdateOrderStatus();
  const updateNote = useAdminUpdateOrderNote();
  const updateCost = useAdminUpdateOrderCost();

  const handleStatusChange = (id: string, newStatus: any) => {
    updateStatus.mutate(
      { id, data: { status: newStatus } },
      {
        onSuccess: () => {
          toast({ title: "Estado actualizado" });
          queryClient.invalidateQueries({ queryKey: getAdminListOrdersQueryKey(params) });
          if (id === selectedOrderId) {
            queryClient.invalidateQueries({ queryKey: getAdminGetOrderDetailQueryKey(id) });
          }
        }
      }
    );
  };

  const handleOpenDetail = (id: string) => {
    setSelectedOrderId(id);
    setIsModalOpen(true);
    // Reset inputs when opening modal, they will be populated when detail loads via useEffect
  };

  React.useEffect(() => {
    if (orderDetail) {
      setCostInput(orderDetail.costKwanza?.toString() || "");
      setNoteInput(orderDetail.note || "");
    }
  }, [orderDetail]);

  const handleSaveCost = (): void => {
    if (!selectedOrderId) return;
    const cost = parseFloat(costInput);
    if (isNaN(cost)) { toast({ title: "Custo inválido", variant: "destructive" }); return; }
    
    updateCost.mutate({ id: selectedOrderId, data: { costKwanza: cost } }, {
      onSuccess: () => {
        toast({ title: "Custo guardado com sucesso" });
        queryClient.invalidateQueries({ queryKey: getAdminGetOrderDetailQueryKey(selectedOrderId) });
      }
    });
  };

  const handleSaveNote = () => {
    if (!selectedOrderId) return;
    updateNote.mutate({ id: selectedOrderId, data: { note: noteInput } }, {
      onSuccess: () => {
        toast({ title: "Nota guardada com sucesso" });
        queryClient.invalidateQueries({ queryKey: getAdminGetOrderDetailQueryKey(selectedOrderId) });
      }
    });
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

  const openWhatsApp = (number: string, name: string, id: string) => {
    const text = `Olá ${name}, o seu pedido ${id} está a ser processado.`;
    window.open(`https://wa.me/${number.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const downloadCSV = () => {
    if (!ordersData?.orders) return;
    const headers = ["ID", "Nome", "Serviço", "Plataforma", "Valor USD", "Valor EUR", "Valor Kz", "Status", "Data"];
    const rows = ordersData.orders.map(o => [
      o.id, 
      o.name, 
      getServiceLabel(o.service), 
      o.platform || o.intlPlatform || "", 
      o.amountUsd || "", 
      o.amountEur || "", 
      o.amountKwanza || "", 
      o.status, 
      o.formattedDate
    ]);
    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `pedidos_kv_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AdminLayout title="Pedidos">
      <Card className="mb-6">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs text-gray-500 mb-1 block">Pesquisar</label>
            <Input placeholder="ID, Nome, Email..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
          <div className="w-[180px]">
            <label className="text-xs text-gray-500 mb-1 block">Estado</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="w-[180px]">
            <label className="text-xs text-gray-500 mb-1 block">Serviço</label>
            <Select value={serviceFilter} onValueChange={setServiceFilter}>
              <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
              <SelectContent>
                {SERVICE_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Data Inicial</label>
              <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Data Final</label>
              <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
            </div>
          </div>
          <Button variant="outline" onClick={downloadCSV}>Exportar CSV</Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">ID</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Serviço</TableHead>
                <TableHead>Plataforma</TableHead>
                <TableHead>Valores</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right pr-4">Acções</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-gray-500">A carregar...</TableCell></TableRow>
              ) : ordersData?.orders.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-gray-500">Nenhum pedido encontrado</TableCell></TableRow>
              ) : (
                ordersData?.orders.map(order => (
                  <TableRow key={order.id}>
                    <TableCell className="pl-4 font-mono text-xs">{order.id.slice(0, 8)}</TableCell>
                    <TableCell className="font-medium">{order.name}</TableCell>
                    <TableCell className="text-sm">{getServiceLabel(order.service)}</TableCell>
                    <TableCell className="text-sm">{order.platform || order.intlPlatform || '-'}</TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      {order.amountUsd && <div className="font-medium">${order.amountUsd}</div>}
                      {order.amountEur && <div className="font-medium">€{order.amountEur}</div>}
                      {order.amountKwanza && <div className="text-gray-500 text-xs">{order.amountKwanza.toLocaleString()} Kz</div>}
                    </TableCell>
                    <TableCell>
                      <Select 
                        value={order.status} 
                        onValueChange={(val) => handleStatusChange(order.id, val)}
                      >
                        <SelectTrigger className="h-8 w-[140px] text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.filter(o => o.value !== 'todos').map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-xs text-gray-500">{order.formattedDate}</TableCell>
                    <TableCell className="text-right pr-4">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleOpenDetail(order.id)}>Ver</Button>
                        <Button variant="outline" size="sm" className="text-green-600 border-green-200 hover:bg-green-50" onClick={() => openWhatsApp(order.whatsapp, order.name, order.id)}>WhatsApp</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {ordersData && ordersData.total > ordersData.limit && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <div className="text-sm text-gray-500">
                A mostrar {(page - 1) * params.limit + 1} a {Math.min(page * params.limit, ordersData.total)} de {ordersData.total}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Anterior</Button>
                <Button variant="outline" size="sm" disabled={page * params.limit >= ordersData.total} onClick={() => setPage(p => p + 1)}>Seguinte</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Detalhe do Pedido {selectedOrderId?.slice(0, 8)}</DialogTitle>
          </DialogHeader>
          
          {orderDetail ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 border-b pb-2 mb-3">Informação do Cliente</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-gray-500 w-24 inline-block">Nome:</span> {orderDetail.name}</p>
                    <p><span className="text-gray-500 w-24 inline-block">Email:</span> {orderDetail.email}</p>
                    <p><span className="text-gray-500 w-24 inline-block">WhatsApp:</span> {orderDetail.whatsapp}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-900 border-b pb-2 mb-3">Detalhes do Serviço</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-gray-500 w-24 inline-block">Serviço:</span> {getServiceLabel(orderDetail.service)}</p>
                    {orderDetail.platform && <p><span className="text-gray-500 w-24 inline-block">Plataforma:</span> {orderDetail.platform}</p>}
                    {orderDetail.intlPlatform && <p><span className="text-gray-500 w-24 inline-block">Plataforma Int.:</span> {orderDetail.intlPlatform}</p>}
                    {orderDetail.description && <p><span className="text-gray-500 w-24 inline-block">Descrição:</span> {orderDetail.description}</p>}
                    {orderDetail.destinationCountry && <p><span className="text-gray-500 w-24 inline-block">País:</span> {orderDetail.destinationCountry}</p>}
                    {orderDetail.recipientName && <p><span className="text-gray-500 w-24 inline-block">Beneficiário:</span> {orderDetail.recipientName}</p>}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-900 border-b pb-2 mb-3">Valores</h3>
                  <div className="space-y-2 text-sm">
                    {orderDetail.amountUsd && <p><span className="text-gray-500 w-24 inline-block">Valor USD:</span> ${orderDetail.amountUsd}</p>}
                    {orderDetail.amountEur && <p><span className="text-gray-500 w-24 inline-block">Valor EUR:</span> €{orderDetail.amountEur}</p>}
                    {orderDetail.amountKwanza && <p><span className="text-gray-500 w-24 inline-block">Valor Cobrado:</span> {orderDetail.amountKwanza.toLocaleString()} Kz</p>}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <label className="text-sm font-semibold text-gray-900 mb-2 block">Custo Real (Kz)</label>
                  <p className="text-xs text-gray-500 mb-3">Introduza o custo real da operação para cálculos de lucro.</p>
                  <div className="flex gap-2">
                    <Input type="number" value={costInput} onChange={e => setCostInput(e.target.value)} placeholder="Ex: 50000" />
                    <Button onClick={handleSaveCost} className="bg-[#1D1D1F]">Guardar</Button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-900 mb-2 block">Nota Interna</label>
                  <Textarea 
                    value={noteInput} 
                    onChange={e => setNoteInput(e.target.value)} 
                    placeholder="Notas visíveis apenas para administradores..."
                    className="min-h-[100px] mb-2"
                  />
                  <Button variant="outline" size="sm" onClick={handleSaveNote}>Guardar Nota</Button>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-900 border-b pb-2 mb-3">Histórico de Estados</h3>
                  <div className="space-y-3">
                    {orderDetail.statusHistory?.map((hist, i) => (
                      <div key={i} className="text-sm flex justify-between border-b pb-2 last:border-0">
                        <div>
                          <p className="font-medium">{getStatusBadge(hist.toStatus)}</p>
                          <p className="text-xs text-gray-500 mt-1">Por: {hist.changedBy}</p>
                        </div>
                        <span className="text-xs text-gray-500">{hist.formattedDate}</span>
                      </div>
                    ))}
                    {(!orderDetail.statusHistory || orderDetail.statusHistory.length === 0) && (
                      <p className="text-sm text-gray-500">Sem histórico disponível.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-gray-500">A carregar detalhes...</div>
          )}

          <DialogFooter className="mt-8 pt-4 border-t sm:justify-between">
            <Button variant="outline" onClick={() => orderDetail && openWhatsApp(orderDetail.whatsapp, orderDetail.name, orderDetail.id)}>
              Contactar via WhatsApp
            </Button>
            {orderDetail?.status !== 'concluido' && (
              <Button 
                className="bg-[#1D1D1F] text-white hover:bg-black"
                onClick={() => orderDetail && handleStatusChange(orderDetail.id, 'concluido')}
              >
                Marcar como Concluído
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
