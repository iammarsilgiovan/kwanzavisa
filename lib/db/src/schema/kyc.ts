import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const kycDocumentsTable = pgTable("kyc_documents", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  tipo: text("tipo").notNull(), // bi_frente | bi_verso | selfie
  base64Data: text("base64_data").notNull(),
  fileName: text("file_name"),
  mimeType: text("mime_type"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const kycStatusTable = pgTable("kyc_status", {
  userId: text("user_id")
    .primaryKey()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("not_submitted"), // not_submitted | pending | approved | rejected
  reviewedBy: text("reviewed_by"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  rejectReason: text("reject_reason"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type KycDocument = typeof kycDocumentsTable.$inferSelect;
export type KycStatus = typeof kycStatusTable.$inferSelect;
