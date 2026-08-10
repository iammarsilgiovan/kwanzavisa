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
import { FileText, Download, ExternalLink, Paperclip, MessageSquare, CheckCircle, Search, Filter } from "lucide-react";
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
  { value: "todos", label: "Todos os Estados" },
  { value: "pendente", label: "Pendente" },
  { value: "em_contacto", label: "Em Contacto" },
  { value: "aguarda_pagamento", label: "Aguarda Pagamento" },
  { value: "comprovativo_enviado", label: "A Verificar Pagamento" },
  { value: "pago", label: "Pago" },
  { value: "em_processamento", label: "Em Processamento" },
  { value: "concluido", label: "Concluído" },
  { value: "cancelado", label: "Cancelado" },
];

const SERVICE_OPTIONS = [
  { value: "todos", label: "Todos os Serviços" },
  { value: "cartao_virtual", label: "Cartão Virtual" },
  { value: "acesso_assistido", label: "Acesso Assistido" },
  { value: "transferencia", label: "Transferência" },
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
  const [previewImage, setPreviewImage] = useState<string | null>(null);

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
          toast({ title: "Estado actualizado com sucesso" });
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
    const statusMap: Record<string, { label: string; bg: string; text: string; border: string }> = {
      pendente: { label: "Pendente", bg: "bg-yellow-500/10", text: "text-yellow-400", border: "border-yellow-500/20" },
      em_contacto: { label: "Em Contacto", bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20" },
      aguarda_pagamento: { label: "Aguarda Pagamento", bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" },
      comprovativo_enviado: { label: "A Verificar Pagamento", bg: "bg-violet-500/20", text: "text-violet-300 font-bold", border: "border-violet-500/40" },
      pago: { label: "Pago", bg: "bg-green-500/10", text: "text-green-400", border: "border-green-500/20" },
      em_processamento: { label: "Em Processamento", bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/20" },
      concluido: { label: "Concluído", bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
      cancelado: { label: "Cancelado", bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20" },
    };
    const mapped = statusMap[status] || { label: status, bg: "bg-white/5", text: "text-white/70", border: "border-white/10" };
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${mapped.bg} ${mapped.text} ${mapped.border}`}>
        {mapped.label}
      </span>
    );
  };

  const getServiceLabel = (service: string) => {
    const map: Record<string, string> = {
      cartao_virtual: "Cartão Virtual",
      acesso_assistido: "Acesso Assistido",
      transferencia: "Transferência",
    };
    return map[service] || service;
  };

  const openWhatsApp = (number: string, name: string, id: string) => {
    const text = `Olá ${name}, sobre o seu pedido ${id} na ZYVA...`;
    window.open(`https://wa.me/${number.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const downloadCSV = () => {
    if (!ordersData?.orders) return;
    const headers = ["ID", "Nome", "Serviço", "Plataforma", "Valor USD", "Valor Kz", "Status", "Data"];
    const rows = ordersData.orders.map(o => [
      o.id, 
      o.name, 
      getServiceLabel(o.service), 
      o.platform || "", 
      o.amountUsd || "", 
      o.amountKwanza || "", 
      o.status, 
      o.formattedDate
    ]);
    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `pedidos_zyva_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const comprovativosList = (orderDetail as any)?.comprovativos || [];

  return (
    <AdminLayout title="Gestão de Pedidos">
      {/* Filters Card */}
      <Card className="bg-[#12121A] border-white/10 text-white rounded-2xl shadow-xl">
        <CardContent className="p-5 flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 min-w-[200px] space-y-1.5">
            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider block">Pesquisar</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3.5 text-white/40" />
              <Input 
                placeholder="ID, Nome, Email..." 
                value={searchQuery} 
                onChange={e => setSearchQuery(e.target.value)} 
                className="pl-9 bg-[#0A0A0F] border-white/10 text-white focus-visible:ring-[#7C3AED] h-11 rounded-xl text-sm"
              />
            </div>
          </div>
          <div className="w-[190px] space-y-1.5">
            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider block">Estado</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-[#0A0A0F] border-white/10 text-white h-11 rounded-xl text-sm"><SelectValue placeholder="Todos" /></SelectTrigger>
              <SelectContent className="bg-[#12121A] border-white/10 text-white">
                {STATUS_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="w-[190px] space-y-1.5">
            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider block">Serviço</label>
            <Select value={serviceFilter} onValueChange={setServiceFilter}>
              <SelectTrigger className="bg-[#0A0A0F] border-white/10 text-white h-11 rounded-xl text-sm"><SelectValue placeholder="Todos" /></SelectTrigger>
              <SelectContent className="bg-[#12121A] border-white/10 text-white">
                {SERVICE_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider block">Data Inicial</label>
              <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="bg-[#0A0A0F] border-white/10 text-white h-11 rounded-xl text-sm" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider block">Data Final</label>
              <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="bg-[#0A0A0F] border-white/10 text-white h-11 rounded-xl text-sm" />
            </div>
          </div>
          <Button variant="outline" onClick={downloadCSV} className="h-11 rounded-xl border-white/10 text-white hover:bg-white/5">
            Exportar CSV
          </Button>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card className="bg-[#12121A] border-white/10 text-white rounded-2xl shadow-xl overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-white/5 border-b border-white/10">
              <TableRow className="hover:bg-transparent border-white/10">
                <TableHead className="pl-6 text-xs text-white/50 font-bold uppercase tracking-wider">ID</TableHead>
                <TableHead className="text-xs text-white/50 font-bold uppercase tracking-wider">Cliente</TableHead>
                <TableHead className="text-xs text-white/50 font-bold uppercase tracking-wider">Serviço</TableHead>
                <TableHead className="text-xs text-white/50 font-bold uppercase tracking-wider">Plataforma</TableHead>
                <TableHead className="text-xs text-white/50 font-bold uppercase tracking-wider">Valores</TableHead>
                <TableHead className="text-xs text-white/50 font-bold uppercase tracking-wider">Estado</TableHead>
                <TableHead className="text-xs text-white/50 font-bold uppercase tracking-wider">Data</TableHead>
                <TableHead className="text-right pr-6 text-xs text-white/50 font-bold uppercase tracking-wider">Acções</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-12 text-white/50">A carregar pedidos...</TableCell></TableRow>
              ) : ordersData?.orders.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-12 text-white/50">Nenhum pedido encontrado</TableCell></TableRow>
              ) : (
                ordersData?.orders.map(order => (
                  <TableRow key={order.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <TableCell className="pl-6 font-mono text-xs font-bold text-[#A78BFA]">{order.id}</TableCell>
                    <TableCell className="font-semibold text-sm text-white">
                      <div>{order.name}</div>
                      <div className="text-xs text-white/40 font-normal">{order.email}</div>
                    </TableCell>
                    <TableCell className="text-sm text-white/80">{getServiceLabel(order.service)}</TableCell>
                    <TableCell className="text-sm text-white/60">{order.platform || '-'}</TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      {order.amountUsd && <div className="font-bold text-white">${order.amountUsd} USD</div>}
                      {order.amountKwanza && <div className="text-white/50 text-xs">{order.amountKwanza.toLocaleString('pt-PT')} Kz</div>}
                    </TableCell>
                    <TableCell>
                      <Select 
                        value={order.status} 
                        onValueChange={(val) => handleStatusChange(order.id, val)}
                      >
                        <SelectTrigger className="h-9 w-[165px] bg-[#0A0A0F] border-white/10 text-xs rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#12121A] border-white/10 text-white">
                          {STATUS_OPTIONS.filter(o => o.value !== 'todos').map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-xs text-white/50">{order.formattedDate}</TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex justify-end gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => handleOpenDetail(order.id)}
                          className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-lg text-xs"
                        >
                          Ver Detalhes
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-emerald-400 border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg text-xs" 
                          onClick={() => openWhatsApp(order.whatsapp, order.name, order.id)}
                        >
                          WhatsApp
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {ordersData && ordersData.total > ordersData.limit && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-white/[0.01]">
              <div className="text-sm text-white/50">
                A mostrar {(page - 1) * params.limit + 1} a {Math.min(page * params.limit, ordersData.total)} de {ordersData.total}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)} className="border-white/10 text-white hover:bg-white/5 rounded-lg">Anterior</Button>
                <Button variant="outline" size="sm" disabled={page * params.limit >= ordersData.total} onClick={() => setPage(p => p + 1)} className="border-white/10 text-white hover:bg-white/5 rounded-lg">Seguinte</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Detail Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-[#12121A] border-white/10 text-white rounded-2xl p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white flex items-center gap-3">
              <span>Pedido <span className="font-mono text-[#A78BFA]">{selectedOrderId}</span></span>
              {orderDetail && getStatusBadge(orderDetail.status)}
            </DialogTitle>
          </DialogHeader>
          
          {orderDetail ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
              {/* Left Column: Information */}
              <div className="space-y-6">
                <div className="bg-[#0A0A0F] p-4 rounded-xl border border-white/5 space-y-2">
                  <h3 className="text-xs font-bold text-[#A78BFA] uppercase tracking-wider mb-2">Cliente</h3>
                  <p className="text-sm"><span className="text-white/40 w-24 inline-block">Nome:</span> <strong className="text-white">{orderDetail.name}</strong></p>
                  <p className="text-sm"><span className="text-white/40 w-24 inline-block">Email:</span> <span className="text-white/90">{orderDetail.email}</span></p>
                  <p className="text-sm"><span className="text-white/40 w-24 inline-block">WhatsApp:</span> <span className="text-white/90">{orderDetail.whatsapp}</span></p>
                </div>

                <div className="bg-[#0A0A0F] p-4 rounded-xl border border-white/5 space-y-2">
                  <h3 className="text-xs font-bold text-[#A78BFA] uppercase tracking-wider mb-2">Serviço</h3>
                  <p className="text-sm"><span className="text-white/40 w-24 inline-block">Tipo:</span> <strong className="text-white">{getServiceLabel(orderDetail.service)}</strong></p>
                  {orderDetail.platform && <p className="text-sm"><span className="text-white/40 w-24 inline-block">Plataforma:</span> <span className="text-white">{orderDetail.platform}</span></p>}
                  {orderDetail.description && <p className="text-sm"><span className="text-white/40 w-24 inline-block">Descrição:</span> <span className="text-white">{orderDetail.description}</span></p>}
                  {orderDetail.destinationCountry && <p className="text-sm"><span className="text-white/40 w-24 inline-block">País:</span> <span className="text-white">{orderDetail.destinationCountry}</span></p>}
                  {orderDetail.recipientName && <p className="text-sm"><span className="text-white/40 w-24 inline-block">Beneficiário:</span> <span className="text-white">{orderDetail.recipientName}</span></p>}
                </div>

                <div className="bg-[#0A0A0F] p-4 rounded-xl border border-white/5 space-y-2">
                  <h3 className="text-xs font-bold text-[#A78BFA] uppercase tracking-wider mb-2">Valores</h3>
                  {orderDetail.amountUsd && <p className="text-sm"><span className="text-white/40 w-24 inline-block">Valor USD:</span> <strong className="text-white">${orderDetail.amountUsd} USD</strong></p>}
                  {orderDetail.amountKwanza && <p className="text-sm"><span className="text-white/40 w-24 inline-block">Total Kwanza:</span> <strong className="text-[#A78BFA] text-base">{orderDetail.amountKwanza.toLocaleString('pt-PT')} Kz</strong></p>}
                </div>

                {/* Comprovativos section */}
                <div className="bg-violet-950/20 p-4 rounded-xl border border-violet-500/20 space-y-3">
                  <h3 className="text-xs font-bold text-violet-300 uppercase tracking-wider flex items-center gap-2">
                    <Paperclip className="w-3.5 h-3.5 text-violet-400" />
                    Comprovativos de Pagamento ({comprovativosList.length})
                  </h3>
                  
                  {comprovativosList.length > 0 ? (
                    <div className="space-y-3">
                      {comprovativosList.map((comp: any, idx: number) => {
                        const isImage = comp.mimeType?.startsWith('image/') || comp.base64Data?.startsWith('data:image');
                        return (
                          <div key={idx} className="p-3 bg-[#0A0A0F] rounded-lg border border-white/10 space-y-2">
                            <div className="flex items-center justify-between text-xs text-white/60">
                              <span className="font-mono text-white/90 truncate max-w-[180px]">{comp.fileName}</span>
                              <span>{comp.formattedDate}</span>
                            </div>

                            {isImage && comp.base64Data && (
                              <div className="relative group overflow-hidden rounded-lg border border-white/10 max-h-48 bg-black/40 flex items-center justify-center">
                                <img 
                                  src={comp.base64Data} 
                                  alt="Comprovativo" 
                                  className="max-h-44 object-contain transition-transform group-hover:scale-105 cursor-pointer"
                                  onClick={() => setPreviewImage(comp.base64Data)}
                                />
                              </div>
                            )}

                            <div className="flex gap-2 pt-1">
                              {comp.base64Data && (
                                <a 
                                  href={comp.base64Data} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 font-semibold"
                                >
                                  <ExternalLink className="w-3 h-3" /> Abrir Original
                                </a>
                              )}
                              {comp.base64Data && (
                                <a 
                                  href={comp.base64Data} 
                                  download={comp.fileName || "comprovativo"} 
                                  className="inline-flex items-center gap-1.5 text-xs text-white/60 hover:text-white ml-auto"
                                >
                                  <Download className="w-3 h-3" /> Download
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-white/40 py-1">Nenhum comprovativo submetido até ao momento.</p>
                  )}
                </div>
              </div>

              {/* Right Column: Actions & History */}
              <div className="space-y-6">
                <div className="bg-[#0A0A0F] p-4 rounded-xl border border-white/5 space-y-3">
                  <label className="text-xs font-bold text-white/70 uppercase tracking-wider block">Custo Real (Kz)</label>
                  <p className="text-xs text-white/40">Insira o custo operacional real para cálculo de rentabilidade.</p>
                  <div className="flex gap-2">
                    <Input 
                      type="number" 
                      value={costInput} 
                      onChange={e => setCostInput(e.target.value)} 
                      placeholder="Ex: 45000" 
                      className="bg-[#12121A] border-white/10 text-white h-10 rounded-lg text-sm"
                    />
                    <Button onClick={handleSaveCost} className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white shrink-0 rounded-lg h-10 text-xs font-semibold">
                      Guardar
                    </Button>
                  </div>
                </div>

                <div className="bg-[#0A0A0F] p-4 rounded-xl border border-white/5 space-y-3">
                  <label className="text-xs font-bold text-white/70 uppercase tracking-wider block">Nota Interna</label>
                  <Textarea 
                    value={noteInput} 
                    onChange={e => setNoteInput(e.target.value)} 
                    placeholder="Notas confidenciais da equipa de administração..."
                    className="min-h-[90px] bg-[#12121A] border-white/10 text-white text-sm rounded-lg resize-none"
                  />
                  <Button variant="outline" size="sm" onClick={handleSaveNote} className="border-white/10 text-white hover:bg-white/5 rounded-lg text-xs">
                    Guardar Nota
                  </Button>
                </div>

                <div className="bg-[#0A0A0F] p-4 rounded-xl border border-white/5 space-y-3">
                  <h3 className="text-xs font-bold text-[#A78BFA] uppercase tracking-wider">Histórico de Estados</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {orderDetail.statusHistory?.map((hist: any, i: number) => (
                      <div key={i} className="text-xs flex items-center justify-between border-b border-white/5 pb-2 last:border-0">
                        <div>
                          <div>{getStatusBadge(hist.toStatus)}</div>
                          <span className="text-[10px] text-white/40 mt-1 block">Por: {hist.changedBy}</span>
                        </div>
                        <span className="text-[10px] text-white/40 font-mono">{hist.formattedDate}</span>
                      </div>
                    ))}
                    {(!orderDetail.statusHistory || orderDetail.statusHistory.length === 0) && (
                      <p className="text-xs text-white/40">Sem histórico registado.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-white/50">A carregar detalhes do pedido...</div>
          )}

          <DialogFooter className="mt-6 pt-4 border-t border-white/10 sm:justify-between gap-3">
            <Button 
              variant="outline" 
              onClick={() => orderDetail && openWhatsApp(orderDetail.whatsapp, orderDetail.name, orderDetail.id)}
              className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-xl"
            >
              Contactar via WhatsApp
            </Button>
            {orderDetail?.status !== 'concluido' && (
              <Button 
                className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold rounded-xl"
                onClick={() => orderDetail && handleStatusChange(orderDetail.id, 'concluido')}
              >
                Marcar como Concluído
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Preview Modal */}
      {previewImage && (
        <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
          <DialogContent className="max-w-4xl bg-[#0A0A0F] border-white/10 text-white rounded-2xl p-4 flex flex-col items-center justify-center">
            <img src={previewImage} alt="Comprovativo Ampliado" className="max-h-[80vh] w-auto object-contain rounded-lg" />
            <div className="mt-4 flex gap-3">
              <a href={previewImage} target="_blank" rel="noopener noreferrer" className="text-xs text-violet-400 hover:underline flex items-center gap-1 font-semibold">
                <ExternalLink className="w-3.5 h-3.5" /> Abrir no Separador
              </a>
              <Button size="sm" variant="outline" onClick={() => setPreviewImage(null)} className="border-white/10 text-white hover:bg-white/5 rounded-lg text-xs">
                Fechar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </AdminLayout>
  );
}
