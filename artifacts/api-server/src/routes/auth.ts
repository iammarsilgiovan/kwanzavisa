import { Router } from "express";
import { randomUUID } from "crypto";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword, verifyPassword, signToken } from "../lib/auth";
import { requireAuth, type AuthRequest } from "../middlewares/requireAuth";

const router = Router();

router.post("/auth/register", async (req, res) => {
  const { nome, email, telefone, password } = req.body as Record<string, string>;
  if (!nome?.trim() || !email?.trim() || !password?.trim()) {
    res.status(400).json({ error: "Nome, e-mail e palavra-passe são obrigatórios" });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: "Palavra-passe deve ter pelo menos 6 caracteres" });
    return;
  }
  const existing = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.email, email.trim().toLowerCase())).limit(1);
  if (existing.length > 0) {
    res.status(409).json({ error: "Este e-mail já está registado" });
    return;
  }
  const id = randomUUID();
  const passwordHash = await hashPassword(password);
  const [user] = await db.insert(usersTable).values({
    id,
    nome: nome.trim(),
    email: email.trim().toLowerCase(),
    telefone: telefone?.trim() || null,
    passwordHash,
    provider: "email",
  }).returning({ id: usersTable.id, nome: usersTable.nome, email: usersTable.email, telefone: usersTable.telefone, createdAt: usersTable.createdAt });

  const token = signToken(user.id);
  res.status(201).json({ token, user: { id: user.id, nome: user.nome, email: user.email, telefone: user.telefone } });
});

router.post("/auth/login", async (req, res) => {
  const { email, password } = req.body as Record<string, string>;
  if (!email?.trim() || !password?.trim()) {
    res.status(400).json({ error: "E-mail e palavra-passe são obrigatórios" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email.trim().toLowerCase())).limit(1);
  if (!user || !user.passwordHash) {
    res.status(401).json({ error: "E-mail ou palavra-passe incorrectos" });
    return;
  }
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    res.status(401).json({ error: "E-mail ou palavra-passe incorrectos" });
    return;
  }
  const token = signToken(user.id);
  res.json({ token, user: { id: user.id, nome: user.nome, email: user.email, telefone: user.telefone } });
});

router.get("/auth/me", requireAuth, async (req: AuthRequest, res) => {
  const [user] = await db.select({ id: usersTable.id, nome: usersTable.nome, email: usersTable.email, telefone: usersTable.telefone, createdAt: usersTable.createdAt }).from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
  if (!user) {
    res.status(404).json({ error: "Utilizador não encontrado" });
    return;
  }
  res.json({ user });
});

export default router;
