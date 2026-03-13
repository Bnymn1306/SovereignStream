import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const creators = pgTable("creators", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletAddress: text("wallet_address").notNull().unique(),
  displayName: text("display_name").notNull(),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  totalEarned: decimal("total_earned", { precision: 18, scale: 8 }).default("0"),
  totalViews: integer("total_views").default(0),
});

export const contents = pgTable("contents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id").notNull().references(() => creators.id),
  title: text("title").notNull(),
  description: text("description"),
  contentType: text("content_type").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  shelbyBlobId: text("shelby_blob_id"),
  localFilename: text("local_filename"),
  priceShelbyUsd: decimal("price_shelby_usd", { precision: 18, scale: 8 }).notNull(),
  totalViews: integer("total_views").default(0),
  totalEarned: decimal("total_earned", { precision: 18, scale: 8 }).default("0"),
  status: text("status").default("active"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const purchases = pgTable("purchases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contentId: varchar("content_id").notNull().references(() => contents.id),
  buyerWallet: text("buyer_wallet").notNull(),
  creatorWallet: text("creator_wallet").notNull(),
  amountShelbyUsd: decimal("amount_shelby_usd", { precision: 18, scale: 8 }).notNull(),
  txHash: text("tx_hash"),
  purchasedAt: timestamp("purchased_at").defaultNow(),
});

export const insertCreatorSchema = createInsertSchema(creators).omit({ id: true, totalEarned: true, totalViews: true });
export const insertContentSchema = createInsertSchema(contents).omit({ id: true, totalViews: true, totalEarned: true, status: true, createdAt: true });
export const insertPurchaseSchema = createInsertSchema(purchases).omit({ id: true, purchasedAt: true });

export type InsertCreator = z.infer<typeof insertCreatorSchema>;
export type Creator = typeof creators.$inferSelect;
export type InsertContent = z.infer<typeof insertContentSchema>;
export type Content = typeof contents.$inferSelect;
export type InsertPurchase = z.infer<typeof insertPurchaseSchema>;
export type Purchase = typeof purchases.$inferSelect;
