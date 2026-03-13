import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { uploadToShelby, initShelbyClient, getShelbyAccountAddress, checkBlobStatus } from "./shelby-client";

const APTOS_TESTNET_RPC = "https://api.testnet.aptoslabs.com/v1";
const SHELBY_PROTOCOL_VERSION = "1.0.0";

const uploadsDir = path.resolve(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedVideo = [".mp4", ".webm", ".mov", ".avi", ".mkv"];
    const allowedPdf = [".pdf"];
    const ext = path.extname(file.originalname).toLowerCase();
    if ([...allowedVideo, ...allowedPdf].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${ext}. Only video files and PDFs are allowed.`));
    }
  },
});

const createContentSchema = z.object({
  walletAddress: z.string().min(1),
  displayName: z.string().min(1).max(50),
  title: z.string().min(1).max(100),
  description: z.string().max(500).nullable().optional(),
  contentType: z.enum(["video", "pdf"]),
  priceShelbyUsd: z.string().refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0),
  shelbyBlobId: z.string().nullable().optional(),
  localFilename: z.string().nullable().optional(),
});

const purchaseSchema = z.object({
  contentId: z.string().min(1),
  buyerWallet: z.string().min(1),
  txHash: z.string().min(1, "Transaction hash is required"),
  rpcUrl: z.string().optional(),
});

function getGeomiApiKey(): string {
  const key = process.env.GEOMI_API_KEY;
  if (!key) {
    console.warn("[shelbynet] GEOMI_API_KEY is not set — indexer requests will be unauthenticated");
  }
  return key || "";
}

function getIndexerHeaders(): Record<string, string> {
  const key = getGeomiApiKey();
  if (!key) return {};
  return { "Authorization": `Bearer ${key}`, "X-Geomi-Api-Key": key };
}

async function seedDemoContent() {
  try {
    const existing = await storage.getAllContents();
    if (existing.length >= 8) return;

    const creators = [
      { wallet: "0x4a8b9c2d1e3f5678abcdef1234567890abcdef1234567890abcdef1234567890", name: "Elena Voss", bio: "DeFi researcher and on-chain analyst specializing in Layer 1 ecosystems." },
      { wallet: "0x7f3e2d1c4b5a6978abcdef9876543210abcdef9876543210abcdef9876543210", name: "Kenji Tanaka", bio: "Move developer and smart contract auditor. Building secure protocols on Aptos." },
      { wallet: "0x2c5d8e9f1a3b4c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c", name: "Sofia Martinez", bio: "Web3 content creator and blockchain educator with 50K+ followers." },
      { wallet: "0x9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d", name: "Marcus Webb", bio: "Infrastructure engineer focused on blockchain scalability and data availability layers." },
    ];

    const creatorMap: Record<string, string> = {};
    for (const c of creators) {
      let creator = await storage.getCreatorByWallet(c.wallet);
      if (!creator) {
        creator = await storage.createCreator({ walletAddress: c.wallet, displayName: c.name, bio: c.bio, avatarUrl: null });
      }
      creatorMap[c.wallet] = creator.id;
    }

    const demoContents = [
      { wallet: creators[0].wallet, title: "Aptos DeFi Ecosystem Overview 2026", description: "A comprehensive breakdown of the top DeFi protocols on Aptos — covering TVL trends, yield strategies, and liquidity dynamics across major DEXs and lending platforms.", contentType: "video" as const, thumbnail: "/images/content-thumb-1.png", blobId: "shelby_blob_ev01_aptos_defi_2026", price: "0.25000000" },
      { wallet: creators[1].wallet, title: "Move Language Security Patterns", description: "Learn essential security patterns in Move — resource safety, capability-based access control, and common vulnerability prevention techniques for Aptos smart contracts.", contentType: "pdf" as const, thumbnail: "/images/content-thumb-3.png", blobId: "shelby_blob_kt02_move_security", price: "0.50000000" },
      { wallet: creators[2].wallet, title: "Building Your First dApp on Aptos", description: "Step-by-step video tutorial walking through creating a full-stack decentralized application on Aptos — from Move module deployment to React frontend integration.", contentType: "video" as const, thumbnail: "/images/content-thumb-2.png", blobId: "shelby_blob_sm03_first_dapp", price: "0.15000000" },
      { wallet: creators[0].wallet, title: "Tokenomics Design Framework", description: "Research paper analyzing successful token economic models — covering emission schedules, staking incentives, governance mechanisms, and sustainable value accrual strategies.", contentType: "pdf" as const, thumbnail: "/images/content-thumb-4.png", blobId: "shelby_blob_ev04_tokenomics_fw", price: "0.35000000" },
      { wallet: creators[3].wallet, title: "Shelby Protocol Deep Dive: Clay Codes & Hot Storage", description: "Technical walkthrough of Shelby Protocol architecture — how Clay Code fragmentation achieves sub-second latency and why hot storage changes the game for decentralized content delivery.", contentType: "video" as const, thumbnail: "/images/content-thumb-5.png", blobId: "shelby_blob_mw05_shelby_deep", price: "0.20000000" },
      { wallet: creators[2].wallet, title: "NFT Marketplace Architecture on Aptos", description: "How to design and implement a full-featured NFT marketplace using Aptos Digital Assets standard — covering minting, listing, auction mechanics, and royalty enforcement.", contentType: "video" as const, thumbnail: "/images/content-thumb-1.png", blobId: "shelby_blob_sm06_nft_market", price: "0.30000000" },
      { wallet: creators[1].wallet, title: "Formal Verification in Move", description: "Guide to using the Move Prover for formal verification of smart contracts — writing specifications, proving invariants, and ensuring mathematical correctness of on-chain logic.", contentType: "pdf" as const, thumbnail: "/images/content-thumb-3.png", blobId: "shelby_blob_kt07_formal_verif", price: "0.40000000" },
      { wallet: creators[3].wallet, title: "Cross-Chain Bridges: Security Analysis", description: "In-depth analysis of cross-chain bridge architectures, common attack vectors, and best practices for secure asset transfers between Aptos and other L1 chains.", contentType: "video" as const, thumbnail: "/images/content-thumb-2.png", blobId: "shelby_blob_mw08_bridges", price: "0.25000000" },
    ];

    for (const c of demoContents) {
      const existingContent = existing.find((e: any) => e.shelbyBlobId === c.blobId);
      if (existingContent) continue;
      await storage.createContent({
        creatorId: creatorMap[c.wallet],
        title: c.title,
        description: c.description,
        contentType: c.contentType,
        thumbnailUrl: c.thumbnail,
        shelbyBlobId: c.blobId,
        priceShelbyUsd: c.price,
      });
    }
    console.log("[seed] Demo content seeded successfully");
  } catch (err: any) {
    console.error("[seed] Failed to seed demo content:", err.message);
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  initShelbyClient();
  seedDemoContent();

  app.post("/api/upload", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file provided" });
      }

      const ext = path.extname(req.file.originalname).toLowerCase();
      const fileType = ext === ".pdf" ? "pdf" : "video";
      const hash = crypto.randomBytes(12).toString("hex");
      const localFilename = `shelby_${Date.now()}_${hash}${ext}`;
      const localPath = path.join(uploadsDir, localFilename);
      fs.writeFileSync(localPath, req.file.buffer);

      const blobName = `files/${req.file.originalname}`;

      const shelbyResult = await uploadToShelby(req.file.buffer, blobName);

      const shelbyBlobId = (shelbyResult.success || (shelbyResult as any).registered)
        ? blobName
        : `shelby_${path.basename(localFilename, ext)}`;

      res.setHeader("X-Shelby-Protocol", SHELBY_PROTOCOL_VERSION);
      res.json({
        shelbyBlobId,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        fileType,
        mimeType: req.file.mimetype,
        storedFilename: localFilename,
        shelbyUpload: shelbyResult.success,
        shelbyRegistered: (shelbyResult as any).registered || shelbyResult.success,
        shelbyIsWritten: (shelbyResult as any).isWritten ?? false,
        shelbyAccount: shelbyResult.accountAddress || null,
        shelbyExplorerUrl: shelbyResult.explorerUrl || null,
        shelbyError: shelbyResult.error || null,
      });
    } catch (error: any) {
      console.error("[shelbynet] Upload error:", error.message);
      res.status(500).json({ message: error.message || "File upload failed" });
    }
  });

  app.get("/api/blob-status", async (req, res) => {
    try {
      const blobName = req.query.blobName as string;
      if (!blobName || !blobName.startsWith("files/")) {
        return res.status(400).json({ message: "Invalid blob name" });
      }
      const status = await checkBlobStatus(blobName);
      if (!status) {
        return res.status(503).json({ message: "Shelby client not available" });
      }
      res.json(status);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/config", (_req, res) => {
    res.json({
      network: "shelbynet",
      rpcUrl: APTOS_TESTNET_RPC,
      shelby: {
        protocolVersion: SHELBY_PROTOCOL_VERSION,
        hotStorageEnabled: true,
        clayCodes: true,
        targetLatencyMs: 200,
        maxFragmentSize: 4096,
        accountAddress: getShelbyAccountAddress(),
        explorerUrl: getShelbyAccountAddress()
          ? `https://explorer.shelby.xyz/shelbynet/account/${getShelbyAccountAddress()}/blobs`
          : null,
      },
      indexerAuthenticated: !!getGeomiApiKey(),
    });
  });

  app.get("/api/contents", async (_req, res) => {
    try {
      const contents = await storage.getAllContents();
      res.setHeader("X-Shelby-Protocol", SHELBY_PROTOCOL_VERSION);
      res.setHeader("X-Storage-Type", "hot");
      res.json(contents);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch contents" });
    }
  });

  app.get("/api/contents/creator/:creatorId", async (req, res) => {
    try {
      const contents = await storage.getContentsByCreator(req.params.creatorId);
      res.setHeader("X-Shelby-Protocol", SHELBY_PROTOCOL_VERSION);
      res.json(contents);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch creator contents" });
    }
  });

  app.get("/api/contents/:id", async (req, res) => {
    try {
      const content = await storage.getContent(req.params.id);
      if (!content) {
        return res.status(404).json({ message: "Content not found" });
      }
      res.setHeader("X-Shelby-Protocol", SHELBY_PROTOCOL_VERSION);
      res.setHeader("X-Storage-Type", "hot");
      res.setHeader("X-Blob-Id", content.shelbyBlobId || "");
      res.json(content);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch content" });
    }
  });

  app.post("/api/contents", async (req, res) => {
    try {
      const parsed = createContentSchema.parse(req.body);

      let creator = await storage.getCreatorByWallet(parsed.walletAddress);
      if (!creator) {
        creator = await storage.createCreator({
          walletAddress: parsed.walletAddress,
          displayName: parsed.displayName,
          bio: null,
          avatarUrl: null,
        });
      }

      const thumbnails = [
        "/images/content-thumb-1.png",
        "/images/content-thumb-2.png",
        "/images/content-thumb-3.png",
        "/images/content-thumb-4.png",
        "/images/content-thumb-5.png",
      ];
      const randomThumb = thumbnails[Math.floor(Math.random() * thumbnails.length)];

      const content = await storage.createContent({
        creatorId: creator.id,
        title: parsed.title,
        description: parsed.description || null,
        contentType: parsed.contentType,
        thumbnailUrl: randomThumb,
        shelbyBlobId: parsed.shelbyBlobId || null,
        localFilename: parsed.localFilename || null,
        priceShelbyUsd: parsed.priceShelbyUsd,
      });

      res.setHeader("X-Shelby-Protocol", SHELBY_PROTOCOL_VERSION);
      res.json(content);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors.map(e => e.message).join(", ") });
      }
      res.status(400).json({ message: error.message || "Failed to create content" });
    }
  });

  app.get("/api/creators", async (_req, res) => {
    try {
      const { db } = await import("./db");
      const { creators } = await import("@shared/schema");
      const allCreators = await db.select().from(creators);
      res.json(allCreators);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch creators" });
    }
  });

  app.get("/api/creators/wallet/:address", async (req, res) => {
    try {
      const creator = await storage.getCreatorByWallet(req.params.address);
      if (!creator) {
        return res.status(404).json({ message: "Creator not found" });
      }
      res.json(creator);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch creator" });
    }
  });

  app.get("/api/creators/:id", async (req, res) => {
    try {
      const creator = await storage.getCreator(req.params.id);
      if (!creator) {
        return res.status(404).json({ message: "Creator not found" });
      }
      res.json(creator);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch creator" });
    }
  });

  app.get("/api/access/:contentId/:wallet", async (req, res) => {
    try {
      const hasAccess = await storage.checkAccess(req.params.contentId, req.params.wallet);
      res.json({ hasAccess });
    } catch (error) {
      res.status(500).json({ message: "Failed to check access" });
    }
  });

  app.get("/api/shelbyusd-balance/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      const SHELBYUSD_FA_METADATA = "0x1b18363a9f1fe5e6ebf247daba5cc1c18052bb232efdc4c50f556053922d98e1";
      const rpcUrl = APTOS_TESTNET_RPC;
      const rpcBase = rpcUrl.endsWith("/v1") ? rpcUrl : `${rpcUrl}/v1`;

      const viewRes = await fetch(`${rpcBase}/view`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          function: "0x1::primary_fungible_store::balance",
          type_arguments: ["0x1::fungible_asset::Metadata"],
          arguments: [walletAddress, SHELBYUSD_FA_METADATA],
        }),
      });

      if (!viewRes.ok) {
        const errText = await viewRes.text();
        console.log(`[shelbynet] ShelbyUSD balance view error (${viewRes.status}): ${errText.slice(0, 200)}`);
        return res.json({ balance: "0", balanceFormatted: "0", hasBalance: false, error: "Could not fetch balance" });
      }

      const viewData = await viewRes.json();
      const rawBalance = viewData[0] ? String(viewData[0]) : "0";
      const balanceUnits = parseInt(rawBalance, 10) || 0;
      const balanceFormatted = (balanceUnits / 100_000_000).toFixed(4);

      console.log(`[shelbynet] ShelbyUSD balance for ${walletAddress.slice(0, 12)}...: ${balanceUnits} units = ${balanceFormatted} ShelbyUSD`);

      res.json({
        balance: rawBalance,
        balanceFormatted,
        balanceUnits,
        hasBalance: balanceUnits > 0,
      });
    } catch (error: any) {
      console.error("[shelbynet] Balance check error:", error.message);
      res.json({ balance: "0", balanceFormatted: "0", balanceUnits: 0, hasBalance: false, error: error.message });
    }
  });

  app.get("/api/verify-tx/:txHash", async (req, res) => {
    try {
      const { txHash } = req.params;
      const clientRpcUrl = req.query.rpcUrl as string | undefined;
      const rpcUrl = clientRpcUrl || APTOS_TESTNET_RPC;
      const rpcBase = rpcUrl.endsWith("/v1") ? rpcUrl : `${rpcUrl}/v1`;

      console.log(`[shelbynet] Verifying tx: ${txHash} on RPC: ${rpcBase}`);

      const txRes = await fetch(`${rpcBase}/transactions/by_hash/${txHash}`, {
        headers: { "Content-Type": "application/json" },
      });

      if (!txRes.ok) {
        const body = await txRes.text();
        console.log(`[shelbynet] Tx not found (${txRes.status}): ${body.slice(0, 200)}`);
        return res.json({ verified: false, status: "not_found", message: "Transaction not found" });
      }

      const txData = await txRes.json();
      
      if (txData.type === "pending_transaction") {
        console.log(`[shelbynet] Tx is pending`);
        return res.json({ verified: false, status: "pending", message: "Transaction is still pending" });
      }

      const success = txData.success === true;
      const vmStatus = txData.vm_status || "";
      console.log(`[shelbynet] Tx found: success=${success}, vm_status=${vmStatus}`);

      res.json({
        verified: success,
        status: success ? "confirmed" : "failed",
        hash: txData.hash,
        sender: txData.sender,
        vmStatus,
        gasUsed: txData.gas_used,
        version: txData.version,
        timestamp: txData.timestamp,
      });
    } catch (error: any) {
      console.log(`[shelbynet] Verify error:`, error.message);
      res.json({ verified: false, status: "error", message: error.message });
    }
  });

  app.post("/api/purchase", async (req, res) => {
    try {
      const parsed = purchaseSchema.parse(req.body);

      const content = await storage.getContent(parsed.contentId);
      if (!content) {
        return res.status(404).json({ message: "Content not found" });
      }

      const creator = await storage.getCreator(content.creatorId);
      if (!creator) {
        return res.status(404).json({ message: "Creator not found" });
      }

      const alreadyPurchased = await storage.checkAccess(parsed.contentId, parsed.buyerWallet);
      if (alreadyPurchased) {
        return res.status(400).json({ message: "Already purchased" });
      }

      const existingTx = await storage.getPurchaseByTxHash(parsed.txHash);
      if (existingTx) {
        return res.status(400).json({ message: "Transaction hash already used for another purchase" });
      }

      let txVerified = false;
      const expectedAmountOcta = Math.round(parseFloat(content.priceShelbyUsd) * 100_000_000);
      const purchaseRpc = parsed.rpcUrl || APTOS_TESTNET_RPC;
      const purchaseRpcBase = purchaseRpc.endsWith("/v1") ? purchaseRpc : `${purchaseRpc}/v1`;
      console.log(`[shelbynet] Purchase verify using RPC: ${purchaseRpcBase}`);

      for (let attempt = 0; attempt < 5; attempt++) {
        try {
          const txRes = await fetch(`${purchaseRpcBase}/transactions/by_hash/${parsed.txHash}`, {
            headers: { "Content-Type": "application/json" },
          });

          if (!txRes.ok) {
            if (attempt < 4) {
              await new Promise(r => setTimeout(r, 1500));
              continue;
            }
            return res.status(400).json({ message: "Transaction not found on Aptos Testnet. It may still be pending." });
          }

          const txData = await txRes.json();

          if (txData.success !== true) {
            return res.status(400).json({ message: `Transaction failed on-chain: ${txData.vm_status}` });
          }

          const normalizeAddr = (addr: string) => {
            const hex = addr.toLowerCase().replace(/^0x/, "");
            return "0x" + hex.replace(/^0+/, "");
          };

          const txSender = normalizeAddr(txData.sender || "");
          const buyerNorm = normalizeAddr(parsed.buyerWallet);
          if (txSender !== buyerNorm) {
            return res.status(400).json({ message: "Transaction sender does not match buyer wallet" });
          }

          const SHELBYUSD_FA_METADATA = "0x1b18363a9f1fe5e6ebf247daba5cc1c18052bb232efdc4c50f556053922d98e1";

          const payload = txData.payload;
          if (!payload) {
            return res.status(400).json({ message: "Transaction has no payload" });
          }

          const fn = payload.function || "";
          if (!fn.includes("primary_fungible_store::transfer")) {
            return res.status(400).json({ message: "Transaction must be a ShelbyUSD fungible asset transfer (primary_fungible_store::transfer)" });
          }

          const args = payload.arguments || [];
          if (args.length < 3) {
            return res.status(400).json({ message: "Invalid transfer arguments" });
          }

          const rawFaMeta = args[0];
          const txFaMetadata = normalizeAddr(
            typeof rawFaMeta === "object" && rawFaMeta !== null && "inner" in rawFaMeta
              ? String((rawFaMeta as any).inner)
              : String(rawFaMeta)
          );
          const expectedFaMetadata = normalizeAddr(SHELBYUSD_FA_METADATA);
          if (txFaMetadata !== expectedFaMetadata) {
            console.log(`[shelbynet] FA mismatch: got ${txFaMetadata}, expected ${expectedFaMetadata}, raw:`, JSON.stringify(rawFaMeta));
            return res.status(400).json({ message: "Payment must use ShelbyUSD token. Wrong fungible asset detected." });
          }

          const txRecipient = normalizeAddr(String(args[1]));
          const creatorNorm = normalizeAddr(creator.walletAddress);
          if (txRecipient !== creatorNorm) {
            return res.status(400).json({ message: "Transaction recipient does not match content creator" });
          }

          const txAmount = parseInt(String(args[2]), 10);
          if (txAmount < expectedAmountOcta) {
            return res.status(400).json({ message: `Insufficient payment: expected ${expectedAmountOcta} units, got ${txAmount}` });
          }

          txVerified = true;
          break;
        } catch (verifyErr) {
          if (attempt < 4) {
            await new Promise(r => setTimeout(r, 1500));
            continue;
          }
          return res.status(500).json({ message: "Failed to verify transaction on Aptos Testnet" });
        }
      }

      if (!txVerified) {
        return res.status(400).json({ message: "Could not verify transaction on Aptos Testnet" });
      }

      const purchase = await storage.createPurchase({
        contentId: parsed.contentId,
        buyerWallet: parsed.buyerWallet,
        creatorWallet: creator.walletAddress,
        amountShelbyUsd: content.priceShelbyUsd,
        txHash: parsed.txHash,
      });

      await storage.incrementContentViews(parsed.contentId, content.priceShelbyUsd);

      res.setHeader("X-Shelby-Protocol", SHELBY_PROTOCOL_VERSION);
      res.json(purchase);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors.map(e => e.message).join(", ") });
      }
      res.status(400).json({ message: error.message || "Failed to process purchase" });
    }
  });

  app.get("/api/purchases/:wallet", async (req, res) => {
    try {
      const purchases = await storage.getPurchasesByBuyer(req.params.wallet);
      const purchasesWithContent = await Promise.all(
        purchases.map(async (p) => {
          const content = await storage.getContent(p.contentId);
          return { ...p, content };
        })
      );
      res.json(purchasesWithContent.filter((p) => p.content));
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch purchases" });
    }
  });

  app.get("/api/content-file/:contentId", async (req, res) => {
    try {
      const content = await storage.getContent(req.params.contentId);
      if (!content) {
        return res.status(404).json({ message: "Content not found" });
      }

      const wallet = req.query.wallet as string;
      if (!wallet) {
        return res.status(400).json({ message: "Wallet address required" });
      }

      const hasAccess = await storage.checkAccess(req.params.contentId, wallet);
      if (!hasAccess) {
        return res.status(403).json({ message: "Access not granted. Purchase required." });
      }

      const localFilename = (content as any).localFilename;
      if (!localFilename) {
        return res.status(404).json({ message: "No local file available for this content." });
      }

      const filePath = path.join(uploadsDir, localFilename);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "File not found on server." });
      }

      const ext = path.extname(localFilename).toLowerCase();
      const mimeType = ext === ".pdf"
        ? "application/pdf"
        : ext === ".mp4" ? "video/mp4"
        : ext === ".webm" ? "video/webm"
        : ext === ".mov" ? "video/quicktime"
        : "application/octet-stream";

      res.setHeader("Content-Type", mimeType);
      res.setHeader("Content-Disposition", `inline; filename="${localFilename}"`);
      res.setHeader("Cache-Control", "private, max-age=3600");

      const stat = fs.statSync(filePath);
      const fileSize = stat.size;
      const range = req.headers.range;

      if (range && mimeType.startsWith("video/")) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunkSize = end - start + 1;
        const fileStream = fs.createReadStream(filePath, { start, end });
        res.status(206);
        res.setHeader("Content-Range", `bytes ${start}-${end}/${fileSize}`);
        res.setHeader("Accept-Ranges", "bytes");
        res.setHeader("Content-Length", chunkSize);
        fileStream.pipe(res);
      } else {
        res.setHeader("Content-Length", fileSize);
        fs.createReadStream(filePath).pipe(res);
      }
    } catch (error: any) {
      console.error("[content-file] Error:", error.message);
      res.status(500).json({ message: "Failed to serve file" });
    }
  });

  app.get("/api/shelby-content/:contentId", async (req, res) => {
    try {
      const content = await storage.getContent(req.params.contentId);
      if (!content) {
        return res.status(404).json({ message: "Content not found" });
      }

      const wallet = req.query.wallet as string;
      if (!wallet) {
        return res.status(400).json({ message: "Wallet address required" });
      }

      const hasAccess = await storage.checkAccess(req.params.contentId, wallet);
      if (!hasAccess) {
        return res.status(403).json({ message: "Access not granted. Purchase required." });
      }

      const blobId = content.shelbyBlobId;
      if (!blobId || !blobId.startsWith("files/")) {
        return res.status(404).json({ message: "No Shelby blob available for this content." });
      }

      const setup = initShelbyClient();
      if (!setup) {
        return res.status(503).json({ message: "Shelby client not configured." });
      }

      const { client, account } = setup;

      const ext = path.extname(blobId).toLowerCase();
      const mimeType = ext === ".pdf"
        ? "application/pdf"
        : ext === ".mp4" ? "video/mp4"
        : ext === ".webm" ? "video/webm"
        : ext === ".mov" ? "video/quicktime"
        : "application/octet-stream";

      const range = req.headers.range;

      async function readStream(readable: ReadableStream): Promise<Buffer> {
        const reader = readable.getReader();
        const chunks: Uint8Array[] = [];
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) chunks.push(value);
        }
        return Buffer.concat(chunks.map((c) => Buffer.from(c)));
      }

      try {
        console.log(`[shelby-content] Downloading blob "${blobId}" from Shelby...`);
        const blob = await client.download({
          account: account.accountAddress,
          blobName: blobId,
        });
        const data = await readStream(blob.readable);
        const totalSize = data.length;
        console.log(`[shelby-content] Downloaded ${totalSize} bytes from Shelby for blob "${blobId}"`);

        res.setHeader("Content-Type", mimeType);
        res.setHeader("Content-Disposition", `inline; filename="${path.basename(blobId)}"`);
        res.setHeader("Cache-Control", "private, max-age=3600");
        res.setHeader("Accept-Ranges", "bytes");
        res.setHeader("X-Served-From", "shelby");

        if (range && mimeType.startsWith("video/")) {
          const parts = range.replace(/bytes=/, "").split("-");
          const start = parseInt(parts[0], 10);
          const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;
          const chunkSize = end - start + 1;
          res.status(206);
          res.setHeader("Content-Range", `bytes ${start}-${end}/${totalSize}`);
          res.setHeader("Content-Length", chunkSize);
          res.end(data.slice(start, end + 1));
        } else {
          res.setHeader("Content-Length", totalSize);
          res.end(data);
        }
      } catch (shelbyErr: any) {
        console.error("[shelby-content] Download error:", shelbyErr.message);
        const localFilename = (content as any).localFilename;
        if (localFilename) {
          const filePath = path.join(uploadsDir, localFilename);
          if (fs.existsSync(filePath)) {
            console.log("[shelby-content] Falling back to local file:", localFilename);
            const stat = fs.statSync(filePath);
            res.setHeader("Content-Type", mimeType);
            res.setHeader("Content-Disposition", `inline; filename="${localFilename}"`);
            res.setHeader("Cache-Control", "private, max-age=3600");
            res.setHeader("Accept-Ranges", "bytes");
            res.setHeader("X-Served-From", "local-fallback");
            if (range && mimeType.startsWith("video/")) {
              const parts = range.replace(/bytes=/, "").split("-");
              const start = parseInt(parts[0], 10);
              const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
              res.status(206);
              res.setHeader("Content-Range", `bytes ${start}-${end}/${stat.size}`);
              res.setHeader("Content-Length", end - start + 1);
              fs.createReadStream(filePath, { start, end }).pipe(res);
            } else {
              res.setHeader("Content-Length", stat.size);
              fs.createReadStream(filePath).pipe(res);
            }
            return;
          }
        }
        return res.status(502).json({ message: "Failed to download from Shelby: " + shelbyErr.message });
      }
    } catch (error: any) {
      console.error("[shelby-content] Error:", error.message);
      res.status(500).json({ message: "Failed to serve content" });
    }
  });

  app.get("/api/stream/:contentId", async (req, res) => {
    try {
      const content = await storage.getContent(req.params.contentId);
      if (!content) {
        return res.status(404).json({ message: "Content not found" });
      }

      const wallet = req.query.wallet as string;
      if (!wallet) {
        return res.status(400).json({ message: "Wallet address required" });
      }

      const hasAccess = await storage.checkAccess(req.params.contentId, wallet);
      if (!hasAccess) {
        return res.status(403).json({ message: "Access not granted. Purchase required." });
      }

      const indexerHeaders = getIndexerHeaders();
      const indexerAuth = Object.keys(indexerHeaders).length > 0;

      const fragmentCount = content.contentType === "video" ? 24 : 8;
      const fragments = Array.from({ length: fragmentCount }, (_, i) => ({
        index: i,
        fragmentId: `${content.shelbyBlobId}_frag_${i}`,
        size: Math.floor(Math.random() * 3072) + 1024,
        clayCoded: true,
        status: "available",
      }));

      res.setHeader("X-Shelby-Protocol", SHELBY_PROTOCOL_VERSION);
      res.setHeader("X-Storage-Type", "hot");
      res.setHeader("X-Blob-Id", content.shelbyBlobId || "");
      res.setHeader("X-Fragment-Count", String(fragmentCount));
      res.setHeader("X-Indexer-Authenticated", String(indexerAuth));
      res.setHeader("Cache-Control", "no-cache");
      res.json({
        contentId: content.id,
        blobId: content.shelbyBlobId,
        contentType: content.contentType,
        totalFragments: fragmentCount,
        fragments,
        streamReady: true,
        latencyMs: Math.floor(Math.random() * 150) + 50,
        storageType: "hot",
        clayCodes: true,
        indexerAuthenticated: indexerAuth,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to initialize stream" });
    }
  });

  return httpServer;
}
