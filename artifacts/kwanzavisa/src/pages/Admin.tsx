import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function Admin() {
  const [, setLocation] = useLocation();
  const [password, setPassword] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (localStorage.getItem('kv_admin_auth') === 'true') {
      setLocation("/admin/dashboard");
    }
  }, [setLocation]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "kwanza2025admin") {
      localStorage.setItem('kv_admin_auth', 'true');
      setLocation("/admin/dashboard");
    } else {
      toast({ title: "Senha incorrecta", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-[400px]">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">KwanzaVisa</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">Acesso Restrito</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <Input 
              type="password" 
              placeholder="Senha de acesso" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="text-center"
            />
            <Button type="submit" className="w-full bg-[#1D1D1F] hover:bg-black text-white">
              Entrar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
