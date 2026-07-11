import { useState } from "react";
import { Link } from "wouter";
import { ChevronDown, ArrowLeft, MessageCircle, Mail } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

const faqs = [
  {
    category: "Geral / Serviços",
    items: [
      {
        q: "O que é um cartão virtual e como funciona?",
        a: "Um cartão virtual é um cartão de pagamento digital que funciona como um cartão de débito ou crédito tradicional, mas sem suporte físico. É emitido instantaneamente e entregue via WhatsApp, podendo ser utilizado para compras online em qualquer site que aceite pagamentos internacionais.",
      },
      {
        q: "O que é o serviço de Acesso Assistido?",
        a: "No Acesso Assistido, a nossa equipa realiza a compra por si utilizando os métodos de pagamento da KwanzaVisa. Você indica o que pretende comprar, nós processamos o pagamento em Kwanzas e acompanha todo o processo. Ideal para compras que exigem cartões internacionais.",
      },
      {
        q: "Como funcionam as transferências internacionais?",
        a: "Você paga em Kwanzas e o destinatário recebe na moeda local do país de destino. Basta fornecer os dados do destinatário e o país de destino. Calculamos o valor com base na taxa de câmbio actual e processamos a transferência após confirmação do pagamento.",
      },
      {
        q: "Quanto tempo demora cada serviço?",
        a: "Cartão Virtual: entregue em minutos via WhatsApp. Acesso Assistido: depende da compra, geralmente 1-2 dias úteis. Transferências: 1-3 dias úteis conforme o país de destino.",
      },
    ],
  },
  {
    category: "Taxas de Câmbio",
    items: [
      {
        q: "Como é definida a taxa de câmbio?",
        a: "A taxa de câmbio é baseada no mercado actual do Kwanza (AOA) face às principais moedas (USD, EUR). Aplicamos uma margem de 3% sobre a taxa de mercado para cobrir custos operacionais e garantir a sustentabilidade do serviço.",
      },
      {
        q: "A taxa de câmbio pode mudar depois de eu fazer o pedido?",
        a: "Não. A taxa aplicada é a que está em vigor no momento da confirmação do pedido. Uma vez confirmado, o valor em Kwanzas fica fixo, independentemente de flutuações posteriores.",
      },
      {
        q: "Como posso verificar a taxa actual?",
        a: "Pode usar o simulador de câmbio disponível na página inicial do site. A taxa é actualizada em tempo real pela nossa equipa administrativa para reflectir as condições de mercado.",
      },
    ],
  },
  {
    category: "Pagamentos",
    items: [
      {
        q: "Como faço o pagamento em Kwanzas?",
        a: "Após submeter o pedido, a nossa equipa contacta-o via WhatsApp com os detalhes do pagamento, incluindo o IBAN ou conta para transferência. O pagamento deve ser feito em Kwanzas (AOA) e confirmado antes do processamento.",
      },
      {
        q: "Quais são as formas de pagamento aceites?",
        a: "Aceitamos transferências bancárias, pagamentos via Multicaixa Express e referências de pagamento. Todos os pagamentos são feitos em Kwanzas. Após a confirmação, processamos o seu pedido imediatamente.",
      },
      {
        q: "É seguro fazer pagamentos através da KwanzaVisa?",
        a: "Sim. Todas as transacções são processadas com os mais altos padrões de segurança. Não armazenamos dados bancários sensíveis e todos os pagamentos são confirmados manualmente pela nossa equipa para evitar fraudes.",
      },
      {
        q: "Posso cancelar um pedido depois de pagar?",
        a: "Se o pedido ainda não foi processado, é possível cancelar e reembolsar. No entanto, uma vez que o pagamento foi enviado ao destinatário ou o cartão emitido, o cancelamento não é possível. Contacte-nos via WhatsApp o mais rápido possível.",
      },
    ],
  },
  {
    category: "Conta e Segurança",
    items: [
      {
        q: "Preciso de criar uma conta para fazer um pedido?",
        a: "Não. Pode fazer pedidos diretamente pelo formulário no site, fornecendo apenas nome, e-mail e WhatsApp. A conta é opcional e serve para acompanhar pedidos e gerir preferências.",
      },
      {
        q: "Os meus dados pessoais estão protegidos?",
        a: "Sim. Seguimos rigorosas políticas de privacidade e protecção de dados. Os seus dados são utilizados apenas para processar pedidos e comunicar consigo. Não partilhamos informações com terceiros sem o seu consentimento.",
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
