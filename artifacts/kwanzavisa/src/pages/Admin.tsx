import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Lock, ShieldCheck, Mail, ArrowLeft, RefreshCw } from "lucide-react";

type Step = "password" | "otp";

export default function Admin() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<Step>("password");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const { toast } = useToast();
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (localStorage.getItem("kv_admin_auth") === "true") {
      setLocation("/admin/dashboard");
    }
  }, [setLocation]);

  // Cooldown timer para reenvio de OTP
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
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
      if (res.ok && data.step === "2fa_required") {
        setStep("otp");
        setResendCooldown(60);
        toast({ title: "Código enviado!", description: "Verifique o seu email e insira o código de 6 dígitos." });
        setTimeout(() => otpRefs.current[0]?.focus(), 200);
      } else {
        toast({ title: "Senha incorrecta", description: data.message || "Tente novamente.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Erro na autenticação", description: "Falha de ligação ao servidor.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const cleaned = value.replace(/\D/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = cleaned;
    setOtp(newOtp);
    if (cleaned && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      e.preventDefault();
      otpRefs.current[5]?.focus();
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) {
      toast({ title: "Código incompleto", description: "Insira todos os 6 dígitos.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
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
        toast({ title: "Código inválido", description: data.message || "Tente novamente.", variant: "destructive" });
        setOtp(["", "", "", "", "", ""]);
        otpRefs.current[0]?.focus();
      }
    } catch {
      toast({ title: "Erro na verificação", description: "Falha de ligação ao servidor.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (res.ok && data.step === "2fa_required") {
        setResendCooldown(60);
        setOtp(["", "", "", "", "", ""]);
        otpRefs.current[0]?.focus();
        toast({ title: "Código reenviado!", description: "Verifique o seu email." });
      }
    } catch {
      toast({ title: "Erro", description: "Não foi possível reenviar o código.", variant: "destructive" });
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
            <div
              className="relative w-14 h-14 flex items-center justify-center rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#9F67F5] shadow-lg shadow-[#7C3AED]/30"
              style={{ transition: "transform 0.4s ease", transform: step === "otp" ? "scale(1.08)" : "scale(1)" }}
            >
              {step === "password" ? (
                <ShieldCheck className="w-8 h-8 text-white" />
              ) : (
                <Mail className="w-8 h-8 text-white" />
              )}
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-heading">
            {step === "password" ? "ZYVA Admin" : "Verificação de Email"}
          </h1>
          <p className="text-xs text-white/50 mt-1 flex items-center justify-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-[#A78BFA]" />
            {step === "password" ? "Portal de Gestão Restrito" : "Autenticação de 2 Factores"}
          </p>
        </CardHeader>

        <CardContent className="p-8 pt-4">
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className={`h-1.5 w-12 rounded-full transition-all duration-300 ${step === "password" ? "bg-[#7C3AED]" : "bg-[#7C3AED]/40"}`} />
            <div className={`h-1.5 w-12 rounded-full transition-all duration-300 ${step === "otp" ? "bg-[#7C3AED]" : "bg-white/10"}`} />
          </div>

          {step === "password" ? (
            <form onSubmit={handlePasswordSubmit} className="space-y-5">
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
                {loading ? "A verificar..." : "Continuar"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit} className="space-y-5">
              <div className="text-center space-y-1 mb-2">
                <p className="text-sm text-white/60">
                  Insira o código de 6 dígitos enviado para
                </p>
                <p className="text-sm font-bold text-[#A78BFA]">mvrsilgiovani@gmail.com</p>
              </div>

              {/* OTP input boxes */}
              <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => { otpRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(i, e)}
                    className="w-11 h-14 text-center text-xl font-bold bg-[#0A0A0F] border border-white/10 text-white rounded-xl outline-none transition-all duration-200 focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/30 focus:shadow-[0_0_15px_rgba(124,58,237,0.3)]"
                    style={{
                      caretColor: "#7C3AED",
                      borderColor: digit ? "#7C3AED" : undefined,
                    }}
                  />
                ))}
              </div>

              <Button
                type="submit"
                disabled={loading || otp.join("").length < 6}
                className="w-full h-12 text-base font-semibold rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white border-0 transition-all duration-200 disabled:opacity-40"
                style={{ boxShadow: "0 0 25px rgba(124, 58, 237, 0.3)" }}
              >
                {loading ? "A verificar..." : "Confirmar Identidade"}
              </Button>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => { setStep("password"); setOtp(["", "", "", "", "", ""]); }}
                  className="text-xs text-white/40 hover:text-white/70 flex items-center gap-1 transition-colors"
                >
                  <ArrowLeft className="w-3 h-3" /> Voltar
                </button>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || loading}
                  className="text-xs text-[#A78BFA] hover:text-white flex items-center gap-1 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <RefreshCw className="w-3 h-3" />
                  {resendCooldown > 0 ? `Reenviar (${resendCooldown}s)` : "Reenviar código"}
                </button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
