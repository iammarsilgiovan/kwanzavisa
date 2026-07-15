import React, { useState, useEffect } from "react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Menu, X, CreditCard, MousePointer, ArrowLeftRight, Globe, Lock,
  ChevronDown, CheckCircle2, Search, ArrowRight, Star
} from "lucide-react";
import { 
  useGetExchangeRate, useCreateOrder, useLookupOrders, 
  getGetExchangeRateQueryKey, getLookupOrdersQueryKey 
} from "@workspace/api-client-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { 
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage 
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

// --- Schema for Order Form ---
const orderFormSchema = z.object({
  name: z.string().min(2, "Nome completo é obrigatório"),
  email: z.string().email("Email inválido"),
  whatsapp: z.string().min(9, "Número de WhatsApp inválido (ex: +244 9...)"),
  service: z.enum(["cartao_virtual", "acesso_assistido", "transferencia"], {
    required_error: "Selecciona um serviço",
  }),
  // Conditional fields will be validated conditionally or just marked optional
  platform: z.string().optional(),
  amount: z.coerce.number().positive("Valor deve ser positivo").optional().or(z.literal("")),
  currency: z.enum(["USD"]).optional(),
  description: z.string().optional(),
  destinationCountry: z.string().optional(),
  recipientName: z.string().optional(),
  message: z.string().optional(),
}).superRefine((data, ctx) => {
  if (["cartao_virtual", "acesso_assistido"].includes(data.service)) {
    if (!data.platform) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Plataforma/loja é obrigatória", path: ["platform"] });
    if (!data.amount) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Valor é obrigatório", path: ["amount"] });
    if (!data.currency) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Moeda é obrigatória", path: ["currency"] });
  }
  if (data.service === "transferencia") {
    if (!data.destinationCountry) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "País de destino é obrigatório", path: ["destinationCountry"] });
    if (!data.amount) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Valor é obrigatório", path: ["amount"] });
    if (!data.currency) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Moeda é obrigatória", path: ["currency"] });
    if (!data.recipientName) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Nome do destinatário é obrigatório", path: ["recipientName"] });
  }
});

type OrderFormValues = z.infer<typeof orderFormSchema>;

export default function Home() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white font-sans selection:bg-[#7C3AED] selection:text-white bg-grid">
      {/* 1. Navigation */}
      <header 
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: isScrolled ? "rgba(10,10,15,0.85)" : "transparent",
          backdropFilter: isScrolled ? "blur(20px)" : "none",
          borderBottom: isScrolled ? "1px solid rgba(124,58,237,0.15)" : "none",
          padding: isScrolled ? "12px 0" : "20px 0"
        }}
      >
        <div className="container mx-auto px-6 max-w-7xl flex items-center justify-between">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => window.scrollTo({top:0, behavior:"smooth"})}>
            <div className="relative w-8 h-8">
              <div className="absolute inset-0 rounded-xl blur-md opacity-50 bg-[#7C3AED]"></div>
              <svg viewBox="0 0 40 40" className="relative w-8 h-8">
                <defs>
                  <linearGradient id="zyvaLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#7C3AED" />
                    <stop offset="100%" stopColor="#5B21B6" />
                  </linearGradient>
                </defs>
                <rect width="40" height="40" rx="10" fill="url(#zyvaLogoGrad)" />
                <path d="M14 13 L26 13 L26 16.5 L18.5 23.5 L26 23.5 L26 27 L14 27 L14 23.5 L21.5 16.5 L14 16.5 Z" fill="white" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight text-white font-heading">ZYVA</span>
          </div>
          
          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-white/55">
            <button onClick={() => scrollTo("servicos")} className="hover:text-white transition-colors">Serviços</button>
            <button onClick={() => scrollTo("simulador")} className="hover:text-white transition-colors">Simulador</button>
            <button onClick={() => scrollTo("pedido")} className="hover:text-white transition-colors">Pedidos</button>
            <button onClick={() => scrollTo("rastrear")} className="hover:text-white transition-colors">Rastrear</button>
            <Link href="/ajuda"><a className="hover:text-white transition-colors">Ajuda</a></Link>
            <Button onClick={() => scrollTo("pedido")} className="rounded-full px-6 bg-[#7C3AED] text-white hover:opacity-90 border-0" style={{ boxShadow: "0 0 20px rgba(124,58,237,0.3)" }}>Começar agora</Button>
          </nav>

          <button className="md:hidden text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-full left-0 right-0 bg-[#0A0A0F]/98 border-b border-purple-900/20 shadow-lg p-6 flex flex-col space-y-4 md:hidden"
            >
              <button onClick={() => scrollTo("servicos")} className="text-left text-lg font-medium py-2 border-b border-white/5 text-white/70">Serviços</button>
              <button onClick={() => scrollTo("simulador")} className="text-left text-lg font-medium py-2 border-b border-white/5 text-white/70">Simulador</button>
              <button onClick={() => scrollTo("pedido")} className="text-left text-lg font-medium py-2 border-b border-white/5 text-white/70">Pedidos</button>
              <button onClick={() => scrollTo("rastrear")} className="text-left text-lg font-medium py-2 border-b border-white/5 text-white/70">Rastrear</button>
              <Link href="/ajuda"><a className="text-left text-lg font-medium py-2 border-b border-white/5 text-white/70">Ajuda & FAQ</a></Link>
              <Button onClick={() => scrollTo("pedido")} className="w-full rounded-full mt-4 bg-[#7C3AED] text-white border-0">Começar agora</Button>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main>
        {/* 2. Hero Section */}
        <section className="relative min-h-[92vh] flex items-center overflow-hidden bg-grid pt-24" style={{ background: "#0A0A0F" }}>
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-20 left-10 w-96 h-96 rounded-full opacity-25" style={{ background: "radial-gradient(circle, #7C3AED, transparent)" }}></div>
            <div className="absolute bottom-10 right-10 w-72 h-72 rounded-full opacity-15" style={{ background: "radial-gradient(circle, #5B21B6, transparent)" }}></div>
          </div>
          
          <div className="relative container mx-auto px-6 max-w-7xl w-full">
            <div className="flex flex-col lg:flex-row items-center gap-16">
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="flex-1 text-center lg:text-left pt-10"
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm mb-8 font-mono" style={{ border: "1px solid rgba(124,58,237,0.3)", color: "rgba(255,255,255,0.7)", background: "rgba(124,58,237,0.05)" }}>
                  <Globe className="w-4 h-4 text-[#7C3AED]" />
                  Acesso Global Simplificado
                </div>
                
                <h1 className="text-5xl md:text-7xl font-bold font-heading tracking-tight leading-[1.05] mb-6 text-white">
                  O mundo inteiro.<br />
                  <span className="text-gradient-zyva">Ao alcance do teu Kwanza.</span>
                </h1>
                <p className="text-lg md:text-xl max-w-xl mx-auto lg:mx-0 mb-10 leading-relaxed text-white/50">
                  Cartões virtuais, compras assistidas e apoio a pagamentos no exterior — tudo em Kwanzas, sem complicações.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                  <button 
                    onClick={() => scrollTo("pedido")} 
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full text-base font-medium transition-all text-white hover:scale-[1.02] w-full sm:w-auto" 
                    style={{ background: "#7C3AED", boxShadow: "0 0 30px rgba(124,58,237,0.35)" }}
                  >
                    Começar agora
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 md:gap-8 mt-16 text-sm font-mono text-white/35">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#7C3AED]" />
                    Entrega em minutos
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-[#7C3AED]" />
                    Aceite globalmente
                  </div>
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-[#7C3AED]" />
                    100% seguro
                  </div>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: 50, rotateY: -15, rotateX: 10 }}
                animate={{ opacity: 1, x: 0, rotateY: -20, rotateX: 15 }}
                transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                className="flex-1 w-full max-w-md perspective-1000 hidden lg:block"
                style={{ perspective: "1000px" }}
              >
                <div 
                  className="w-full aspect-[1.58/1] bg-primary rounded-2xl shadow-2xl p-8 flex flex-col justify-between text-white relative overflow-hidden"
                  style={{ transformStyle: "preserve-3d" }}
                >
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
                  <div className="flex justify-between items-start relative z-10">
                    <div className="text-xl font-bold tracking-widest font-heading">ZYVA</div>
                    <div className="w-12 h-8 bg-white/20 rounded flex items-center justify-center">
                      {/* Chip representation */}
                      <div className="w-8 h-5 border border-white/40 rounded-sm grid grid-cols-3 grid-rows-3 gap-[1px] p-[2px]">
                        <div className="border border-white/30 rounded-sm"></div>
                        <div className="border border-white/30 rounded-sm"></div>
                        <div className="border border-white/30 rounded-sm"></div>
                        <div className="border border-white/30 rounded-sm"></div>
                        <div className="border border-white/30 rounded-sm"></div>
                        <div className="border border-white/30 rounded-sm"></div>
                      </div>
                    </div>
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex gap-1"><div className="w-2 h-2 bg-white rounded-full"></div><div className="w-2 h-2 bg-white rounded-full"></div><div className="w-2 h-2 bg-white rounded-full"></div><div className="w-2 h-2 bg-white rounded-full"></div></div>
                      <div className="flex gap-1"><div className="w-2 h-2 bg-white rounded-full"></div><div className="w-2 h-2 bg-white rounded-full"></div><div className="w-2 h-2 bg-white rounded-full"></div><div className="w-2 h-2 bg-white rounded-full"></div></div>
                      <div className="flex gap-1"><div className="w-2 h-2 bg-white rounded-full"></div><div className="w-2 h-2 bg-white rounded-full"></div><div className="w-2 h-2 bg-white rounded-full"></div><div className="w-2 h-2 bg-white rounded-full"></div></div>
                      <div className="text-lg font-mono tracking-widest">4029</div>
                    </div>
                    <div className="flex justify-between items-end text-sm text-white/60 font-medium">
                      <div>Membro Cliente</div>
                      <div>Válido 12/28</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* 3. Services Section */}
        <section id="servicos" className="py-24 px-6" style={{ background: "#0A0A0F" }}>
          <div className="max-w-7xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-16 text-center lg:text-left"
            >
              <h2 className="text-4xl md:text-5xl font-bold font-heading tracking-tight mb-3 text-white">
                Três formas de<br />
                <span className="text-gradient-zyva">te servir</span>
              </h2>
              <p className="text-lg max-w-lg text-white/50 mx-auto lg:mx-0">
                Da compra assistida ao apoio no exterior — tudo em Kwanzas, sem complicações.
              </p>
            </motion.div>
            
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  num: "01",
                  icon: <CreditCard className="w-6 h-6 text-[#7C3AED]" />,
                  title: "Cartão Visa Virtual",
                  desc: "Precisas de um número de cartão Visa para pagar online? Nós emitimos um cartão virtual em minutos — seguro, sem burocracia e aceite em qualquer plataforma mundial.",
                  tags: ["AMAZON", "NETFLIX", "GOOGLE", "META"],
                  tag: "Mais popular"
                },
                {
                  num: "02",
                  icon: <MousePointer className="w-6 h-6 text-[#7C3AED]" />,
                  title: "Compra Assistida",
                  desc: "Partilha o link do que queres comprar e o endereço de entrega. Nós executamos a compra por ti e o produto chega onde indicares — em Angola ou no exterior.",
                  tags: ["SHEIN", "AMAZON", "ALIEXPRESS", "QUALQUER SITE"],
                  tag: null
                },
                {
                  num: "03",
                  icon: <ArrowLeftRight className="w-6 h-6 text-[#7C3AED]" />,
                  title: "Apoio a Pagamentos no Exterior",
                  desc: "Tens uma despesa no exterior? Transferes o valor em Kwanzas e nós tratamos do pagamento para o destino que precisares — rápido, transparente e seguro.",
                  tags: ["DESPESAS", "SERVIÇOS", "SUBSCRIÇÕES", "FORNECEDORES"],
                  tag: null
                }
              ].map((t, n) => (
                <div key={n} className="relative rounded-3xl p-8 glass-card glass-card-hover overflow-hidden">
                  <span className="absolute -top-4 -right-2 text-8xl font-bold font-heading select-none text-white/[0.03]">
                    {t.num}
                  </span>
                  {t.tag && (
                    <span className="relative text-xs font-medium px-3 py-1 rounded-full text-white mb-4 inline-block bg-[#7C3AED]" style={{ boxShadow: "0 0 15px rgba(124,58,237,0.3)" }}>
                      {t.tag}
                    </span>
                  )}
                  <div className="relative w-14 h-14 rounded-2xl flex items-center justify-center mb-6" style={{ background: "rgba(124,58,237,0.15)" }}>
                    {t.icon}
                  </div>
                  <h3 className="relative text-xl font-semibold mb-3 text-white font-heading">{t.title}</h3>
                  <p className="relative text-sm leading-relaxed mb-6 text-white/55">{t.desc}</p>
                  <div className="relative flex flex-wrap gap-2 mb-6">
                    {t.tags.map(r => (
                      <span key={r} className="text-xs px-2 py-1 rounded-md font-mono" style={{ background: "rgba(124,58,237,0.1)", color: "#A78BFA" }}>
                        {r}
                      </span>
                    ))}
                  </div>
                  <button onClick={() => scrollTo("pedido")} className="relative inline-flex items-center gap-1 text-sm font-medium text-[#A78BFA] hover:text-white transition-colors">
                    Pedir agora <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4. Como funciona Section */}
        <section className="py-24 px-6" style={{ background: "#12121A" }}>
          <div className="max-w-7xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-bold font-heading tracking-tight mb-4 text-white">Como funciona</h2>
              <p className="text-lg max-w-lg mx-auto text-white/50">
                Quatro passos simples para aceder a serviços financeiros internacionais.
              </p>
            </motion.div>
            
            <div className="grid md:grid-cols-4 gap-8">
              {[
                { icon: <CreditCard className="w-7 h-7" />, title: "Escolhe o serviço", desc: "Cartão virtual, compra assistida ou apoio a pagamentos no exterior." },
                { icon: <ChevronDown className="w-7 h-7 rotate-[-90deg]" />, title: "Simula o câmbio", desc: "Vê o valor exacto em Kwanzas antes de confirmar." },
                { icon: <MousePointer className="w-7 h-7" />, title: "Submete o pedido", desc: "Preenches os dados e envias — simples e rápido." },
                { icon: <CheckCircle2 className="w-7 h-7" />, title: "Confirmação via WhatsApp", desc: "Recebes tudo directamente no teu WhatsApp." }
              ].map((e, t) => (
                <motion.div 
                  key={t}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: t * 0.1 }}
                  className="relative text-center"
                >
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ background: "rgba(124,58,237,0.15)", boxShadow: "0 0 20px rgba(124,58,237,0.1)" }}>
                    <div style={{ color: "#7C3AED" }}>{e.icon}</div>
                  </div>
                  <span className="text-xs font-mono uppercase tracking-widest mb-2 block" style={{ color: "rgba(124,58,237,0.7)" }}>
                    Passo {String(t + 1).padStart(2, "0")}
                  </span>
                  <h3 className="text-xl font-semibold mb-2 text-white font-heading">{e.title}</h3>
                  <p className="text-sm leading-relaxed text-white/50">{e.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* 6. Exchange rate simulator */}
        <SimulatorSection />

        {/* 7. Social proof & Stats */}
        <section className="py-24 px-6" style={{ background: "#12121A" }}>
          <div className="max-w-7xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-bold font-heading tracking-tight mb-4 text-white">
                Números que <span className="text-gradient-zyva">falam</span>
              </h2>
            </motion.div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-24 border-b border-white/10 pb-16">
              {[
                { value: "1.200+", label: "Pedidos concluídos" },
                { value: "850+", label: "Clientes satisfeitos" },
                { value: "7", label: "Dias por semana" },
                { value: "3", label: "Serviços globais" }
              ].map((stat, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="text-center"
                >
                  <div className="text-5xl md:text-6xl font-bold font-heading mb-2 text-gradient-zyva">{stat.value}</div>
                  <div className="text-sm font-mono text-white/40">{stat.label}</div>
                </motion.div>
              ))}
            </div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { name: "Carlos M.", service: "Cartão Visa Virtual", text: "Finalmente consegui pagar a minha subscrição da Netflix sem depender de favores. O cartão funcionou de primeira." },
                { name: "Ana P.", service: "Compra Assistida", text: "Comprei o meu portátil na Amazon. Eles fizeram o pagamento, eu só coloquei a morada da transitária. Serviço 5 estrelas!" },
                { name: "João K.", service: "Apoio a Pagamentos no Exterior", text: "Enviei dinheiro para o meu irmão em Portugal no mesmo dia. Taxa clara e sem burocracia desnecessária." }
              ].map((t, i) => (
                <div key={i} className="glass-card border border-white/10 p-8 rounded-3xl">
                  <div className="flex mb-4">
                    {[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4 fill-[#7C3AED] text-[#7C3AED]" />)}
                  </div>
                  <p className="text-white/70 mb-6 line-clamp-4 leading-relaxed">"{t.text}"</p>
                  <div>
                    <div className="font-bold text-white">{t.name}</div>
                    <div className="text-xs font-medium text-[#A78BFA] uppercase tracking-wider mt-1">{t.service}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 9. Order Form */}
        <section id="pedido" className="py-24" style={{ background: "#12121A" }}>
          <div className="container mx-auto px-6 max-w-3xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold font-heading tracking-tight mb-4 text-white">Faz o teu pedido agora</h2>
              <p className="text-lg text-white/50">Preenche os detalhes e tratamos do resto.</p>
            </div>
            <OrderForm />
          </div>
        </section>

        {/* 10. Order Tracking */}
        <section id="rastrear" className="py-24" style={{ background: "#0A0A0F" }}>
          <div className="container mx-auto px-6 max-w-4xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold font-heading tracking-tight mb-4 text-white">Acompanha os teus pedidos</h2>
              <p className="text-lg text-white/50">Sem conta, sem senha. Usa o teu email ou número WhatsApp.</p>
            </div>
            <OrderTracker />
          </div>
        </section>

      </main>

      {/* 11. Footer */}
      <footer className="py-16 px-6" style={{ background: "#0A0A0F", borderTop: "1px solid rgba(124,58,237,0.12)" }}>
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-12">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="relative w-8 h-8">
                  <div className="absolute inset-0 rounded-xl blur-md opacity-50 bg-[#7C3AED]"></div>
                  <svg viewBox="0 0 40 40" className="relative w-8 h-8">
                    <rect width="40" height="40" rx="10" fill="url(#zyvaLogoGrad)" />
                    <path d="M14 13 L26 13 L26 16.5 L18.5 23.5 L26 23.5 L26 27 L14 27 L14 23.5 L21.5 16.5 L14 16.5 Z" fill="white" />
                  </svg>
                </div>
                <span className="text-xl font-bold tracking-tight text-white font-heading">ZYVA</span>
              </div>
              <p className="text-xs font-mono mt-3 mb-3 text-white/35">Acesso Global Simplificado</p>
              <p className="text-sm max-w-sm leading-relaxed text-white/45">Plataforma financeira para angolanos acederem a serviços internacionais, pagando em Kwanzas.</p>
            </div>
            <div className="flex gap-12 text-sm">
              <div>
                <h4 className="font-medium mb-4 text-white/60">Serviços</h4>
                <ul className="space-y-2 text-white/40">
                  <li>Cartão Visa Virtual</li>
                  <li>Compra Assistida</li>
                  <li>Apoio a Pagamentos no Exterior</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-4 text-white/60">Navegação</h4>
                <ul className="space-y-2 text-white/40">
                  <li><button onClick={() => scrollTo("pedido")} className="hover:text-white transition-colors">Fazer pedido</button></li>
                  <li><button onClick={() => scrollTo("rastrear")} className="hover:text-white transition-colors">Rastrear pedido</button></li>
                  <li><Link href="/ajuda"><a className="hover:text-white transition-colors">Ajuda e FAQ</a></Link></li>
                  <li><Link href="/termos"><a className="hover:text-white transition-colors">Termos de Uso</a></Link></li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="pt-8 flex items-center justify-between" style={{ borderTop: "1px solid rgba(124,58,237,0.12)" }}>
            <p className="text-xs font-mono text-white/25">© {new Date().getFullYear()} ZYVA. Todos os direitos reservados.</p>
            <div className="flex items-center gap-4">
              <a href="https://wa.me/244957636981" target="_blank" rel="noopener noreferrer" className="text-white/30 hover:text-white transition-colors" title="WhatsApp">
                <Menu className="w-5 h-5" />
              </a>
              <Link href="/admin" className="text-white/30 hover:text-white transition-colors" title="Painel administrativo"><Lock className="w-4 h-4" /></Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function SimulatorSection() {
  const currency = "USD" as const;
  const [amount, setAmount] = useState<string>("100");
  const parsedAmount = parseFloat(amount) || 0;

  const { data: rateData } = useGetExchangeRate(
    { currency, amount: parsedAmount },
    { query: { enabled: parsedAmount > 0, queryKey: getGetExchangeRateQueryKey({ currency, amount: parsedAmount }) } }
  );

  const rate = rateData ? rateData.ratePerUnit : 952;
  const totalKz = parsedAmount * rate;

  return (
    <section id="simulador" className="py-24 px-6 bg-grid" style={{ background: "#0A0A0F" }}>
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div className="text-center md:text-left">
            <h2 className="text-4xl md:text-5xl font-bold font-heading tracking-tight mb-4 text-white">
              Simulador de <span className="text-gradient-zyva">câmbio</span>
            </h2>
            <p className="text-lg leading-relaxed mb-8 text-white/50">
              Vê exactamente quanto vais pagar em Kwanzas antes de fazer qualquer pedido. Transparência total, sem surpresas.
            </p>
            <div className="flex items-center gap-3 justify-center md:justify-start text-sm font-mono text-white/40">
              <Globe className="w-4 h-4 text-[#7C3AED]" />
              Taxa actualizada em tempo real
            </div>
          </div>

          <div className="rounded-3xl p-8 glass-card glow-purple-sm">
            <div className="mb-6">
              <label className="text-sm mb-2 block font-mono text-white/50">Valor em USD</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg text-white/25">$</span>
                <input 
                  type="number" 
                  value={amount} 
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-2xl py-4 pl-10 pr-4 text-2xl font-semibold focus:outline-none transition-colors text-white"
                  style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)" }}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="h-px my-6" style={{ background: "rgba(124,58,237,0.15)" }}></div>

            <div>
              <label className="text-sm mb-2 block font-mono text-white/50">Valor em Kwanzas</label>
              <div className="text-4xl font-bold tracking-tight text-white font-heading">
                {totalKz ? totalKz.toLocaleString('pt-AO') : "0"} Kz
              </div>
            </div>

            <div className="mt-6 pt-6 text-sm font-mono text-white/40" style={{ borderTop: "1px solid rgba(124,58,237,0.15)" }}>
              Taxa: 1 USD = {rate.toLocaleString('pt-AO')} Kz
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function OrderForm() {
  const [successData, setSuccessData] = useState<{ id: string; amountKwanza: number | null } | null>(null);
  const { toast } = useToast();
  const createOrder = useCreateOrder();

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      name: "",
      email: "",
      whatsapp: "",
      service: "cartao_virtual",
      amount: "",
      currency: "USD",
      description: "",
      destinationCountry: "",
      recipientName: "",
      platform: "",
      message: ""
    }
  });

  const selectedService = form.watch("service");

  const onSubmit = (data: OrderFormValues) => {
    createOrder.mutate({ 
      data: {
        ...data,
        amount: data.amount === "" ? null : Number(data.amount)
      } 
    }, {
      onSuccess: (res) => {
        setSuccessData({ id: res.id, amountKwanza: res.amountKwanza ?? null });
        window.scrollTo({ top: document.getElementById("pedido")?.offsetTop || 0, behavior: "smooth" });
      },
      onError: (err) => {
        toast({ title: "Erro ao criar pedido", description: err.message, variant: "destructive" });
      }
    });
  };

  if (successData) {
    const paymentRows = [
      { label: "IBAN", value: "0006 0000 02167174301 34" },
      { label: "Nome", value: "K Digital Prestação de Serviços" },
      { label: "Entidade", value: "10116 — Paypay África" },
      { label: "Referência", value: "935975173" },
    ];
    return (
      <div className="glass-card border border-white/10 p-8 md:p-12 rounded-3xl">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-[#7C3AED]/20 text-[#A78BFA] rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-3xl font-bold mb-3 text-white">Pedido Submetido</h3>
          <p className="text-white/50 text-lg max-w-md mx-auto">
            O teu pedido foi recebido com sucesso. Efectua o pagamento com os dados abaixo para prosseguirmos.
          </p>
        </div>

        {/* Order ID */}
        <div className="bg-[#12121A] border border-white/5 p-6 rounded-2xl mb-6 text-center">
          <p className="text-xs font-semibold text-white/35 uppercase tracking-widest mb-1">ID do Pedido</p>
          <p className="text-2xl font-mono font-bold tracking-widest text-[#A78BFA]">{successData.id}</p>
        </div>

        {/* Payment details */}
        <div className="bg-[#12121A] border border-white/5 rounded-2xl overflow-hidden mb-8">
          <div className="bg-[#7C3AED]/20 px-6 py-3 border-b border-white/5">
            <p className="text-sm font-semibold text-white">Dados de Pagamento</p>
          </div>
          {paymentRows.map((row, i) => (
            <div key={row.label} className="px-6 py-4 border-b border-white/5">
              <p className="text-xs font-semibold text-white/35 uppercase tracking-widest mb-1">{row.label}</p>
              <p className="text-base font-bold font-mono text-white">{row.value}</p>
            </div>
          ))}
          {/* Total a pagar em Kz */}
          {successData.amountKwanza && (
            <div className="px-6 py-4 bg-[#7C3AED]/10">
              <p className="text-xs font-semibold text-white/35 uppercase tracking-widest mb-1">Total a Pagar</p>
              <p className="text-xl font-bold text-[#A78BFA]">{successData.amountKwanza.toLocaleString("pt-PT")} <span className="text-sm font-semibold">Kz</span></p>
            </div>
          )}
        </div>

        <p className="text-sm text-white/40 text-center mb-8">
          Após efectuares o pagamento, usa <strong>Rastrear Pedido</strong> para enviar o comprovativo.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={() => { setSuccessData(null); form.reset(); }} variant="outline" className="rounded-full border-white/10 text-white hover:bg-white/5">
            Fazer outro pedido
          </Button>
          <Button
            onClick={() => document.getElementById("rastrear")?.scrollIntoView({ behavior: "smooth" })}
            className="rounded-full bg-[#7C3AED] text-white hover:opacity-90 border-0"
          >
            Rastrear Pedido
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="glass-card border border-white/10 p-8 md:p-12 rounded-3xl shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white/70">Nome completo</FormLabel>
              <FormControl><Input placeholder="João Manuel" {...field} className="h-12 bg-[#12121A] border-white/10 text-white" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="email" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white/70">Email</FormLabel>
              <FormControl><Input placeholder="joao@exemplo.com" type="email" {...field} className="h-12 bg-[#12121A] border-white/10 text-white" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="whatsapp" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white/70">Número WhatsApp</FormLabel>
              <FormControl><Input placeholder="+244 9XX XXX XXX" {...field} className="h-12 bg-[#12121A] border-white/10 text-white" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="service" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white/70">Serviço</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="h-12 bg-[#12121A] border-white/10 text-white">
                    <SelectValue placeholder="Selecciona um serviço" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-[#12121A] border-white/10 text-white">
                  <SelectItem value="cartao_virtual">Cartão Visa Virtual</SelectItem>
                  <SelectItem value="acesso_assistido">Compra Assistida</SelectItem>
                  <SelectItem value="transferencia">Apoio a Pagamentos no Exterior</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <div className="bg-[#12121A] border border-white/5 p-6 rounded-2xl mb-8 space-y-6">
          {(selectedService === "cartao_virtual" || selectedService === "acesso_assistido") && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField control={form.control} name="platform" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/70">Plataforma/Loja</FormLabel>
                  <FormControl><Input placeholder="Ex: Amazon, Netflix" {...field} className="h-12 bg-[#0A0A0F] border-white/5 text-white" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="amount" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/70">Valor desejado</FormLabel>
                    <FormControl><Input type="number" placeholder="100" {...field} className="h-12 bg-[#0A0A0F] border-white/5 text-white" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="currency" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/70">Moeda</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger className="h-12 bg-[#0A0A0F] border-white/5 text-white"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent className="bg-[#0A0A0F] border-white/5 text-white">
                        <SelectItem value="USD">USD</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel className="text-white/70">Descrição ou Links (Opcional)</FormLabel>
                  <FormControl><Textarea placeholder="Links dos produtos ou notas adicionais..." {...field} className="bg-[#0A0A0F] border-white/5 text-white min-h-[100px]" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          )}

          {selectedService === "transferencia" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField control={form.control} name="destinationCountry" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/70">País de Destino</FormLabel>
                  <FormControl><Input placeholder="Ex: Portugal, Brasil" {...field} className="h-12 bg-[#0A0A0F] border-white/5 text-white" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="recipientName" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/70">Nome do Destinatário</FormLabel>
                  <FormControl><Input placeholder="Nome completo" {...field} className="h-12 bg-[#0A0A0F] border-white/5 text-white" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4 md:col-span-2">
                <FormField control={form.control} name="amount" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/70">Valor a enviar</FormLabel>
                    <FormControl><Input type="number" placeholder="100" {...field} className="h-12 bg-[#0A0A0F] border-white/5 text-white" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="currency" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/70">Moeda</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger className="h-12 bg-[#0A0A0F] border-white/5 text-white"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent className="bg-[#0A0A0F] border-white/5 text-white">
                        <SelectItem value="USD">USD</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </div>
          )}

        </div>

        <Button type="submit" className="w-full h-14 text-lg rounded-full bg-[#7C3AED] text-white hover:opacity-90 border-0" disabled={createOrder.isPending} style={{ boxShadow: "0 0 20px rgba(124,58,237,0.25)" }}>
          {createOrder.isPending ? "A processar..." : "Submeter Pedido"}
        </Button>
      </form>
    </Form>
  );
}

const STATUS_INFO: Record<string, { label: string; color: string; bg: string; next: string | null }> = {
  pendente:             { label: "Pendente",             color: "text-gray-400",  bg: "bg-white/5 border border-white/5",   next: null },
  em_contacto:          { label: "Em Contacto",          color: "text-blue-400",  bg: "bg-blue-500/10 border border-blue-500/20",    next: null },
  aguarda_pagamento:    { label: "Aguarda Pagamento",    color: "text-amber-400", bg: "bg-amber-500/10 border border-amber-500/20",   next: "Efectua o pagamento e envia o comprovativo abaixo." },
  comprovativo_enviado: { label: "Comprovativo Enviado", color: "text-violet-400",bg: "bg-violet-500/10 border border-violet-500/20",  next: "Comprovativo recebido. A confirmar o pagamento." },
  pago:                 { label: "Pago",                 color: "text-green-400", bg: "bg-green-500/10 border border-green-500/20",   next: "Pagamento confirmado. O teu pedido está em execução." },
  em_processamento:     { label: "Em Processamento",     color: "text-purple-400",  bg: "bg-purple-500/10 border border-purple-500/20",    next: "O teu pedido está a ser processado pela nossa equipa." },
  concluido:            { label: "Concluído",            color: "text-emerald-400",bg: "bg-emerald-500/10 border border-emerald-500/20",next: "Concluído. Obrigado por escolheres a ZYVA." },
  cancelado:            { label: "Cancelado",            color: "text-red-400",   bg: "bg-red-500/10 border border-red-500/20",     next: null },
};

const SERVICE_LABELS: Record<string, string> = {
  cartao_virtual: "Cartão Visa Virtual",
  acesso_assistido: "Compra Assistida",
  transferencia: "Apoio a Pagamentos no Exterior",
};

type LookupOrder = {
  id: string;
  service: string;
  status: string;
  platform?: string | null;
  amountUsd?: number | null;
  amountKwanza?: number | null;
  formattedDate: string;
  name: string;
  email: string;
};

function OrderCard({ order, onUploaded }: { order: LookupOrder; onUploaded: (id: string) => void }) {
  const info = STATUS_INFO[order.status] ?? { label: order.status, color: "text-gray-400", bg: "bg-white/5 border border-white/5", next: null };
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const reader = new FileReader();
      const base64: string = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const res = await fetch(`/api/orders/${order.id}/comprovativo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64Data: base64, fileName: file.name, mimeType: file.type }),
      });
      if (!res.ok) throw new Error("Erro ao enviar");
      setUploaded(true);
      onUploaded(order.id);
      toast({ title: "Comprovativo enviado!", description: "A nossa equipa irá confirmar o pagamento brevemente." });
    } catch {
      toast({ title: "Erro ao enviar comprovativo", description: "Tente novamente ou contacte via WhatsApp.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="glass-card border border-white/10 rounded-2xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-xs font-semibold text-white/35 uppercase tracking-widest mb-0.5">ID</p>
            <p className="font-mono font-bold text-sm text-[#A78BFA]">{order.id}</p>
          </div>
        </div>
        <span className={`inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-full ${info.bg} ${info.color}`}>
          {info.label}
        </span>
      </div>

      {/* Body */}
      <div className="px-6 py-5 grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div>
          <p className="text-xs font-semibold text-white/35 uppercase tracking-widest mb-1">Serviço</p>
          <p className="font-semibold text-sm text-white">{SERVICE_LABELS[order.service] ?? order.service}</p>
          {order.platform && (
            <p className="text-xs text-white/50">{order.platform}</p>
          )}
        </div>
        <div>
          <p className="text-xs font-semibold text-white/35 uppercase tracking-widest mb-1">Valor</p>
          <p className="font-semibold text-sm text-white">{order.amountUsd ? `$${order.amountUsd} USD` : "—"}</p>
          {order.amountUsd && order.amountKwanza && (
            <p className="text-xs text-white/50 mt-0.5">{order.amountKwanza.toLocaleString("pt-PT")} Kz</p>
          )}
        </div>
        <div>
          <p className="text-xs font-semibold text-white/35 uppercase tracking-widest mb-1">Data</p>
          <p className="font-semibold text-sm text-white">{order.formattedDate}</p>
        </div>
      </div>

      {/* Next step instruction */}
      {info.next && (
        <div className={`mx-6 mb-4 px-4 py-3 rounded-xl text-sm font-medium ${info.bg} ${info.color} flex items-start gap-2`}>
          <ArrowRight className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{info.next}</span>
        </div>
      )}

      {/* Inline upload for aguarda_pagamento */}
      {order.status === "aguarda_pagamento" && !uploaded && (
        <div className="mx-6 mb-5 p-4 border border-dashed border-white/10 rounded-xl bg-[#12121A] space-y-3">
          <p className="text-sm font-semibold text-white">Enviar Comprovativo de Pagamento</p>
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={handleFileChange}
            className="block w-full text-sm text-white/50 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#7C3AED] file:text-white hover:file:opacity-80 cursor-pointer"
          />
          {file && (
            <div className="flex items-center gap-3">
              <p className="text-xs text-white/50 flex-1 truncate">{file.name}</p>
              <Button size="sm" onClick={handleUpload} disabled={uploading} className="shrink-0 rounded-full bg-[#7C3AED] text-white hover:opacity-90 border-0">
                {uploading ? "A enviar..." : "Confirmar envio"}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Uploaded confirmation */}
      {(uploaded || order.status === "comprovativo_enviado") && (
        <div className="mx-6 mb-5 flex items-center gap-2 text-violet-400 text-sm font-medium bg-violet-500/10 border border-violet-500/20 px-4 py-3 rounded-xl">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          Comprovativo enviado. Aguarda confirmação.
        </div>
      )}
    </div>
  );
}

function OrderTracker() {
  const [contact, setContact] = useState("");
  const [queryContact, setQueryContact] = useState("");
  const [uploadedIds, setUploadedIds] = useState<Set<string>>(new Set());

  const { data, isLoading, refetch } = useLookupOrders(
    { contact: queryContact },
    { query: { enabled: !!queryContact, queryKey: getLookupOrdersQueryKey({ contact: queryContact }), retry: false } }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (contact.trim().length > 4) {
      setQueryContact(contact.trim());
    }
  };

  const handleUploaded = (id: string) => {
    setUploadedIds(prev => new Set([...prev, id]));
    setTimeout(() => refetch(), 1500);
  };
  return (
    <div className="space-y-8">
      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto">
        <Input
          type="text"
          placeholder="Email ou WhatsApp"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          className="h-14 text-lg bg-[#12121A] border-white/10 text-white focus-visible:ring-[#7C3AED]"
        />
        <Button type="submit" className="h-14 px-8 text-lg rounded-full bg-[#7C3AED] text-white hover:opacity-90 border-0" disabled={isLoading} style={{ boxShadow: "0 0 20px rgba(124,58,237,0.25)" }}>
          {isLoading ? "A procurar..." : "Consultar"}
        </Button>
      </form>

      {queryContact && data && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="glass-card border border-white/10 p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
            <div>
              <h3 className="text-2xl font-bold mb-1 text-white">Olá{data.name ? `, ${data.name.split(' ')[0]}` : ''}.</h3>
              <p className="text-white/50">{data.orders.length} pedido{data.orders.length !== 1 ? 's' : ''} encontrado{data.orders.length !== 1 ? 's' : ''}.</p>
            </div>
            <div className="bg-[#12121A] border border-white/5 px-6 py-4 rounded-2xl text-right shrink-0">
              <p className="text-xs font-bold text-white/35 uppercase tracking-widest mb-1">Total Concluído</p>
              <p className="text-2xl font-bold text-[#A78BFA]">{data.totalSpentKwanza.toLocaleString('pt-PT')} Kz</p>
            </div>
          </div>

          {data.orders.length > 0 ? (
            <div className="space-y-4">
              {data.orders.map(o => (
                <OrderCard
                  key={o.id}
                  order={{ ...o, name: data.name ?? "", email: queryContact }}
                  onUploaded={handleUploaded}
                />
              ))}
            </div>
          ) : (
            <div className="glass-card border border-white/10 text-center py-12 rounded-2xl">
              <p className="text-white/50">Nenhum pedido encontrado para este contacto.</p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
