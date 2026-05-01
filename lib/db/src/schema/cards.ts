import { pgTable, text, serial, integer, numeric, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const cardsTable = pgTable("cards", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  orderId: text("order_id"),
  providerCardId: text("provider_card_id"),
  last4: text("last4").notNull(),
  expiryMonth: integer("expiry_month").notNull(),
  expiryYear: integer("expiry_year").notNull(),
  cardNumberEncrypted: text("card_number_encrypted"),
  cvvEncrypted: text("cvv_encrypted"),
  cardholderName: text("cardholder_name").notNull(),
  status: text("status").notNull().default("active"), // active | blocked | cancelled
  balanceUsd: numeric("balance_usd", { precision: 12, scale: 2 }).notNull().default("0"),
  issuedBy: text("issued_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const cardTransactionsTable = pgTable("card_transactions", {
  id: serial("id").primaryKey(),
  cardId: text("card_id")
    .notNull()
    .references(() => cardsTable.id, { onDelete: "cascade" }),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  merchant: text("merchant"),
  tipo: text("tipo").notNull().default("fund"), // fund | debit | credit | block | unblock
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Card = typeof cardsTable.$inferSelect;
export type CardTransaction = typeof cardTransactionsTable.$inferSelect;
