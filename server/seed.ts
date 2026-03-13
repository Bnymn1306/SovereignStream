import { db } from "./db";
import { creators, contents } from "@shared/schema";
import { sql } from "drizzle-orm";

export async function seedDatabase() {
  const existingCreators = await db.select().from(creators);
  if (existingCreators.length > 0) return;

  const [creator1] = await db.insert(creators).values({
    walletAddress: "0x1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890",
    displayName: "Alex Rivera",
    bio: "Web3 educator and blockchain developer sharing tutorials on DeFi, Move, and Aptos development.",
    avatarUrl: null,
    totalEarned: "12.5000",
    totalViews: 47,
  }).returning();

  const [creator2] = await db.insert(creators).values({
    walletAddress: "0x9f8e7d6c5b4a3210fedcba0987654321fedcba0987654321fedcba0987654321",
    displayName: "Sasha Nakamoto",
    bio: "Crypto analyst providing in-depth research papers and market analysis.",
    avatarUrl: null,
    totalEarned: "8.2500",
    totalViews: 31,
  }).returning();

  const [creator3] = await db.insert(creators).values({
    walletAddress: "0xaabbccdd11223344556677889900aabbccdd11223344556677889900aabbccdd",
    displayName: "Marcus Chen",
    bio: "Full-stack developer creating coding tutorials and architecture deep dives.",
    avatarUrl: null,
    totalEarned: "5.7500",
    totalViews: 22,
  }).returning();

  const seedContents = [
    {
      creatorId: creator1.id,
      title: "Introduction to Move Language on Aptos",
      description: "A comprehensive video tutorial covering the fundamentals of Move programming language, resource-oriented programming, and deploying your first module on Aptos testnet.",
      contentType: "video",
      thumbnailUrl: "/images/content-thumb-1.png",
      shelbyBlobId: "shelby_blob_a1b2c3d4e5f6_intro_move",
      priceShelbyUsd: "0.15",
      totalViews: 23,
      totalEarned: "3.4500",
    },
    {
      creatorId: creator1.id,
      title: "DeFi Protocol Architecture Deep Dive",
      description: "Explore the inner workings of decentralized finance protocols, including AMMs, lending pools, and yield farming strategies on Aptos.",
      contentType: "video",
      thumbnailUrl: "/images/content-thumb-2.png",
      shelbyBlobId: "shelby_blob_g7h8i9j0k1l2_defi_deep",
      priceShelbyUsd: "0.25",
      totalViews: 14,
      totalEarned: "3.5000",
    },
    {
      creatorId: creator2.id,
      title: "Aptos Ecosystem Q1 2026 Analysis",
      description: "Detailed research report covering TVL growth, developer activity, and emerging protocols in the Aptos ecosystem during Q1 2026.",
      contentType: "pdf",
      thumbnailUrl: "/images/content-thumb-3.png",
      shelbyBlobId: "shelby_blob_m3n4o5p6q7r8_q1_analysis",
      priceShelbyUsd: "0.50",
      totalViews: 18,
      totalEarned: "9.0000",
    },
    {
      creatorId: creator2.id,
      title: "Token Economics Masterclass",
      description: "Understanding tokenomics design patterns, incentive mechanisms, and sustainable economic models for Web3 projects.",
      contentType: "video",
      thumbnailUrl: "/images/content-thumb-4.png",
      shelbyBlobId: "shelby_blob_s9t0u1v2w3x4_tokenomics",
      priceShelbyUsd: "0.30",
      totalViews: 9,
      totalEarned: "2.7000",
    },
    {
      creatorId: creator3.id,
      title: "Building Decentralized Storage with Shelby Protocol",
      description: "Step-by-step guide on integrating Shelby Protocol's hot storage for sub-second content delivery in your dApps. Covers Clay Codes, fragmentation, and retrieval optimization.",
      contentType: "video",
      thumbnailUrl: "/images/content-thumb-5.png",
      shelbyBlobId: "shelby_blob_y5z6a7b8c9d0_shelby_guide",
      priceShelbyUsd: "0.20",
      totalViews: 15,
      totalEarned: "3.0000",
    },
  ];

  await db.insert(contents).values(seedContents);
  console.log("Database seeded with sample content");
}
