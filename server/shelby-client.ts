import { ShelbyNodeClient } from "@shelby-protocol/sdk/node";
import { Account, Ed25519PrivateKey } from "@aptos-labs/ts-sdk";

const SHELBY_NETWORK = "shelbynet";
const DEFAULT_EXPIRATION_DAYS = 30;
const MAX_UPLOAD_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

let shelbyClient: ShelbyNodeClient | null = null;
let shelbyAccount: Account | null = null;

function getShelbyPrivateKey(): string | null {
  const key = process.env.SHELBY_PRIVATE_KEY;
  if (!key) {
    console.warn("[shelbynet] SHELBY_PRIVATE_KEY is not set — uploads will be stored locally only");
    return null;
  }
  return key;
}

function getApiKey(): string | undefined {
  return process.env.GEOMI_API_KEY || undefined;
}

export function initShelbyClient(): { client: ShelbyNodeClient; account: Account } | null {
  if (shelbyClient && shelbyAccount) {
    return { client: shelbyClient, account: shelbyAccount };
  }

  const privateKey = getShelbyPrivateKey();
  if (!privateKey) return null;

  try {
    const cleanKey = privateKey.startsWith("ed25519-priv-")
      ? privateKey
      : privateKey.startsWith("0x")
        ? `ed25519-priv-${privateKey}`
        : `ed25519-priv-0x${privateKey}`;

    shelbyAccount = Account.fromPrivateKey({
      privateKey: new Ed25519PrivateKey(cleanKey),
    });

    const apiKey = getApiKey();
    console.log(`[shelbynet] API key present: ${!!apiKey}, length: ${apiKey?.length ?? 0}`);

    shelbyClient = new ShelbyNodeClient({
      network: SHELBY_NETWORK as any,
      apiKey,
    });

    console.log(`[shelbynet] Shelby client initialized for account: ${shelbyAccount.accountAddress.toString()}`);
    return { client: shelbyClient, account: shelbyAccount };
  } catch (err: any) {
    console.error(`[shelbynet] Failed to initialize Shelby client:`, err.message);
    shelbyClient = null;
    shelbyAccount = null;
    return null;
  }
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function uploadToShelby(
  fileBuffer: Buffer,
  blobName: string
): Promise<{
  success: boolean;
  blobName: string;
  accountAddress: string;
  explorerUrl: string;
  registered?: boolean;
  isWritten?: boolean;
  error?: string;
}> {
  const setup = initShelbyClient();
  if (!setup) {
    return { success: false, blobName, accountAddress: "", explorerUrl: "", error: "Shelby client not configured" };
  }

  const { client, account } = setup;
  const accountAddress = account.accountAddress.toString();
  const explorerUrl = `https://explorer.shelby.xyz/shelbynet/account/${accountAddress}/blobs`;
  const expirationMicros = (Date.now() + DEFAULT_EXPIRATION_DAYS * 24 * 60 * 60 * 1000) * 1000;

  let lastError = "";

  for (let attempt = 1; attempt <= MAX_UPLOAD_RETRIES; attempt++) {
    try {
      console.log(`[shelbynet] Upload attempt ${attempt}/${MAX_UPLOAD_RETRIES}: ${blobName} (${fileBuffer.length} bytes)`);
      const startTime = Date.now();

      await client.upload({
        blobData: new Uint8Array(fileBuffer),
        signer: account,
        blobName,
        expirationMicros,
      });

      const elapsed = Date.now() - startTime;
      console.log(`[shelbynet] Upload complete in ${elapsed}ms — blob: ${blobName}, account: ${accountAddress}`);

      let isWritten = false;
      try {
        const metadata = await client.coordination.getBlobMetadata({
          account: account.accountAddress,
          name: blobName,
        });
        isWritten = metadata?.isWritten ?? false;
        console.log(`[shelbynet] Blob "${blobName}" on-chain status: isWritten=${isWritten}`);
      } catch (_e: any) {
        console.warn(`[shelbynet] Could not check isWritten for "${blobName}":`, _e.message);
      }

      return {
        success: true,
        blobName,
        accountAddress,
        explorerUrl,
        registered: true,
        isWritten,
      };
    } catch (err: any) {
      lastError = err.message;
      console.error(`[shelbynet] Upload attempt ${attempt} failed:`, lastError);

      if (attempt < MAX_UPLOAD_RETRIES) {
        console.log(`[shelbynet] Retrying in ${RETRY_DELAY_MS}ms...`);
        await sleep(RETRY_DELAY_MS * attempt);
      }
    }
  }

  let registered = false;
  let isWritten = false;
  try {
    const metadata = await client.coordination.getBlobMetadata({
      account: account.accountAddress,
      name: blobName,
    });
    registered = !!metadata;
    isWritten = metadata?.isWritten ?? false;
    if (registered) {
      console.log(`[shelbynet] Blob "${blobName}" is registered on-chain (isWritten=${isWritten}) but RPC storage failed`);
    }
  } catch (_e: any) {}

  return {
    success: false,
    blobName,
    accountAddress,
    explorerUrl: registered ? explorerUrl : "",
    registered,
    isWritten,
    error: registered
      ? "Blob registered on-chain but ShelbyNet RPC storage is temporarily unavailable. The file is stored locally as backup."
      : lastError,
  };
}

export async function checkBlobStatus(blobName: string): Promise<{
  registered: boolean;
  isWritten: boolean;
  size?: number;
  expirationMicros?: number;
} | null> {
  const setup = initShelbyClient();
  if (!setup) return null;

  const { client, account } = setup;
  try {
    const metadata = await client.coordination.getBlobMetadata({
      account: account.accountAddress,
      name: blobName,
    });
    if (!metadata) return { registered: false, isWritten: false };
    return {
      registered: true,
      isWritten: metadata.isWritten ?? false,
      size: metadata.size,
      expirationMicros: metadata.expirationMicros,
    };
  } catch (err: any) {
    console.warn(`[shelbynet] checkBlobStatus error for "${blobName}":`, err.message);
    return null;
  }
}

export function getShelbyAccountAddress(): string | null {
  const setup = initShelbyClient();
  return setup ? setup.account.accountAddress.toString() : null;
}
