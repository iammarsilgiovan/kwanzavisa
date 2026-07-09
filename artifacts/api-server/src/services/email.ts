import { Resend } from "resend";
import { eq, sql } from "drizzle-orm";
import { db, exchangeRatesTable } from "@workspace/db";

let _resend: Resend | null = null;
function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}
const FROM = "KwanzaVisa <onboarding@resend.dev>";
const ADMIN_EMAIL = "mvrsilgiovani@gmail.com";
const DASHBOARD_URL = process.env.DASHBOARD_URL ?? "https://kwanzavisa.com/admin/dashboard";
const FALLBACK_USD_RATE = 952;

async function getUsdRate(): Promise<number> {
  try {
    const [latest] = await db
      .select()
      .from(exchangeRatesTable)
      .where(eq(exchangeRatesTable.currency, "USD"))
      .orderBy(sql`${exchangeRatesTable.createdAt} DESC`)
      .limit(1);
    if (latest) return parseFloat(latest.rate);
  } catch {
    // fall through to default
  }
  return FALLBACK_USD_RATE;
}

function formatKz(kz: number): string {
  return Math.round(kz).toLocaleString("pt-PT") + " Kz";
}

async function usdToKz(amountUsd: number): Promise<number> {
  const rate = await getUsdRate();
  return Math.round(amountUsd * rate);
}

const PAYMENT_DETAILS_HTML = `
  <table style="width:100%;border-collapse:collapse;margin:16px 0;">
    <tr><td style="padding:8px 0;border-bottom:1px solid #E5E5EA;"><span style="color:#6E6E73;font-size:12px;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;">IBAN</span><br><span style="font-size:15px;font-weight:700;color:#1D1D1F;">0006 0000 02167174301 34</span></td></tr>
    <tr><td style="padding:8px 0;border-bottom:1px solid #E5E5EA;"><span style="color:#6E6E73;font-size:12px;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;">Nome</span><br><span style="font-size:15px;font-weight:700;color:#1D1D1F;">K Digital Prestação de Serviços</span></td></tr>
    <tr><td style="padding:8px 0;border-bottom:1px solid #E5E5EA;"><span style="color:#6E6E73;font-size:12px;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;">Entidade</span><br><span style="font-size:15px;font-weight:700;color:#1D1D1F;">10116 — Paypay África</span></td></tr>
    <tr><td style="padding:8px 0;"><span style="color:#6E6E73;font-size:12px;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;">Referência</span><br><span style="font-size:15px;font-weight:700;color:#1D1D1F;">935975173</span></td></tr>
  </table>
`;

function layout(content: string) {
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#F5F5F7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
    <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:18px;overflow:hidden;border:1px solid #E5E5EA;">
      <div style="background:#000;padding:24px 32px;">
        <span style="color:#fff;font-size:20px;font-weight:700;letter-spacing:-0.02em;">KwanzaVisa</span>
      </div>
      <div style="padding:32px;">${content}</div>
      <div style="background:#F5F5F7;padding:16px 32px;border-top:1px solid #E5E5EA;text-align:center;">
        <span style="color:#6E6E73;font-size:12px;">KwanzaVisa · K Digital</span>
      </div>
    </div>
  </body></html>`;
}

export async function sendEmail(to: string, subject: string, html: string) {
  const resend = getResend();
  if (!resend) return;
  await resend.emails.send({ from: FROM, to, subject, html });
}

const SERVICE_LABELS: Record<string, string> = {
  cartao_virtual: "Cartão Virtual",
  acesso_assistido: "Acesso Assistido",
  transferencia: "Transferência Internacional",
};

export async function emailOrderCreatedCliente(opts: {
  to: string; id: string; service: string; amountUsd?: number | null; name: string;
}) {
  const serviceName = SERVICE_LABELS[opts.service] ?? opts.service;

  let valorHtml = "";
  if (opts.amountUsd) {
    const kz = await usdToKz(opts.amountUsd);
    valorHtml = `
      <div style="background:#000;border-radius:12px;padding:20px;margin:20px 0;">
        <p style="color:#A1A1A6;font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;margin:0 0 6px;">Total a Pagar</p>
        <p style="font-size:28px;font-weight:800;color:#fff;margin:0 0 4px;">${formatKz(kz)}</p>
        <p style="color:#6E6E73;font-size:13px;margin:0;">≈ $${opts.amountUsd} USD · taxa do dia</p>
      </div>`;
  }

  const html = layout(`
    <h2 style="font-size:22px;font-weight:700;color:#1D1D1F;margin:0 0 8px;">Pedido recebido!</h2>
    <p style="color:#6E6E73;font-size:15px;margin:0 0 24px;">O teu pedido foi registado com sucesso. Efectua o pagamento para prosseguirmos.</p>
    <div style="background:#F5F5F7;border-radius:12px;padding:20px;margin-bottom:16px;">
      <p style="color:#6E6E73;font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;margin:0 0 4px;">ID do Pedido</p>
      <p style="font-size:22px;font-family:monospace;font-weight:800;color:#1D1D1F;margin:0 0 8px;">${opts.id}</p>
      <p style="color:#1D1D1F;font-size:14px;margin:0;">Serviço: <strong>${serviceName}</strong></p>
    </div>
    ${valorHtml}
    <h3 style="font-size:16px;font-weight:700;color:#1D1D1F;margin:24px 0 8px;">Dados de Pagamento</h3>
    ${PAYMENT_DETAILS_HTML}
    <p style="color:#6E6E73;font-size:14px;margin:20px 0 0;">Após efectuar o pagamento, envia o comprovativo em <a href="https://kwanzavisa.com/#rastrear" style="color:#000;font-weight:600;">Rastrear Pedido</a> na plataforma.</p>
  `);
  await sendEmail(opts.to, `Pedido recebido · ${opts.id}`, html);
}

export async function emailOrderCreatedAdmin(opts: {
  id: string; service: string; amountUsd?: number | null; name: string; email: string; formattedDate: string;
}) {
  const serviceName = SERVICE_LABELS[opts.service] ?? opts.service;

  let amountRow = "";
  if (opts.amountUsd) {
    const kz = await usdToKz(opts.amountUsd);
    amountRow = `
      <tr><td style="padding:8px 0;border-bottom:1px solid #E5E5EA;color:#6E6E73;font-size:13px;">Valor (Kz)</td><td style="padding:8px 0;border-bottom:1px solid #E5E5EA;font-weight:700;color:#1D1D1F;">${formatKz(kz)}</td></tr>
      <tr><td style="padding:8px 0;border-bottom:1px solid #E5E5EA;color:#6E6E73;font-size:13px;">Valor (USD)</td><td style="padding:8px 0;border-bottom:1px solid #E5E5EA;font-weight:600;">$${opts.amountUsd}</td></tr>`;
  }

  const html = layout(`
    <h2 style="font-size:20px;font-weight:700;color:#1D1D1F;margin:0 0 16px;">🆕 Novo pedido recebido</h2>
    <table style="width:100%;border-collapse:collapse;">
      <tr><td style="padding:8px 0;border-bottom:1px solid #E5E5EA;color:#6E6E73;font-size:13px;width:40%;">ID</td><td style="padding:8px 0;border-bottom:1px solid #E5E5EA;font-weight:700;font-family:monospace;">${opts.id}</td></tr>
      <tr><td style="padding:8px 0;border-bottom:1px solid #E5E5EA;color:#6E6E73;font-size:13px;">Serviço</td><td style="padding:8px 0;border-bottom:1px solid #E5E5EA;font-weight:600;">${serviceName}</td></tr>
      ${amountRow}
      <tr><td style="padding:8px 0;border-bottom:1px solid #E5E5EA;color:#6E6E73;font-size:13px;">Cliente</td><td style="padding:8px 0;border-bottom:1px solid #E5E5EA;">${opts.name}</td></tr>
      <tr><td style="padding:8px 0;border-bottom:1px solid #E5E5EA;color:#6E6E73;font-size:13px;">Email</td><td style="padding:8px 0;border-bottom:1px solid #E5E5EA;">${opts.email}</td></tr>
      <tr><td style="padding:8px 0;color:#6E6E73;font-size:13px;">Data</td><td style="padding:8px 0;">${opts.formattedDate}</td></tr>
    </table>
    <a href="${DASHBOARD_URL}" style="display:inline-block;margin-top:24px;background:#000;color:#fff;padding:12px 24px;border-radius:10px;font-weight:600;font-size:14px;text-decoration:none;">Ver no Dashboard</a>
  `);
  await sendEmail(ADMIN_EMAIL, `Novo pedido · ${opts.id}`, html);
}

export async function emailStatusPagoCliente(opts: { to: string; id: string; name: string; service: string; amountUsd?: number | null }) {
  const serviceName = SERVICE_LABELS[opts.service] ?? opts.service;

  let amountHtml = "";
  if (opts.amountUsd) {
    const kz = await usdToKz(opts.amountUsd);
    amountHtml = `
      <div style="margin-top:12px;padding-top:12px;border-top:1px solid #E5E5EA;">
        <p style="color:#6E6E73;font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;margin:0 0 4px;">Valor Pago</p>
        <p style="font-size:20px;font-weight:800;color:#1D1D1F;margin:0 0 2px;">${formatKz(kz)}</p>
        <p style="color:#6E6E73;font-size:13px;margin:0;">≈ $${opts.amountUsd} USD</p>
      </div>`;
  }

  const html = layout(`
    <h2 style="font-size:22px;font-weight:700;color:#1D1D1F;margin:0 0 8px;">Pagamento confirmado ✅</h2>
    <p style="color:#6E6E73;font-size:15px;margin:0 0 24px;">Olá ${opts.name.split(" ")[0]}, o teu pagamento foi recebido. O teu pedido está agora em execução.</p>
    <div style="background:#F5F5F7;border-radius:12px;padding:20px;">
      <p style="color:#6E6E73;font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;margin:0 0 4px;">ID do Pedido</p>
      <p style="font-size:22px;font-family:monospace;font-weight:800;color:#1D1D1F;margin:0 0 8px;">${opts.id}</p>
      <p style="color:#1D1D1F;font-size:14px;margin:0;">Serviço: <strong>${serviceName}</strong></p>
      ${amountHtml}
    </div>
    <p style="color:#6E6E73;font-size:14px;margin:20px 0 0;">Iremos contactar-te via WhatsApp brevemente para concluir o processo.</p>
  `);
  await sendEmail(opts.to, `Pagamento confirmado · ${opts.id}`, html);
}

export async function emailStatusConcluidoCliente(opts: { to: string; id: string; name: string; service: string }) {
  const serviceName = SERVICE_LABELS[opts.service] ?? opts.service;
  const html = layout(`
    <h2 style="font-size:22px;font-weight:700;color:#1D1D1F;margin:0 0 8px;">Pedido concluído 🎉</h2>
    <p style="color:#6E6E73;font-size:15px;margin:0 0 24px;">Olá ${opts.name.split(" ")[0]}, o teu pedido foi concluído com sucesso. Obrigado por escolheres a KwanzaVisa!</p>
    <div style="background:#F5F5F7;border-radius:12px;padding:20px;">
      <p style="color:#6E6E73;font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;margin:0 0 4px;">ID do Pedido</p>
      <p style="font-size:22px;font-family:monospace;font-weight:800;color:#1D1D1F;margin:0 0 8px;">${opts.id}</p>
      <p style="color:#1D1D1F;font-size:14px;margin:0;">Serviço: <strong>${serviceName}</strong></p>
    </div>
    <p style="color:#6E6E73;font-size:14px;margin:20px 0 0;">Voltamos a ver-nos em breve. Qualquer dúvida, contacta-nos via WhatsApp.</p>
  `);
  await sendEmail(opts.to, `Pedido concluído · ${opts.id}`, html);
}

export async function emailStatusEmExecucaoCliente(opts: { to: string; id: string; name: string; service: string }) {
  const serviceName = SERVICE_LABELS[opts.service] ?? opts.service;
  const html = layout(`
    <h2 style="font-size:22px;font-weight:700;color:#1D1D1F;margin:0 0 8px;">Pedido em execução ⚙️</h2>
    <p style="color:#6E6E73;font-size:15px;margin:0 0 24px;">Olá ${opts.name.split(" ")[0]}, o teu pedido está a ser processado pela nossa equipa.</p>
    <div style="background:#F5F5F7;border-radius:12px;padding:20px;">
      <p style="color:#6E6E73;font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;margin:0 0 4px;">ID do Pedido</p>
      <p style="font-size:22px;font-family:monospace;font-weight:800;color:#1D1D1F;margin:0 0 8px;">${opts.id}</p>
      <p style="color:#1D1D1F;font-size:14px;margin:0;">Serviço: <strong>${serviceName}</strong></p>
    </div>
    <p style="color:#6E6E73;font-size:14px;margin:20px 0 0;">Entraremos em contacto via WhatsApp assim que o processo estiver concluído. Não é necessária qualquer acção da tua parte neste momento.</p>
  `);
  await sendEmail(opts.to, `Pedido em execução · ${opts.id}`, html);
}

export async function emailStatusCanceladoCliente(opts: { to: string; id: string; name: string; service: string }) {
  const serviceName = SERVICE_LABELS[opts.service] ?? opts.service;
  const html = layout(`
    <h2 style="font-size:22px;font-weight:700;color:#1D1D1F;margin:0 0 8px;">Pedido cancelado</h2>
    <p style="color:#6E6E73;font-size:15px;margin:0 0 24px;">Olá ${opts.name.split(" ")[0]}, o teu pedido foi cancelado.</p>
    <div style="background:#F5F5F7;border-radius:12px;padding:20px;">
      <p style="color:#6E6E73;font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;margin:0 0 4px;">ID do Pedido</p>
      <p style="font-size:22px;font-family:monospace;font-weight:800;color:#1D1D1F;margin:0 0 8px;">${opts.id}</p>
      <p style="color:#1D1D1F;font-size:14px;margin:0;">Serviço: <strong>${serviceName}</strong></p>
    </div>
    <p style="color:#6E6E73;font-size:14px;margin:20px 0 0;">Se tiveres dúvidas ou achas que isto foi um erro, fala connosco via <a href="https://wa.me/244957636981" style="color:#000;font-weight:600;">WhatsApp</a>.</p>
  `);
  await sendEmail(opts.to, `Pedido cancelado · ${opts.id}`, html);
}

export async function emailStatusPagoAdmin(opts: { id: string; service: string; amountUsd?: number | null }) {
  const serviceName = SERVICE_LABELS[opts.service] ?? opts.service;

  let amountRow = "";
  if (opts.amountUsd) {
    const kz = await usdToKz(opts.amountUsd);
    amountRow = `
      <tr><td style="padding:8px 0;border-bottom:1px solid #E5E5EA;color:#6E6E73;font-size:13px;">Valor (Kz)</td><td style="padding:8px 0;border-bottom:1px solid #E5E5EA;font-weight:700;color:#1D1D1F;">${formatKz(kz)}</td></tr>
      <tr><td style="padding:8px 0;color:#6E6E73;font-size:13px;">Valor (USD)</td><td style="padding:8px 0;font-weight:600;">$${opts.amountUsd}</td></tr>`;
  }

  const html = layout(`
    <h2 style="font-size:20px;font-weight:700;color:#1D1D1F;margin:0 0 16px;">💰 Pagamento efectuado</h2>
    <table style="width:100%;border-collapse:collapse;">
      <tr><td style="padding:8px 0;border-bottom:1px solid #E5E5EA;color:#6E6E73;font-size:13px;width:40%;">ID</td><td style="padding:8px 0;border-bottom:1px solid #E5E5EA;font-weight:700;font-family:monospace;">${opts.id}</td></tr>
      <tr><td style="padding:8px 0;border-bottom:1px solid #E5E5EA;color:#6E6E73;font-size:13px;">Serviço</td><td style="padding:8px 0;border-bottom:1px solid #E5E5EA;font-weight:600;">${serviceName}</td></tr>
      ${amountRow}
    </table>
    <p style="color:#1D1D1F;font-size:14px;margin:20px 0 0;font-weight:600;">Pagamento confirmado. Pedido pronto para execução.</p>
    <a href="${DASHBOARD_URL}" style="display:inline-block;margin-top:16px;background:#000;color:#fff;padding:12px 24px;border-radius:10px;font-weight:600;font-size:14px;text-decoration:none;">Ver no Dashboard</a>
  `);
  await sendEmail(ADMIN_EMAIL, `Pagamento efectuado · ${opts.id}`, html);
}

export async function emailComprovativoAdmin(opts: { id: string; name: string; email: string; service: string }) {
  const serviceName = SERVICE_LABELS[opts.service] ?? opts.service;
  const html = layout(`
    <h2 style="font-size:20px;font-weight:700;color:#1D1D1F;margin:0 0 16px;">📎 Comprovativo enviado</h2>
    <table style="width:100%;border-collapse:collapse;">
      <tr><td style="padding:8px 0;border-bottom:1px solid #E5E5EA;color:#6E6E73;font-size:13px;width:40%;">ID</td><td style="padding:8px 0;border-bottom:1px solid #E5E5EA;font-weight:700;font-family:monospace;">${opts.id}</td></tr>
      <tr><td style="padding:8px 0;border-bottom:1px solid #E5E5EA;color:#6E6E73;font-size:13px;">Cliente</td><td style="padding:8px 0;border-bottom:1px solid #E5E5EA;">${opts.name}</td></tr>
      <tr><td style="padding:8px 0;border-bottom:1px solid #E5E5EA;color:#6E6E73;font-size:13px;">Email</td><td style="padding:8px 0;border-bottom:1px solid #E5E5EA;">${opts.email}</td></tr>
      <tr><td style="padding:8px 0;color:#6E6E73;font-size:13px;">Serviço</td><td style="padding:8px 0;">${serviceName}</td></tr>
    </table>
    <a href="${DASHBOARD_URL}" style="display:inline-block;margin-top:24px;background:#000;color:#fff;padding:12px 24px;border-radius:10px;font-weight:600;font-size:14px;text-decoration:none;">Ver no Dashboard</a>
  `);
  await sendEmail(ADMIN_EMAIL, `Comprovativo enviado · ${opts.id}`, html);
}
