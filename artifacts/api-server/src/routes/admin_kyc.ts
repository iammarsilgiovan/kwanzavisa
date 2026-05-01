import { Router } from "express";
import { db } from "@workspace/db";
import { kycStatusTable, kycDocumentsTable, usersTable } from "@workspace/db/schema";
import { eq, desc, inArray } from "drizzle-orm";

const router = Router();

router.get("/admin/kyc", async (req, res) => {
  const { status } = req.query as { status?: string };
  const rows = await db.select({
    userId: kycStatusTable.userId,
    status: kycStatusTable.status,
    rejectReason: kycStatusTable.rejectReason,
    reviewedBy: kycStatusTable.reviewedBy,
    reviewedAt: kycStatusTable.reviewedAt,
    updatedAt: kycStatusTable.updatedAt,
  })
    .from(kycStatusTable)
    .where(status ? eq(kycStatusTable.status, status) : undefined)
    .orderBy(desc(kycStatusTable.updatedAt));

  if (rows.length === 0) {
    res.json({ kyc: [] });
    return;
  }

  const userIds = rows.map((r) => r.userId);
  const users = await db.select({ id: usersTable.id, nome: usersTable.nome, email: usersTable.email })
    .from(usersTable)
    .where(inArray(usersTable.id, userIds));

  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

  const kyc = rows.map((r) => ({
    ...r,
    user: userMap[r.userId] ?? null,
    formattedDate: r.updatedAt.toLocaleDateString("pt-AO", { day: "2-digit", month: "short", year: "numeric" }),
  }));

  res.json({ kyc });
});

router.get("/admin/kyc/:userId/documents", async (req, res) => {
  const { userId } = req.params;
  const docs = await db.select({
    id: kycDocumentsTable.id,
    tipo: kycDocumentsTable.tipo,
    fileName: kycDocumentsTable.fileName,
    mimeType: kycDocumentsTable.mimeType,
    base64Data: kycDocumentsTable.base64Data,
    createdAt: kycDocumentsTable.createdAt,
  })
    .from(kycDocumentsTable)
    .where(eq(kycDocumentsTable.userId, userId));

  res.json({ documents: docs });
});

router.post("/admin/kyc/:userId/review", async (req, res) => {
  const { userId } = req.params;
  const { action, rejectReason, reviewedBy } = req.body as {
    action: "approve" | "reject";
    rejectReason?: string;
    reviewedBy?: string;
  };

  if (action !== "approve" && action !== "reject") {
    res.status(400).json({ error: "action deve ser 'approve' ou 'reject'" });
    return;
  }
  if (action === "reject" && !rejectReason?.trim()) {
    res.status(400).json({ error: "rejectReason é obrigatório ao rejeitar" });
    return;
  }

  await db.insert(kycStatusTable)
    .values({
      userId,
      status: action === "approve" ? "approved" : "rejected",
      reviewedBy: reviewedBy ?? "admin",
      reviewedAt: new Date(),
      rejectReason: action === "reject" ? rejectReason!.trim() : null,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: kycStatusTable.userId,
      set: {
        status: action === "approve" ? "approved" : "rejected",
        reviewedBy: reviewedBy ?? "admin",
        reviewedAt: new Date(),
        rejectReason: action === "reject" ? rejectReason!.trim() : null,
        updatedAt: new Date(),
      },
    });

  res.json({ ok: true, status: action === "approve" ? "approved" : "rejected" });
});

export default router;
