import { useState } from "react";
import { Link } from "wouter";
import { ChevronDown, ArrowLeft, MessageCircle, Mail } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

const faqs = [
  {
    category: "Como Funciona",
    items: [
      {
        q: "O que é a KwanzaVisa?",
        a: "A KwanzaVisa é uma plataforma angolana que permite pagar internacionalmente em Kwanzas. Actuamos como intermediários de confiança, processando os teus pagamentos para o exterior directamente da tua conta angolana.",
      },
      {
        q: "Como funciona o processo de encomenda?",
        a: "É simples: (1) Submetes o teu pedido no site com os detalhes do que precisas; (2) Recebes os dados de pagamento por email; (3) Efectuas o pagamento em Kwanzas e envias o comprovativo; (4) A nossa equipa processa o teu pedido e confirma via WhatsApp.",
      },
      {
        q: "Quanto tempo demora a processar um pedido?",
        a: "Após a confirmação do pagamento, a maioria dos pedidos é processada em menos de 24 horas durante dias úteis. Para situações urgentes, contacta-nos directamente pelo WhatsApp.",
      },
      {
        q: "Trabalham ao fim de semana?",
        a: "Processamos pedidos de Segunda a Sexta-feira em horário laboral. Pedidos submetidos ao fim de semana serão processados na segunda-feira seguinte.",
      },
    ],
  },
  {
    category: "Serviços",
    items: [
      {
        q: "O que é o Cartão Virtual?",
        a: "Criamos um cartão virtual temporário com o valor que precisas para pagares em qualquer loja online internacional — Amazon, eBay, Shopify, subscrições de software, etc. Recebes os dados do cartão via WhatsApp.",
      },
      {
        q: "O que é o Acesso Assistido?",
        a: "Realizamos o pagamento directamente em plataformas como Netflix, Spotify, ChatGPT, Adobe, Xbox e muito mais, usando os teus dados de login. O acesso fica activo na tua conta sem precisares de cartão internacional.",
      },
      {
        q: "O que é o Auxilio para Envio de Remessas?",
        a: "Facilitamos o envio de dinheiro para familiares ou amigos no exterior. Recebes o valor internacionalmente de forma segura, rápida e a taxas competitivas.",
      },
      {
        q: "Para que países enviam remessas?",
        a: "Trabalhamos com a maioria dos países, incluindo Portugal, Brasil, Reino Unido, Estados Unidos, e outros países europeus e africanos. Para destinos específicos, contacta-nos para confirmar disponibilidade.",
      },
    ],
  },
  {
    category: "Pagamentos",
    items: [
      {
        q: "Como pago pelos serviços?",
        a: "Aceitamos pagamentos via transferência bancária (IBAN angolano) e Paypay África. Os dados de pagamento são fornecidos no email de confirmação do pedido.",
      },
      {
        q: "Como sei quanto vou pagar em Kwanzas?",
        a: "Podes usar o nosso Simulador de Câmbio no site para ter uma estimativa. O valor final é calculado com base na taxa do dia no momento do processamento do pedido.",
      },
      {
        q: "O que acontece após efectuar o pagamento?",
        a: "Após o pagamento, envia o comprovativo através da secção 'Rastrear Pedido' no site ou directamente pelo WhatsApp. A nossa equipa confirma o recebimento e avança com o processamento.",
      },
      {
        q: "Fazem reembolsos?",
        a: "Caso não seja possível processar o teu pedido por qualquer motivo da nossa parte, efectuamos o reembolso integral. Em casos de desistência após o início do processamento, analisamos caso a caso. Consulta os nossos Termos de Uso para mais detalhes.",
      },
    ],
  },
  {
    category: "Segurança",
    items: [
      {
        q: "Os meus dados estão seguros?",
        a: "Sim. Utilizamos encriptação em todas as comunicações e nunca partilhamos os teus dados pessoais com terceiros. Os dados de login fornecidos para Acesso Assistido são usados apenas para o pedido específico e não são guardados.",
      },
      {
        q: "Como posso confiar na KwanzaVisa?",
        a: "Somos uma empresa angolana registada (K Digital Prestação de Serviços), com centenas de clientes satisfeitos. Podes verificar avaliações reais e falar connosco directamente antes de fazer qualquer pagamento.",
      },
      {
        q: "O que faço se tiver um problema?",
        a: "Contacta-nos imediatamente via WhatsApp (+244 957 636 981) ou por email. Respondemos a todas as questões o mais rapidamente possível.",
      },
    ],
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-start justify-between gap-4 py-5 text-left group"
        aria-expanded={open}
      >
        <span className="font-semibold text-base text-foreground group-hover:text-black transition-colors">
          {q}
        </span>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0 mt-0.5"
        >
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-muted-foreground leading-relaxed text-sm">
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQ() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* Header */}
      <header className="border-b border-border bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-6 max-w-4xl py-4 flex items-center justify-between">
          <Link href="/">
            <a className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
              <ArrowLeft className="w-4 h-4" />
              Voltar ao início
            </a>
          </Link>
          <span className="font-bold text-lg">KwanzaVisa</span>
        </div>
      </header>

      <main className="container mx-auto px-6 max-w-4xl py-16">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block bg-black text-white text-xs font-bold px-3 py-1.5 rounded-full tracking-widest uppercase mb-6">
            Ajuda
          </span>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4">
            Perguntas Frequentes
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Encontra respostas às perguntas mais comuns sobre os nossos serviços.
          </p>
        </motion.div>

        {/* FAQ Categories */}
        <div className="space-y-12">
          {faqs.map((category, ci) => (
            <motion.section
              key={category.category}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: ci * 0.1 }}
            >
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4 pb-2 border-b border-border">
                {category.category}
              </h2>
              <div className="bg-white rounded-2xl border border-border px-6 divide-y-0">
                {category.items.map((item) => (
                  <FAQItem key={item.q} q={item.q} a={item.a} />
                ))}
              </div>
            </motion.section>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-16 bg-black text-white rounded-3xl p-10 text-center"
        >
          <h2 className="text-2xl font-bold mb-2">Ainda tens dúvidas?</h2>
          <p className="text-white/60 mb-8 text-sm">
            A nossa equipa está disponível para ajudar.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="https://wa.me/244957636981"
              target="_blank"
              rel="noopener noreferrer"
              id="faq-whatsapp-btn"
            >
              <Button className="bg-white text-black hover:bg-white/90 rounded-full px-8 h-12 font-semibold gap-2">
                <MessageCircle className="w-4 h-4" />
                WhatsApp
              </Button>
            </a>
            <a href="mailto:suporte@kwanzavisa.com" id="faq-email-btn">
              <Button
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 rounded-full px-8 h-12 font-semibold gap-2 bg-transparent"
              >
                <Mail className="w-4 h-4" />
                Email
              </Button>
            </a>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-16 py-8 text-center text-sm text-muted-foreground">
        <div className="container mx-auto px-6 flex flex-col sm:flex-row items-center justify-center gap-4">
          <span>© {new Date().getFullYear()} KwanzaVisa · K Digital</span>
          <span className="hidden sm:inline text-border">·</span>
          <Link href="/termos">
            <a className="hover:text-foreground transition-colors">Termos de Uso</a>
          </Link>
          <span className="hidden sm:inline text-border">·</span>
          <Link href="/ajuda">
            <a className="hover:text-foreground transition-colors">Ajuda & FAQ</a>
          </Link>
        </div>
      </footer>
    </div>
  );
}
