import { pgTable, text, serial, numeric, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const ordersTable = pgTable("orders", {
  id: text("id").primaryKey(),
  sequenceNumber: integer("sequence_number").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  whatsapp: text("whatsapp").notNull(),
  service: text("service").notNull(),
  platform: text("platform"),
  amountUsd: numeric("amount_usd", { precision: 12, scale: 2 }),
  amountEur: numeric("amount_eur", { precision: 12, scale: 2 }),
  amountKwanza: numeric("amount_kwanza", { precision: 14, scale: 2 }),
  currency: text("currency"),
  description: text("description"),
  destinationCountry: text("destination_country"),
  recipientName: text("recipient_name"),
  message: text("message"),
  status: text("status").notNull().default("pendente"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const orderSequenceTable = pgTable("order_sequence", {
  id: serial("id").primaryKey(),
  year: integer("year").notNull(),
  lastNumber: integer("last_number").notNull().default(0),
});

export const insertOrderSchema = createInsertSchema(ordersTable).omit({ id: true, sequenceNumber: true, createdAt: true });
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof ordersTable.$inferSelect;
