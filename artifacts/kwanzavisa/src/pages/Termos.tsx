import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-xl font-bold mb-4 text-foreground">{title}</h2>
      <div className="text-muted-foreground leading-relaxed space-y-3 text-sm">
        {children}
      </div>
    </section>
  );
}

export default function Termos() {
  const lastUpdated = "11 de Julho de 2026";

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* Header */}
      <header className="border-b border-border bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-6 max-w-3xl py-4 flex items-center justify-between">
          <Link href="/">
            <a className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
              <ArrowLeft className="w-4 h-4" />
              Voltar ao início
            </a>
          </Link>
          <span className="font-bold text-lg">KwanzaVisa</span>
        </div>
      </header>

      <main className="container mx-auto px-6 max-w-3xl py-16">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <span className="inline-block bg-black text-white text-xs font-bold px-3 py-1.5 rounded-full tracking-widest uppercase mb-6">
            Legal
          </span>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4">
            Termos de Uso
          </h1>
          <p className="text-muted-foreground text-sm">
            Última actualização: {lastUpdated}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white border border-border rounded-3xl p-8 md:p-12"
        >
          <Section title="1. Identificação do Prestador">
            <p>
              A plataforma KwanzaVisa é operada pela <strong>K Digital Prestação de Serviços</strong>,
              empresa registada em Angola, dedicada à intermediação de pagamentos
              internacionais para clientes angolanos.
            </p>
            <p>
              Para qualquer questão, pode contactar-nos através do WhatsApp{" "}
              <strong>+244 957 636 981</strong> ou pelo email{" "}
              <strong>suporte@kwanzavisa.com</strong>.
            </p>
          </Section>

          <Section title="2. Descrição dos Serviços">
            <p>A KwanzaVisa oferece os seguintes serviços de intermediação:</p>
            <ul className="list-disc list-inside space-y-2 pl-2">
              <li>
                <strong>Cartão Virtual:</strong> Criação de cartões de pagamento virtual
                temporários para compras em lojas internacionais online.
              </li>
              <li>
                <strong>Acesso Assistido:</strong> Realização de pagamentos e subscrições
                em plataformas digitais internacionais (streaming, software, jogos, etc.)
                em nome do cliente.
              </li>
              <li>
                <strong>Auxilio para Envio de Remessas:</strong> Intermediação para envio
                de valores monetários para destinatários no exterior.
              </li>
            </ul>
          </Section>

          <Section title="3. Processo de Pedido e Pagamento">
            <p>
              Ao submeter um pedido na plataforma, o cliente compromete-se a fornecer
              informações verdadeiras, completas e actualizadas.
            </p>
            <p>
              Após a submissão do pedido, o cliente receberá os dados de pagamento por
              email. O pagamento deve ser efectuado em Kwanzas Angolanos (AOA) para a
              conta bancária indicada ou via Paypay África.
            </p>
            <p>
              O pedido só é processado após a confirmação do recebimento do pagamento
              pela nossa equipa. O cliente deve enviar o comprovativo de pagamento
              através da secção "Rastrear Pedido" do site ou via WhatsApp.
            </p>
            <p>
              As taxas de câmbio aplicadas são as vigentes no momento do processamento
              do pedido e podem divergir das estimativas apresentadas no simulador.
            </p>
          </Section>

          <Section title="4. Obrigações do Cliente">
            <p>O cliente compromete-se a:</p>
            <ul className="list-disc list-inside space-y-2 pl-2">
              <li>
                Fornecer informações verdadeiras e correctas no formulário de pedido.
              </li>
              <li>
                Não utilizar os serviços para fins ilegais, fraudulentos ou contrários
                à legislação angolana ou internacional.
              </li>
              <li>
                Efectuar o pagamento dentro de 48 horas após a recepção dos dados
                de pagamento, findo o qual o pedido poderá ser cancelado.
              </li>
              <li>
                Para serviços de Acesso Assistido, garantir que possui os direitos
                legítimos sobre a conta onde o acesso será efectuado.
              </li>
            </ul>
          </Section>

          <Section title="5. Responsabilidades da KwanzaVisa">
            <p>A KwanzaVisa compromete-se a:</p>
            <ul className="list-disc list-inside space-y-2 pl-2">
              <li>
                Processar os pedidos de forma diligente e no prazo acordado após
                confirmação do pagamento.
              </li>
              <li>
                Manter a confidencialidade dos dados do cliente e não os partilhar
                com terceiros sem consentimento.
              </li>
              <li>
                Comunicar proactivamente qualquer impossibilidade de processar o
                pedido e proceder ao reembolso integral nesse caso.
              </li>
            </ul>
          </Section>

          <Section title="6. Política de Reembolsos">
            <p>
              <strong>Reembolso total:</strong> Caso a KwanzaVisa não consiga processar
              o pedido por razões internas (indisponibilidade do serviço, problemas
              técnicos, etc.), o cliente tem direito ao reembolso integral do valor pago.
            </p>
            <p>
              <strong>Desistência pelo cliente:</strong> Pedidos cancelados pelo cliente
              após o início do processamento podem não ser reembolsáveis, dependendo
              do estado do processamento. Cada caso será analisado individualmente.
            </p>
            <p>
              <strong>Informações incorrectas:</strong> A KwanzaVisa não se responsabiliza
              por pedidos que não possam ser processados devido a informações incorrectas
              fornecidas pelo cliente (ex.: dados de cartão errados, endereço inválido).
            </p>
          </Section>

          <Section title="7. Limitações de Responsabilidade">
            <p>
              A KwanzaVisa actua como intermediária e não é responsável por:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-2">
              <li>
                Decisões tomadas por plataformas terceiras (recusa de pagamento,
                encerramento de conta, etc.).
              </li>
              <li>
                Variações nas taxas de câmbio após a submissão do pedido.
              </li>
              <li>
                Atrasos causados por terceiros (bancos, operadores de transferência, etc.).
              </li>
              <li>
                Danos indirectos resultantes do uso ou da impossibilidade de uso dos serviços.
              </li>
            </ul>
          </Section>

          <Section title="8. Privacidade e Protecção de Dados">
            <p>
              Os dados pessoais recolhidos (nome, email, WhatsApp) são utilizados
              exclusivamente para a prestação dos serviços solicitados e para comunicação
              com o cliente.
            </p>
            <p>
              Não partilhamos dados pessoais com terceiros para fins comerciais. Os dados
              de login fornecidos para Acesso Assistido são usados apenas para o pedido
              específico e não são armazenados de forma permanente.
            </p>
          </Section>

          <Section title="9. Alterações aos Termos">
            <p>
              A KwanzaVisa reserva-se o direito de alterar estes Termos de Uso a qualquer
              momento. As alterações serão publicadas nesta página com a data de actualização.
              O uso continuado dos serviços após a publicação das alterações implica a
              aceitação dos novos termos.
            </p>
          </Section>

          <Section title="10. Lei Aplicável">
            <p>
              Estes Termos de Uso são regidos pela legislação da República de Angola.
              Qualquer litígio será submetido aos tribunais competentes angolanos.
            </p>
          </Section>

          <div className="mt-10 pt-8 border-t border-border text-center">
            <p className="text-xs text-muted-foreground">
              Para questões relacionadas com estes termos, contacte-nos em{" "}
              <a
                href="mailto:suporte@kwanzavisa.com"
                className="text-foreground font-semibold hover:underline"
              >
                suporte@kwanzavisa.com
              </a>
            </p>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-8 py-8 text-center text-sm text-muted-foreground">
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
