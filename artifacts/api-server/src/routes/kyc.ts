import { Router } from "express";
import { db } from "@workspace/db";
import { kycDocumentsTable, kycStatusTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/requireAuth";

const router = Router();
const KYC_TIPOS = ["bi_frente", "bi_verso", "selfie"] as const;
type KycTipo = (typeof KYC_TIPOS)[number];

router.post("/kyc/upload", requireAuth, async (req: AuthRequest, res) => {
  const { tipo, base64Data, fileName, mimeType } = req.body as {
    tipo: string;
    base64Data: string;
    fileName?: string;
    mimeType?: string;
  };
  if (!KYC_TIPOS.includes(tipo as KycTipo)) {
    res.status(400).json({ error: "Tipo de documento inválido. Use: bi_frente, bi_verso, selfie" });
    return;
  }
  if (!base64Data?.startsWith("data:")) {
    res.status(400).json({ error: "base64Data inválido" });
    return;
  }
  const existing = await db.select({ id: kycDocumentsTable.id })
    .from(kycDocumentsTable)
    .where(and(eq(kycDocumentsTable.userId, req.userId!), eq(kycDocumentsTable.tipo, tipo)))
    .limit(1);

  if (existing.length > 0) {
    await db.update(kycDocumentsTable)
      .set({ base64Data, fileName: fileName ?? null, mimeType: mimeType ?? null })
      .where(eq(kycDocumentsTable.id, existing[0].id));
    res.json({ ok: true, action: "updated" });
  } else {
    await db.insert(kycDocumentsTable).values({
      userId: req.userId!,
      tipo,
      base64Data,
      fileName: fileName ?? null,
      mimeType: mimeType ?? null,
    });
    res.json({ ok: true, action: "created" });
  }
});

router.post("/kyc/submit", requireAuth, async (req: AuthRequest, res) => {
  const docs = await db.select({ tipo: kycDocumentsTable.tipo })
    .from(kycDocumentsTable)
    .where(eq(kycDocumentsTable.userId, req.userId!));

  const tiposPresentes = docs.map((d) => d.tipo);
  const missing = KYC_TIPOS.filter((t) => !tiposPresentes.includes(t));
  if (missing.length > 0) {
    res.status(400).json({ error: `Documentos em falta: ${missing.join(", ")}` });
    return;
  }

  const current = await db.select({ status: kycStatusTable.status })
    .from(kycStatusTable)
    .where(eq(kycStatusTable.userId, req.userId!))
    .limit(1);

  if (current[0]?.status === "approved") {
    res.status(409).json({ error: "KYC já aprovado" });
    return;
  }

  await db.insert(kycStatusTable)
    .values({ userId: req.userId!, status: "pending" })
    .onConflictDoUpdate({
      target: kycStatusTable.userId,
      set: { status: "pending", reviewedBy: null, reviewedAt: null, rejectReason: null, updatedAt: new Date() },
    });

  res.json({ ok: true, status: "pending" });
});

router.get("/kyc/status", requireAuth, async (req: AuthRequest, res) => {
  const [status] = await db.select()
    .from(kycStatusTable)
    .where(eq(kycStatusTable.userId, req.userId!))
    .limit(1);

  const docs = await db.select({ tipo: kycDocumentsTable.tipo, createdAt: kycDocumentsTable.createdAt })
    .from(kycDocumentsTable)
    .where(eq(kycDocumentsTable.userId, req.userId!));

  res.json({
    status: status?.status ?? "not_submitted",
    rejectReason: status?.rejectReason ?? null,
    reviewedAt: status?.reviewedAt ?? null,
    uploadedDocs: docs.map((d) => ({ tipo: d.tipo, uploadedAt: d.createdAt })),
  });
});

export default router;
