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
  const lastUpdated = "8 de Julho de 2026";

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
          <span className="font-bold text-lg">ZYVA</span>
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
          <Section title="1. Aceitação dos Termos">
            <p>
              Ao utilizar os serviços da ZYVA, o utilizador concorda integralmente com estes Termos e Condições. Caso não concorde com qualquer disposição herein contida, o utilizador deve abster-se de utilizar a plataforma.
            </p>
            <p>
              A ZYVA reserva-se no direito de modificar estes termos a qualquer momento. As alterações entram em vigor imediatamente após a sua publicação nesta página. É responsabilidade do utilizador consultar periodicamente este documento.
            </p>
          </Section>

          <Section title="2. Descrição dos Serviços">
            <p>
              A ZYVA é uma plataforma financeira que facilita o acesso de cidadãos angolanos a serviços financeiros internacionais, nomeadamente:
            </p>
            <div className="space-y-3 pl-2">
              <p>
                <strong>a) Cartão Virtual:</strong> Emissão de cartões de pagamento virtuais para utilização em compras online internacionais, entregues via WhatsApp após confirmação do pagamento.
              </p>
              <p>
                <strong>b) Acesso Assistido:</strong> Serviço de compra assistida em que a ZYVA realiza pagamentos em nome do utilizador, utilizando os seus próprios métodos de pagamento internacionais.
              </p>
              <p>
                <strong>c) Transferências Internacionais:</strong> Serviço de transferência de fundos em que o utilizador paga em Kwanzas (AOA) e o destinatário recebe na moeda local do país de destino.
              </p>
            </div>
            <p className="mt-4">
              A ZYVA actua como intermediária financeira e não como instituição bancária. Os serviços estão sujeitos a disponibilidade e a regulamentações locais e internacionais aplicáveis.
            </p>
          </Section>

          <Section title="3. Taxas de Câmbio e Preçário">
            <p>
              As taxas de câmbio aplicadas pela ZYVA são baseadas nas taxas de mercado do Kwanza (AOA) face às moedas estrangeiras, com uma margem operacional de 3% incorporada no valor final.
            </p>
            <p>
              A taxa de câmbio aplicada a cada pedido é fixada no momento da confirmação do pagamento, garantindo que o valor em Kwanzas não sofre alterações posteriores, independentemente de flutuações de mercado.
            </p>
            <p>
              O utilizador pode consultar a taxa de câmbio actual através do simulador disponível no site. A ZYVA reserva-se no direito de actualizar as taxas a qualquer momento, sem aviso prévio, excepto para pedidos já confirmados.
            </p>
          </Section>

          <Section title="4. Responsabilidades do Utilizador">
            <p>
              O utilizador compromete-se a fornecer informações verdadeiras, completas e actualizadas no momento da submissão de pedidos, incluindo nome, contactos e dados do destinatário quando aplicável.
            </p>
            <p>
              O utilizador é responsável por garantir que os fundos utilizados para pagamento são de origem lícita. A ZYVA não se responsabiliza pela legitimidade dos fundos fornecidos pelo utilizador.
            </p>
            <p>
              O utilizador compromete-se a utilizar os serviços exclusivamente para fins lícitos e em conformidade com a legislação angolana e internacional aplicável. É proibido utilizar os serviços para actividades fraudulentas, lavagem de dinheiro ou financiamento de actividades ilícitas.
            </p>
            <p>
              O utilizador deve manter a confidencialidade das informações dos cartões virtuais recebidos e é responsável por qualquer utilização não autorizada decorrente da partilha ou má guarda desses dados.
            </p>
          </Section>

          <Section title="5. Responsabilidades da ZYVA">
            <p>
              A ZYVA compromete-se a processar os pedidos de forma atempada e profissional, utilizando os meios ao seu dispor para garantir a entrega dos serviços nos prazos estimados.
            </p>
            <p>
              A ZYVA não se responsabiliza por atrasos ou falhas causados por factores externos ao seu controlo, incluindo mas não se limitando a: problemas técnicos de processadoras de pagamento internacionais, restrições governamentais, falhas bancárias, ou eventos de força maior.
            </p>
            <p>
              A ZYVA envida os seus melhores esforços para garantir a segurança das transacções, mas não pode garantir a ausência absoluta de riscos. A responsabilidade da ZYVA está limitada ao valor do serviço prestado.
            </p>
          </Section>

          <Section title="6. Cancelamentos e Reembolsos">
            <p>
              Pedidos podem ser cancelados e reembolsados integralmente caso ainda não tenham sido processados. Uma vez processado o pagamento ao destinatário ou emitido o cartão virtual, o cancelamento não é possível.
            </p>
            <p>
              Para solicitar um cancelamento, o utilizador deve contactar a ZYVA via WhatsApp o mais rapidamente possível, identificando o número do pedido (formato KV-YYYY-NNNN).
            </p>
            <p>
              Reembolsos são processados em Kwanzas (AOA) e devolvidos através do mesmo método de pagamento utilizado originalmente. O prazo para processamento de reembolsos é de 3 a 5 dias úteis.
            </p>
          </Section>

          <Section title="7. Privacidade e Protecção de Dados">
            <p>
              A ZYVA recolhe e processa dados pessoais do utilizador exclusivamente para a prestação dos serviços solicitados, em conformidade com a Lei n.º 22/11 de 17 de Junho (Lei da Protecção de Dados Pessoais de Angola).
            </p>
            <p>
              Os dados pessoais não são partilhados com terceiros sem o consentimento expresso do utilizador, excepto quando exigido por lei ou necessário para a execução do serviço (ex: instituições financeiras parceiras).
            </p>
            <p>
              O utilizador tem o direito de aceder, rectificar ou solicitar a eliminação dos seus dados pessoais, mediante solicitação via WhatsApp ou e-mail.
            </p>
          </Section>

          <Section title="8. Limitação de Responsabilidade">
            <p>
              A ZYVA não será responsável por danos indirectos, incidentais ou consequenciais decorrentes da utilização dos serviços, incluindo perda de lucros, perda de dados ou interrupção de actividades.
            </p>
            <p>
              A responsabilidade total da ZYVA em relação a qualquer pedido está limitada ao valor pago pelo utilizador pelo serviço específico em causa.
            </p>
          </Section>

          <Section title="9. Lei Aplicável e Resolução de Litígios">
            <p>
              Estes Termos e Condições são regidos pela legislação da República de Angola.
            </p>
            <p>
              Qualquer litígio decorrente da utilização dos serviços será, em primeira instância, resolvido através de negociação amigável entre as partes. Na impossibilidade de resolução amigável, o litígio será submetido aos tribunais competentes de Angola.
            </p>
          </Section>

          <Section title="10. Contactos">
            <p>
              Para questões relacionadas com estes Termos e Condições, o utilizador pode contactar a ZYVA através dos canais disponíveis no site, incluindo WhatsApp e e-mail.
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
          <span>© {new Date().getFullYear()} ZYVA · K Digital</span>
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
