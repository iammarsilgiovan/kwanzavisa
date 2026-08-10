import React, { useState, useEffect } from "react";
import { Link, useParams } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { 
  useAdminGetClient,
  useAdminUpdateClientNote,
  getAdminGetClientQueryKey
} from "@workspace/api-client-react";

export default function ClienteDetail() {
  const { email } = useParams();
  const decodedEmail = email ? decodeURIComponent(email) : "";
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const isAuthenticated = localStorage.getItem('kv_admin_auth') === 'true';

  const [noteInput, setNoteInput] = useState("");

  const { data: client, isLoading } = useAdminGetClient(decodedEmail, {
    query: { enabled: isAuthenticated && !!decodedEmail, queryKey: getAdminGetClientQueryKey(decodedEmail) }
  });

  const updateNote = useAdminUpdateClientNote();

  useEffect(() => {
    if (client) {
      setNoteInput(client.note || "");
    }
  }, [client]);

  const handleSaveNote = () => {
    updateNote.mutate({ email: decodedEmail, data: { note: noteInput } }, {
      onSuccess: () => {
        toast({ title: "Nota de cliente guardada com sucesso" });
        queryClient.invalidateQueries({ queryKey: getAdminGetClientQueryKey(decodedEmail) });
      }
    });
  };

  const getServiceLabel = (service: string) => {
    const map: Record<string, string> = {
      cartao_virtual: "Cartão Virtual",
      acesso_assistido: "Acesso Assistido",
      transferencia: "Transferência",
    };
    return map[service] || service;
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
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${mapped.bg} ${mapped.text} ${mapped.border}`}>
        {mapped.label}
      </span>
    );
  };

  const openWhatsApp = () => {
    if (!client) return;
    const text = `Olá ${client.name}, tudo bem? Aqui é a equipa da ZYVA.`;
    window.open(`https://wa.me/${client.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (isLoading || !client) {
    return (
      <AdminLayout title="Detalhes do Cliente">
        <div className="py-12 text-center text-white/50">A carregar ficha de cliente...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Detalhes do Cliente">
      <div className="mb-6">
        <Link href="/admin/clientes" className="text-xs text-white/50 hover:text-white flex items-center gap-2 w-fit transition-colors">
          <ArrowLeft className="h-4 w-4" /> Voltar a Clientes
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Perfil */}
        <Card className="lg:col-span-2 bg-[#12121A] border-white/10 text-white rounded-2xl shadow-xl">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1 font-heading">{client.name}</h2>
                <p className="text-sm text-white/50">{client.email} · {client.whatsapp}</p>
                {client.firstOrderDate && (
                  <p className="text-xs text-white/30 mt-2">Cliente desde {new Date(client.firstOrderDate).toLocaleDateString()}</p>
                )}
              </div>
              <Button onClick={openWhatsApp} className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 rounded-xl">
                Contactar via WhatsApp
              </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-8 pt-8 border-t border-white/10">
              <div>
                <p className="text-xs text-white/40 mb-1 uppercase tracking-wider font-semibold">Total Pedidos</p>
                <p className="text-2xl font-bold text-white">{client.totalOrders}</p>
              </div>
              <div>
                <p className="text-xs text-white/40 mb-1 uppercase tracking-wider font-semibold">Concluídos</p>
                <p className="text-2xl font-bold text-emerald-400">{client.completedOrders}</p>
              </div>
              <div>
                <p className="text-xs text-white/40 mb-1 uppercase tracking-wider font-semibold">Total Gasto</p>
                <p className="text-2xl font-bold text-[#A78BFA]">{client.totalSpentKwanza.toLocaleString('pt-PT')}<span className="text-xs font-normal ml-1 text-white/50">Kz</span></p>
              </div>
              <div>
                <p className="text-xs text-white/40 mb-1 uppercase tracking-wider font-semibold">Favorito</p>
                <p className="text-sm font-semibold text-white mt-1">{client.favoriteService ? getServiceLabel(client.favoriteService) : '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Nota Interna */}
        <Card className="bg-[#12121A] border-white/10 text-white rounded-2xl shadow-xl flex flex-col justify-between">
          <CardHeader className="bg-white/5 border-b border-white/10 py-4 px-6">
            <CardTitle className="text-base font-bold text-white">Nota Interna</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <Textarea 
              value={noteInput} 
              onChange={e => setNoteInput(e.target.value)} 
              placeholder="Adicione observações sobre este cliente (visível apenas para admins)..."
              className="min-h-[140px] bg-[#0A0A0F] border-white/10 text-white text-sm rounded-xl resize-none"
            />
            <Button onClick={handleSaveNote} className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold rounded-xl">
              Guardar Nota
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-[#12121A] border-white/10 text-white rounded-2xl shadow-xl overflow-hidden">
        <CardHeader className="bg-white/5 border-b border-white/10 py-4 px-6">
          <CardTitle className="text-base font-bold text-white">Histórico de Pedidos</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
            <TableHeader className="bg-white/[0.02]">
              <TableRow className="border-b border-white/10 hover:bg-transparent">
                <TableHead className="pl-6 text-xs text-white/40 uppercase tracking-wider font-bold">ID</TableHead>
                <TableHead className="text-xs text-white/40 uppercase tracking-wider font-bold">Serviço</TableHead>
                <TableHead className="text-xs text-white/40 uppercase tracking-wider font-bold">Valores</TableHead>
                <TableHead className="text-xs text-white/40 uppercase tracking-wider font-bold">Estado</TableHead>
                <TableHead className="text-xs text-white/40 uppercase tracking-wider font-bold">Data</TableHead>
                <TableHead className="text-right pr-6 text-xs text-white/40 uppercase tracking-wider font-bold">Acções</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {client.orders.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-10 text-white/40">Sem histórico de pedidos</TableCell></TableRow>
              ) : (
                client.orders.map(order => (
                  <TableRow key={order.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <TableCell className="pl-6 font-mono text-xs font-bold text-[#A78BFA]">{order.id}</TableCell>
                    <TableCell className="font-semibold text-sm text-white">{getServiceLabel(order.service)}</TableCell>
                    <TableCell className="text-sm text-white">
                      {order.amountUsd && <span className="font-bold">${order.amountUsd} USD </span>}
                      {order.amountKwanza && <span className="text-white/50 text-xs">({order.amountKwanza.toLocaleString('pt-PT')} Kz)</span>}
                    </TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell className="text-xs text-white/50">{order.formattedDate}</TableCell>
                    <TableCell className="text-right pr-6">
                      <Link href={`/admin/pedidos?search=${order.id}`} className="text-[#A78BFA] hover:text-white text-xs font-semibold">
                        Ver Pedido
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
