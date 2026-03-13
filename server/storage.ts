import {
  type Creator, type InsertCreator,
  type Content, type InsertContent,
  type Purchase, type InsertPurchase,
  creators, contents, purchases
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getCreator(id: string): Promise<Creator | undefined>;
  getCreatorByWallet(walletAddress: string): Promise<Creator | undefined>;
  createCreator(creator: InsertCreator): Promise<Creator>;
  updateCreator(id: string, data: Partial<InsertCreator>): Promise<Creator | undefined>;

  getAllContents(): Promise<Content[]>;
  getContent(id: string): Promise<Content | undefined>;
  getContentsByCreator(creatorId: string): Promise<Content[]>;
  createContent(content: InsertContent): Promise<Content>;
  updateContent(id: string, data: Partial<InsertContent>): Promise<Content | undefined>;
  incrementContentViews(id: string, amount: string): Promise<void>;

  getPurchasesByBuyer(buyerWallet: string): Promise<Purchase[]>;
  getPurchasesByContent(contentId: string): Promise<Purchase[]>;
  getPurchaseByTxHash(txHash: string): Promise<Purchase | undefined>;
  createPurchase(purchase: InsertPurchase): Promise<Purchase>;
  checkAccess(contentId: string, buyerWallet: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getCreator(id: string): Promise<Creator | undefined> {
    const [creator] = await db.select().from(creators).where(eq(creators.id, id));
    return creator;
  }

  async getCreatorByWallet(walletAddress: string): Promise<Creator | undefined> {
    const [creator] = await db.select().from(creators).where(eq(creators.walletAddress, walletAddress));
    return creator;
  }

  async createCreator(creator: InsertCreator): Promise<Creator> {
    const [newCreator] = await db.insert(creators).values(creator).returning();
    return newCreator;
  }

  async updateCreator(id: string, data: Partial<InsertCreator>): Promise<Creator | undefined> {
    const [updated] = await db.update(creators).set(data).where(eq(creators.id, id)).returning();
    return updated;
  }

  async getAllContents(): Promise<Content[]> {
    return db.select().from(contents).where(eq(contents.status, "active")).orderBy(desc(contents.createdAt));
  }

  async getContent(id: string): Promise<Content | undefined> {
    const [content] = await db.select().from(contents).where(eq(contents.id, id));
    return content;
  }

  async getContentsByCreator(creatorId: string): Promise<Content[]> {
    return db.select().from(contents).where(eq(contents.creatorId, creatorId)).orderBy(desc(contents.createdAt));
  }

  async createContent(content: InsertContent): Promise<Content> {
    const [newContent] = await db.insert(contents).values(content).returning();
    return newContent;
  }

  async updateContent(id: string, data: Partial<InsertContent>): Promise<Content | undefined> {
    const [updated] = await db.update(contents).set(data).where(eq(contents.id, id)).returning();
    return updated;
  }

  async incrementContentViews(id: string, amount: string): Promise<void> {
    const content = await this.getContent(id);
    if (content) {
      const newViews = (content.totalViews || 0) + 1;
      const newEarned = (parseFloat(content.totalEarned || "0") + parseFloat(amount)).toString();
      await db.update(contents).set({ totalViews: newViews, totalEarned: newEarned }).where(eq(contents.id, id));

      if (content.creatorId) {
        const creator = await this.getCreator(content.creatorId);
        if (creator) {
          const creatorViews = (creator.totalViews || 0) + 1;
          const creatorEarned = (parseFloat(creator.totalEarned || "0") + parseFloat(amount)).toString();
          await db.update(creators).set({ totalViews: creatorViews, totalEarned: creatorEarned }).where(eq(creators.id, content.creatorId));
        }
      }
    }
  }

  async getPurchasesByBuyer(buyerWallet: string): Promise<Purchase[]> {
    return db.select().from(purchases).where(eq(purchases.buyerWallet, buyerWallet)).orderBy(desc(purchases.purchasedAt));
  }

  async getPurchasesByContent(contentId: string): Promise<Purchase[]> {
    return db.select().from(purchases).where(eq(purchases.contentId, contentId));
  }

  async getPurchaseByTxHash(txHash: string): Promise<Purchase | undefined> {
    const [purchase] = await db.select().from(purchases).where(eq(purchases.txHash, txHash));
    return purchase;
  }

  async createPurchase(purchase: InsertPurchase): Promise<Purchase> {
    const [newPurchase] = await db.insert(purchases).values(purchase).returning();
    return newPurchase;
  }

  async checkAccess(contentId: string, buyerWallet: string): Promise<boolean> {
    const [purchase] = await db.select().from(purchases)
      .where(eq(purchases.contentId, contentId))
      .limit(1);
    const allPurchases = await db.select().from(purchases).where(eq(purchases.contentId, contentId));
    const hasAccess = allPurchases.some(p => p.buyerWallet === buyerWallet);
    return hasAccess;
  }
}

export const storage = new DatabaseStorage();
