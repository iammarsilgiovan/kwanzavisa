import { Router, type IRouter } from "express";
import { sendAdminOtpEmail } from "../services/email";

const router: IRouter = Router();

// Armazena códigos OTP em memória: { code, expiresAt }
const otpStore = new Map<string, { code: string; expiresAt: number }>();

// Único "slot" de OTP para o admin — chave fixa
const ADMIN_OTP_KEY = "admin";

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// POST /api/admin/login — Step 1: validar senha e enviar OTP
router.post("/admin/login", async (req, res): Promise<void> => {
  const { password } = req.body as { password?: string };
  const adminSecret = process.env.ADMIN_PASSWORD || "kwanza2025admin";

  if (!password || password !== adminSecret) {
    res.status(401).json({ error: "Senha incorrecta", message: "Credenciais de administrador inválidas" });
    return;
  }

  // Gerar e armazenar OTP
  const code = generateOtp();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutos
  otpStore.set(ADMIN_OTP_KEY, { code, expiresAt });

  // Enviar por email (não bloquear se falhar — log apenas)
  try {
    await sendAdminOtpEmail(code);
  } catch (err) {
    console.error("[2FA] Falha ao enviar email OTP:", err);
    // Continuar mesmo sem email — o código fica em log para debug
    console.log(`[2FA] Código OTP gerado: ${code}`);
  }

  res.json({ ok: true, step: "2fa_required", message: "Código enviado para o email do administrador." });
});

// POST /api/admin/login/verify — Step 2: verificar código OTP
router.post("/admin/login/verify", (req, res): void => {
  const { code } = req.body as { code?: string };

  if (!code) {
    res.status(400).json({ error: "Código ausente", message: "Insira o código de verificação." });
    return;
  }

  const stored = otpStore.get(ADMIN_OTP_KEY);

  if (!stored) {
    res.status(401).json({ error: "Sessão expirada", message: "Solicite um novo código de acesso." });
    return;
  }

  if (Date.now() > stored.expiresAt) {
    otpStore.delete(ADMIN_OTP_KEY);
    res.status(401).json({ error: "Código expirado", message: "O código expirou. Por favor, faça login novamente." });
    return;
  }

  if (code.trim() !== stored.code) {
    res.status(401).json({ error: "Código inválido", message: "O código inserido não está correcto. Tente novamente." });
    return;
  }

  // OTP correcto — limpar e retornar token
  otpStore.delete(ADMIN_OTP_KEY);
  const token = process.env.ADMIN_PASSWORD || "kwanza2025admin";

  res.json({ ok: true, token, message: "Autenticação concluída com sucesso." });
});

export default router;
