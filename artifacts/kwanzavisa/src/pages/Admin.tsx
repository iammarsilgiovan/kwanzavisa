import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Lock, ShieldCheck } from "lucide-react";

export default function Admin() {
  const [, setLocation] = useLocation();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (localStorage.getItem("kv_admin_auth") === "true") {
      setLocation("/admin/dashboard");
    }
  }, [setLocation]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (res.ok && data.ok) {
        localStorage.setItem("kv_admin_auth", "true");
        if (data.token) {
          localStorage.setItem("kv_admin_auth_token", data.token);
        }
        toast({ title: "Bem-vindo de volta!", description: "Sessão de administração iniciada." });
        setLocation("/admin/dashboard");
      } else {
        toast({ title: "Senha incorrecta", description: data.message || "Tente novamente.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Erro na autenticação", description: "Falha de ligação ao servidor.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0F] text-white selection:bg-[#7C3AED] selection:text-white p-4">
      {/* Background radial glow */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#7C3AED]/15 via-transparent to-transparent blur-3xl"></div>

      <Card className="w-full max-w-md bg-[#12121A] border-white/10 text-white shadow-2xl backdrop-blur-xl relative z-10 rounded-2xl overflow-hidden">
        <CardHeader className="text-center pb-2 pt-8">
          <div className="flex justify-center mb-4">
            <div className="relative w-14 h-14 flex items-center justify-center rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#9F67F5] shadow-lg shadow-[#7C3AED]/30">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-heading">ZYVA Admin</h1>
          <p className="text-xs text-white/50 mt-1 flex items-center justify-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-[#A78BFA]" />
            Portal de Gestão Restrito
          </p>
        </CardHeader>
        <CardContent className="p-8 pt-4">
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-white/60 uppercase tracking-wider block">
                Palavra-passe de Acesso
              </label>
              <Input
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 bg-[#0A0A0F] border-white/10 text-white text-center text-lg focus-visible:ring-[#7C3AED] rounded-xl"
                autoFocus
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 text-base font-semibold rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white border-0 transition-all duration-200"
              style={{ boxShadow: "0 0 25px rgba(124, 58, 237, 0.3)" }}
            >
              {loading ? "A autenticar..." : "Entrar no Painel"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
