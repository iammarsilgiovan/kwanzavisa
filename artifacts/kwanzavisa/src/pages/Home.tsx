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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

// --- Schema for Order Form ---
const orderFormSchema = z.object({
  name: z.string().min(2, "Nome completo é obrigatório"),
  email: z.string().email("Email inválido"),
  whatsapp: z.string().min(9, "Número de WhatsApp inválido (ex: +244 9...)"),
  service: z.enum(["cartao_virtual", "acesso_assistido", "transferencia", "conta_internacional"], {
    required_error: "Selecciona um serviço",
  }),
  // Conditional fields will be validated conditionally or just marked optional
  platform: z.string().optional(),
  amount: z.coerce.number().positive("Valor deve ser positivo").optional().or(z.literal("")),
  currency: z.enum(["USD"]).optional(),
  description: z.string().optional(),
  destinationCountry: z.string().optional(),
  recipientName: z.string().optional(),
  intlPlatform: z.enum(["Wise", "Bybit", "Kast"]).optional(),
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
  if (data.service === "conta_internacional") {
    if (!data.intlPlatform) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Plataforma é obrigatória", path: ["intlPlatform"] });
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
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-black selection:text-white">
      {/* 1. Navigation */}
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-white/80 backdrop-blur-md ${
          isScrolled ? "border-b border-border shadow-sm py-3" : "py-5"
        }`}
      >
        <div className="container mx-auto px-6 max-w-7xl flex items-center justify-between">
          <div className="text-xl font-bold tracking-tight cursor-pointer" onClick={() => window.scrollTo({top:0, behavior:"smooth"})}>
            KwanzaVisa
          </div>
          
          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-muted-foreground">
            <button onClick={() => scrollTo("servicos")} className="hover:text-foreground transition-colors">Serviços</button>
            <button onClick={() => scrollTo("simulador")} className="hover:text-foreground transition-colors">Simulador</button>
            <button onClick={() => scrollTo("pedido")} className="hover:text-foreground transition-colors">Pedidos</button>
            <button onClick={() => scrollTo("rastrear")} className="hover:text-foreground transition-colors">Rastrear</button>
            <Button onClick={() => scrollTo("pedido")} className="rounded-full px-6">Começar agora</Button>
          </nav>

          <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
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
              className="absolute top-full left-0 right-0 bg-white border-b shadow-lg p-6 flex flex-col space-y-4 md:hidden"
            >
              <button onClick={() => scrollTo("servicos")} className="text-left text-lg font-medium py-2 border-b">Serviços</button>
              <button onClick={() => scrollTo("simulador")} className="text-left text-lg font-medium py-2 border-b">Simulador</button>
              <button onClick={() => scrollTo("pedido")} className="text-left text-lg font-medium py-2 border-b">Pedidos</button>
              <button onClick={() => scrollTo("rastrear")} className="text-left text-lg font-medium py-2 border-b">Rastrear</button>
              <Button onClick={() => scrollTo("pedido")} className="w-full rounded-full mt-4">Começar agora</Button>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="pt-32">
        {/* 2. Hero Section */}
        <section className="container mx-auto px-6 max-w-7xl pb-24 lg:pb-32 overflow-hidden">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="flex-1 text-center lg:text-left pt-10"
            >
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter leading-[1.05] mb-6">
                Paga globalmente.<br />
                <span className="text-muted-foreground">Sem limites.</span>
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto lg:mx-0 mb-10 leading-relaxed">
                Cartões virtuais, Acesso Assistido e transferências com liquidação local — directamente de Angola, em Kwanzas.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Button onClick={() => scrollTo("pedido")} size="lg" className="w-full sm:w-auto text-lg px-8 h-14 rounded-full">
                  Começar agora
                </Button>
                <Button onClick={() => scrollTo("como-funciona")} variant="outline" size="lg" className="w-full sm:w-auto text-lg px-8 h-14 rounded-full border-2">
                  Ver como funciona ↓
                </Button>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 50, rotateY: -15, rotateX: 10 }}
              animate={{ opacity: 1, x: 0, rotateY: -20, rotateX: 15 }}
              transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
              className="flex-1 w-full max-w-md perspective-1000 hidden md:block"
              style={{ perspective: "1000px" }}
            >
              <div 
                className="w-full aspect-[1.58/1] bg-primary rounded-2xl shadow-2xl p-8 flex flex-col justify-between text-white relative overflow-hidden"
                style={{ transformStyle: "preserve-3d" }}
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
                <div className="flex justify-between items-start relative z-10">
                  <div className="text-xl font-bold tracking-widest">KwanzaVisa</div>
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
        </section>

        {/* 3. Compra em qualquer loja */}
        <section className="bg-secondary py-24">
          <div className="container mx-auto px-6 max-w-7xl text-center">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Compra em qualquer loja do mundo.</h2>
            <p className="text-xl text-muted-foreground mb-16">Com o Acesso Assistido, usas a tua conta com o nosso método de pagamento.</p>
            
            <div className="flex flex-wrap justify-center gap-8 md:gap-16 items-center opacity-60 font-bold text-xl md:text-3xl tracking-tight">
              <span>Amazon</span>
              <span className="hidden md:inline">·</span>
              <span>Shein</span>
              <span className="hidden md:inline">·</span>
              <span>Alibaba</span>
              <span className="hidden md:inline">·</span>
              <span>AliExpress</span>
              <span className="hidden md:inline">·</span>
              <span>eBay</span>
              <span className="hidden md:inline">·</span>
              <span>Etsy</span>
              <span className="hidden md:inline">·</span>
              <span>Netflix</span>
              <span className="hidden md:inline">·</span>
              <span>Spotify</span>
            </div>
            
            <p className="mt-16 text-sm text-muted-foreground font-medium">
              Não vês a tua plataforma? <a href="#" className="underline underline-offset-4 text-foreground">Fala connosco.</a>
            </p>
          </div>
        </section>

        {/* 4. Como Funciona */}
        <section id="como-funciona" className="py-24 lg:py-32">
          <div className="container mx-auto px-6 max-w-7xl">
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-20 text-center">Simples. Rápido. Seguro.</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
              {[
                { num: "01", text: "Escolhe o serviço" },
                { num: "02", text: "Simula o câmbio" },
                { num: "03", text: "Submete o pedido" },
                { num: "04", text: "Confirmação via WhatsApp" }
              ].map((step, i) => (
                <div key={i} className="flex flex-col relative group">
                  <div className="text-8xl font-bold text-secondary-foreground/10 tracking-tighter mb-4 transition-colors duration-500 group-hover:text-primary">
                    {step.num}
                  </div>
                  <div className="h-0.5 w-12 bg-black mb-6"></div>
                  <h3 className="text-xl font-semibold">{step.text}</h3>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 5. Services grid */}
        <section id="servicos" className="bg-primary text-primary-foreground py-24 lg:py-32">
          <div className="container mx-auto px-6 max-w-7xl">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-16 text-center max-w-2xl mx-auto leading-tight">
              Tudo o que precisas para operar globalmente.
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: <CreditCard className="w-8 h-8 mb-6" />,
                  title: "Cartão Virtual",
                  desc: "Gera um cartão virtual e paga qualquer serviço online no mundo. Entregue via WhatsApp em minutos."
                },
                {
                  icon: <MousePointer className="w-8 h-8 mb-6" />,
                  title: "Acesso Assistido",
                  desc: "Tu fazes a compra, nós tratamos do pagamento. A tua conta, o nosso cartão, a tua independência."
                },
                {
                  icon: <ArrowLeftRight className="w-8 h-8 mb-6" />,
                  title: "Transferência",
                  desc: "Envia valores entre países. Pagas em Kz, o destinatário recebe na moeda local."
                },
                {
                  icon: <Globe className="w-8 h-8 mb-6" />,
                  title: "Conta Internacional",
                  desc: "Abrimos a tua conta no Wise, Bybit ou Kast.",
                  badge: "Sob consulta"
                }
              ].map((s, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-colors">
                  {s.icon}
                  <div className="flex items-center gap-3 mb-4">
                    <h3 className="text-xl font-bold">{s.title}</h3>
                    {s.badge && <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-1 rounded-full">{s.badge}</span>}
                  </div>
                  <p className="text-white/60 leading-relaxed text-sm">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 6. Exchange rate simulator */}
        <SimulatorSection />

        {/* 7. International account */}
        <section className="py-24 lg:py-32">
          <div className="container mx-auto px-6 max-w-5xl text-center">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-16">A tua conta financeira internacional.</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
              {[
                { name: "Wise", desc: "Contas multimoeda e cartões físicos/virtuais para viagens." },
                { name: "Bybit", desc: "Acesso ao mercado crypto com facilidade e segurança." },
                { name: "Kast", desc: "Cartões virtuais recarregáveis para compras internacionais." }
              ].map((acc, i) => (
                <div key={i} className="border border-border rounded-3xl p-8 hover:shadow-lg transition-shadow bg-card">
                  <h3 className="text-2xl font-bold mb-3">{acc.name}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{acc.desc}</p>
                </div>
              ))}
            </div>
            
            <Button size="lg" className="rounded-full text-lg h-14 px-8" onClick={() => window.open("https://wa.me/244957636981?text=Olá%2C+tenho+interesse+em+abrir+uma+conta+internacional.", "_blank")}>
              Pedir orçamento via WhatsApp <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </section>

        {/* 8. Social proof */}
        <section className="bg-secondary py-24">
          <div className="container mx-auto px-6 max-w-7xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-24 border-b border-border/50 pb-16">
              {[
                { val: "1.200+", label: "Pedidos concluídos" },
                { val: "850+", label: "Clientes satisfeitos" },
                { val: "7", label: "Dias por semana" },
                { val: "4", label: "Serviços globais" }
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-4xl md:text-5xl font-bold mb-2 tracking-tighter">{stat.val}</div>
                  <div className="text-sm font-medium text-muted-foreground uppercase tracking-widest">{stat.label}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { name: "Carlos M.", service: "Cartão Virtual", text: "Finalmente consegui pagar a minha subscrição da Netflix sem depender de favores. O cartão funcionou de primeira." },
                { name: "Ana P.", service: "Acesso Assistido", text: "Comprei o meu portátil na Amazon. Eles fizeram o pagamento, eu só coloquei a morada da transitária. Serviço 5 estrelas!" },
                { name: "João K.", service: "Transferência", text: "Enviei dinheiro para o meu irmão em Portugal no mesmo dia. Taxa clara e sem burocracia desnecessária." }
              ].map((t, i) => (
                <div key={i} className="bg-card border border-border p-8 rounded-3xl">
                  <div className="flex mb-4">
                    {[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4 fill-primary text-primary" />)}
                  </div>
                  <p className="text-muted-foreground mb-6 line-clamp-4 leading-relaxed">"{t.text}"</p>
                  <div>
                    <div className="font-bold">{t.name}</div>
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mt-1">{t.service}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 9. Order Form */}
        <section id="pedido" className="py-24 bg-white">
          <div className="container mx-auto px-6 max-w-3xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Faz o teu pedido agora.</h2>
              <p className="text-xl text-muted-foreground">Preenche os detalhes e tratamos do resto.</p>
            </div>
            <OrderForm />
          </div>
        </section>

        {/* 10. Order Tracking */}
        <section id="rastrear" className="py-24 bg-secondary">
          <div className="container mx-auto px-6 max-w-4xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Acompanha os teus pedidos.</h2>
              <p className="text-xl text-muted-foreground">Sem conta, sem senha. Usa o teu email ou número WhatsApp.</p>
            </div>
            <OrderTracker />
          </div>
        </section>

      </main>

      {/* 11. Footer */}
      <footer className="bg-primary text-primary-foreground py-16">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-16 border-b border-white/10 pb-12">
            <div>
              <div className="text-2xl font-bold tracking-tight mb-2">KwanzaVisa</div>
              <p className="text-white/60">Paga globalmente. Directamente de Angola.</p>
            </div>
            <div className="flex flex-wrap gap-6 md:gap-12 text-sm font-medium">
              <button onClick={() => scrollTo("servicos")} className="text-white/80 hover:text-white">Serviços</button>
              <button onClick={() => scrollTo("simulador")} className="text-white/80 hover:text-white">Simulador</button>
              <button onClick={() => scrollTo("pedido")} className="text-white/80 hover:text-white">Faz um Pedido</button>
              <button onClick={() => scrollTo("rastrear")} className="text-white/80 hover:text-white">Rastrear Pedido</button>
              <a href="https://wa.me/244957636981" target="_blank" rel="noreferrer" className="text-white/80 hover:text-white">WhatsApp</a>
            </div>
          </div>
          
          <div className="flex justify-between items-center text-xs text-white/40 font-medium">
            <div>© 2025 KwanzaVisa. Todos os direitos reservados.</div>
            <Link href="/admin" className="hover:text-white/80 p-2"><Lock className="w-4 h-4" /></Link>
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

  return (
    <section id="simulador" className="py-24 bg-white border-y border-border">
      <div className="container mx-auto px-6 max-w-3xl text-center">
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Quanto vais pagar?</h2>
        <p className="text-xl text-muted-foreground mb-12">Câmbio calculado em tempo real. Sem surpresas.</p>

        <div className="bg-secondary p-8 rounded-3xl max-w-xl mx-auto border border-border">
          <div className="flex items-center gap-4 mb-8 bg-white p-2 rounded-2xl border border-border shadow-sm">
            <div className="flex-1 relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">$</span>
              <Input 
                type="number" 
                value={amount} 
                onChange={(e) => setAmount(e.target.value)}
                className="text-2xl font-bold h-16 pl-10 border-0 bg-transparent focus-visible:ring-0 shadow-none text-right"
                placeholder="0"
              />
            </div>
            <div className="w-[100px]">
              <div className="h-12 bg-secondary border-0 font-bold flex items-center justify-center text-sm rounded-md">
                USD
              </div>
            </div>
          </div>

          <div className="text-5xl md:text-6xl font-bold tracking-tighter mb-8 break-all">
            = {rateData ? rateData.amountKwanza.toLocaleString('pt-PT') : "0"} Kz
          </div>

          <div className="space-y-1 text-sm font-medium">
            <p className="text-foreground">Câmbio aplicado: 1 USD = {rateData ? rateData.ratePerUnit.toLocaleString('pt-PT') : "0"} Kz</p>
            <p className="text-muted-foreground">Câmbio actualizado automaticamente</p>
          </div>
        </div>

        <p className="mt-6 text-sm text-muted-foreground max-w-md mx-auto">
          Pagamentos em Euro poderão ser processados mediante conversão do valor para USD à taxa do dia.
        </p>
      </div>
    </section>
  );
}

function OrderForm() {
  const [successId, setSuccessId] = useState<string | null>(null);
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
        setSuccessId(res.id);
        window.scrollTo({ top: document.getElementById("pedido")?.offsetTop || 0, behavior: "smooth" });
      },
      onError: (err) => {
        toast({ title: "Erro ao criar pedido", description: err.message, variant: "destructive" });
      }
    });
  };

  if (successId) {
    return (
      <div className="bg-secondary border border-border p-12 rounded-3xl text-center">
        <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h3 className="text-3xl font-bold mb-4">Pedido Submetido</h3>
        <p className="text-muted-foreground text-lg mb-8">O teu pedido foi recebido com sucesso. O nosso suporte entrará em contacto via WhatsApp em breve.</p>
        <div className="bg-white border border-border p-6 rounded-2xl mb-8 inline-block mx-auto">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-1">ID do Pedido</p>
          <p className="text-2xl font-mono font-bold tracking-widest">{successId}</p>
        </div>
        <div>
          <Button onClick={() => { setSuccessId(null); form.reset(); }} variant="outline" className="rounded-full">Fazer outro pedido</Button>
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="bg-card border border-border p-8 md:p-12 rounded-3xl shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem>
              <FormLabel>Nome completo</FormLabel>
              <FormControl><Input placeholder="João Manuel" {...field} className="h-12 bg-secondary" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="email" render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl><Input placeholder="joao@exemplo.com" type="email" {...field} className="h-12 bg-secondary" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="whatsapp" render={({ field }) => (
            <FormItem>
              <FormLabel>Número WhatsApp</FormLabel>
              <FormControl><Input placeholder="+244 9XX XXX XXX" {...field} className="h-12 bg-secondary" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="service" render={({ field }) => (
            <FormItem>
              <FormLabel>Serviço</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="h-12 bg-secondary">
                    <SelectValue placeholder="Selecciona um serviço" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="cartao_virtual">Cartão Virtual</SelectItem>
                  <SelectItem value="acesso_assistido">Acesso Assistido</SelectItem>
                  <SelectItem value="transferencia">Transferência Internacional</SelectItem>
                  <SelectItem value="conta_internacional">Conta Internacional</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <div className="bg-secondary border border-border p-6 rounded-2xl mb-8 space-y-6">
          {(selectedService === "cartao_virtual" || selectedService === "acesso_assistido") && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField control={form.control} name="platform" render={({ field }) => (
                <FormItem>
                  <FormLabel>Plataforma/Loja</FormLabel>
                  <FormControl><Input placeholder="Ex: Amazon, Netflix" {...field} className="h-12 bg-white" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="amount" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor desejado</FormLabel>
                    <FormControl><Input type="number" placeholder="100" {...field} className="h-12 bg-white" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="currency" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Moeda</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger className="h-12 bg-white"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Descrição ou Links (Opcional)</FormLabel>
                  <FormControl><Textarea placeholder="Links dos produtos ou notas adicionais..." {...field} className="bg-white min-h-[100px]" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          )}

          {selectedService === "transferencia" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField control={form.control} name="destinationCountry" render={({ field }) => (
                <FormItem>
                  <FormLabel>País de Destino</FormLabel>
                  <FormControl><Input placeholder="Ex: Portugal, Brasil" {...field} className="h-12 bg-white" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="recipientName" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Destinatário</FormLabel>
                  <FormControl><Input placeholder="Nome completo" {...field} className="h-12 bg-white" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4 md:col-span-2">
                <FormField control={form.control} name="amount" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor a enviar</FormLabel>
                    <FormControl><Input type="number" placeholder="100" {...field} className="h-12 bg-white" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="currency" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Moeda</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger className="h-12 bg-white"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </div>
          )}

          {selectedService === "conta_internacional" && (
            <div className="grid grid-cols-1 gap-6">
              <FormField control={form.control} name="intlPlatform" render={({ field }) => (
                <FormItem>
                  <FormLabel>Plataforma Desejada</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-12 bg-white">
                        <SelectValue placeholder="Selecciona a plataforma" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Wise">Wise</SelectItem>
                      <SelectItem value="Bybit">Bybit</SelectItem>
                      <SelectItem value="Kast">Kast</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="message" render={({ field }) => (
                <FormItem>
                  <FormLabel>Mensagem Opcional</FormLabel>
                  <FormControl><Textarea placeholder="Tem alguma dúvida específica?" {...field} className="bg-white min-h-[100px]" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <p className="text-sm text-muted-foreground font-medium flex items-center">
                <Search className="w-4 h-4 mr-2 inline" /> Entraremos em contacto para apresentar o orçamento.
              </p>
            </div>
          )}
        </div>

        <Button type="submit" className="w-full h-14 text-lg rounded-full" disabled={createOrder.isPending}>
          {createOrder.isPending ? "A processar..." : "Submeter Pedido"}
        </Button>
      </form>
    </Form>
  );
}

function OrderTracker() {
  const [contact, setContact] = useState("");
  const [queryContact, setQueryContact] = useState("");

  const { data, isLoading } = useLookupOrders(
    { contact: queryContact },
    { query: { enabled: !!queryContact, queryKey: getLookupOrdersQueryKey({ contact: queryContact }), retry: false } }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (contact.trim().length > 4) {
      setQueryContact(contact.trim());
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case "pendente": return <Badge variant="outline" className="bg-gray-100 text-gray-800">Pendente</Badge>;
      case "em_processamento": return <Badge className="bg-gray-800 text-white">Processar</Badge>;
      case "concluido": return <Badge className="bg-black text-white">Concluído</Badge>;
      case "cancelado": return <Badge variant="destructive">Cancelado</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto">
        <Input 
          type="text" 
          placeholder="Email ou WhatsApp" 
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          className="h-14 text-lg bg-white shadow-sm border-border"
        />
        <Button type="submit" className="h-14 px-8 text-lg rounded-full" disabled={isLoading}>
          {isLoading ? "A procurar..." : "Consultar"}
        </Button>
      </form>

      {queryContact && data && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-border p-8 rounded-3xl shadow-sm"
        >
          <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <h3 className="text-2xl font-bold mb-2">Olá{data.name ? `, ${data.name.split(' ')[0]}` : ''}.</h3>
              <p className="text-muted-foreground">Encontrámos {data.orders.length} pedido{data.orders.length !== 1 && 's'}.</p>
            </div>
            <div className="bg-secondary px-6 py-4 rounded-2xl text-right">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Total Concluído</p>
              <p className="text-2xl font-bold">{data.totalSpentKwanza.toLocaleString('pt-PT')} Kz</p>
            </div>
          </div>

          {data.orders.length > 0 ? (
            <div className="border rounded-2xl overflow-hidden">
              <Table>
                <TableHeader className="bg-secondary">
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Serviço</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.orders.map(o => (
                    <TableRow key={o.id}>
                      <TableCell className="font-mono text-xs font-medium">{o.id}</TableCell>
                      <TableCell>
                        <div className="font-bold capitalize">{o.service.replace('_', ' ')}</div>
                        <div className="text-xs text-muted-foreground">{o.platform || o.intlPlatform}</div>
                      </TableCell>
                      <TableCell className="font-medium whitespace-nowrap">
                        {o.amountUsd ? `$${o.amountUsd}` : '-'}
                      </TableCell>
                      <TableCell>{getStatusBadge(o.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{o.formattedDate}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Nenhum pedido encontrado para este contacto.</p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
