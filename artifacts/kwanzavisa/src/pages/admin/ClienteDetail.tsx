import React, { useState, useEffect } from "react";
import { Link, useParams } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
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
        toast({ title: "Nota de cliente guardada" });
        queryClient.invalidateQueries({ queryKey: getAdminGetClientQueryKey(decodedEmail) });
      }
    });
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

  const openWhatsApp = () => {
    if (!client) return;
    const text = `Olá ${client.name}, tudo bem? Aqui é a equipa da KwanzaVisa.`;
    window.open(`https://wa.me/${client.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (isLoading || !client) {
    return (
      <AdminLayout title="Detalhes do Cliente">
        <div className="py-12 text-center text-gray-500">A carregar ficha de cliente...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Detalhes do Cliente">
      <div className="mb-6">
        <Link href="/admin/clientes" className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-2 w-fit">
          <ArrowLeft className="h-4 w-4" /> Voltar a Clientes
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Perfil */}
        <Card className="lg:col-span-2">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">{client.name}</h2>
                <p className="text-gray-500">{client.email} · {client.whatsapp}</p>
                {client.firstOrderDate && (
                  <p className="text-xs text-gray-400 mt-2">Cliente desde {new Date(client.firstOrderDate).toLocaleDateString()}</p>
                )}
              </div>
              <Button onClick={openWhatsApp} className="bg-green-600 hover:bg-green-700 text-white">
                Contactar via WhatsApp
              </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-8 pt-8 border-t">
              <div>
                <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider font-semibold">Pedidos</p>
                <p className="text-2xl font-bold">{client.totalOrders}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider font-semibold">Concluídos</p>
                <p className="text-2xl font-bold text-green-600">{client.completedOrders}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider font-semibold">Total Gasto</p>
                <p className="text-2xl font-bold">{client.totalSpentKwanza.toLocaleString()}<span className="text-sm font-normal ml-1">Kz</span></p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider font-semibold">Mais usado</p>
                <p className="text-sm font-medium mt-2">{client.favoriteService ? getServiceLabel(client.favoriteService) : '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Nota Interna */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Nota Interna</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea 
              value={noteInput} 
              onChange={e => setNoteInput(e.target.value)} 
              placeholder="Adicione informações importantes sobre este cliente (visível apenas para admins)..."
              className="min-h-[150px] mb-4 resize-none bg-yellow-50/30 border-yellow-200 focus-visible:ring-yellow-400"
            />
            <Button onClick={handleSaveNote} className="w-full bg-[#1D1D1F]">Guardar Nota</Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Histórico de Pedidos</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">ID</TableHead>
                <TableHead>Serviço</TableHead>
                <TableHead>Valores</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right pr-6">Acções</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {client.orders.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-500">Sem histórico de pedidos</TableCell></TableRow>
              ) : (
                client.orders.map(order => (
                  <TableRow key={order.id}>
                    <TableCell className="pl-6 font-mono text-xs">{order.id.slice(0, 8)}</TableCell>
                    <TableCell className="font-medium text-sm">{getServiceLabel(order.service)}</TableCell>
                    <TableCell className="text-sm">
                      {order.amountUsd && <span>${order.amountUsd} </span>}
                      {order.amountKwanza && <span className="text-gray-500 text-xs">({order.amountKwanza.toLocaleString()} Kz)</span>}
                    </TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell className="text-xs text-gray-500">{order.formattedDate}</TableCell>
                    <TableCell className="text-right pr-6">
                      <Link href={`/admin/pedidos?search=${order.id}`} className="text-blue-600 hover:underline text-sm font-medium">Ver</Link>
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
