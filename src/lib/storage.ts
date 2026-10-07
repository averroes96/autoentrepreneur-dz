import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { uploadToSupabaseStorage, getSupabaseSignedUrl } from "./supabase";
import { captureException } from "./sentry";

const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || "moukawil-invoices";
const publicDomain = process.env.CLOUDFLARE_R2_PUBLIC_URL; // e.g. https://files.moukawil.dz

let r2Client: S3Client | null = null;

/**
 * Returns an initialized Cloudflare R2 S3-compatible client.
 */
export function getR2Client(): S3Client | null {
  if (!accountId || !accessKeyId || !secretAccessKey) {
    return null;
  }

  if (!r2Client) {
    r2Client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  return r2Client;
}

export interface SaveDocumentOptions {
  key: string;
  buffer: Buffer | Uint8Array;
  contentType?: string;
  isPublic?: boolean;
}

/**
 * Upload an object directly to Cloudflare R2.
 */
export async function uploadToCloudflareR2({
  key,
  buffer,
  contentType = "application/pdf",
  isPublic = false,
}: SaveDocumentOptions): Promise<{ key: string; url?: string } | null> {
  const client = getR2Client();
  if (!client) {
    console.warn("[Cloudflare R2] R2 credentials not configured.");
    return null;
  }

  try {
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    });

    await client.send(command);

    const publicUrl = isPublic && publicDomain
      ? `${publicDomain.replace(/\/$/, "")}/${key}`
      : undefined;

    return { key, url: publicUrl };
  } catch (err) {
    captureException(err, { action: "uploadToCloudflareR2", key, bucket: bucketName });
    console.error(`[Cloudflare R2 Error] Upload failed for ${key}:`, err);
    return null;
  }
}

/**
 * Get a presigned download URL for a Cloudflare R2 object.
 */
export async function getCloudflareR2SignedUrl(
  key: string,
  expiresInSeconds = 3600
): Promise<string | null> {
  const client = getR2Client();
  if (!client) return null;

  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    return await getSignedUrl(client, command, { expiresIn: expiresInSeconds });
  } catch (err) {
    captureException(err, { action: "getCloudflareR2SignedUrl", key });
    return null;
  }
}

/**
 * Delete an object from Cloudflare R2.
 */
export async function deleteFromCloudflareR2(key: string): Promise<boolean> {
  const client = getR2Client();
  if (!client) return false;

  try {
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });
    await client.send(command);
    return true;
  } catch (err) {
    captureException(err, { action: "deleteFromCloudflareR2", key });
    return false;
  }
}

/**
 * Unified storage dispatcher for Invoices:
 * Tries Cloudflare R2 first, then Supabase Storage, and falls back to local buffer.
 */
export async function persistInvoicePdf({
  tenantId,
  invoiceNumber,
  pdfBuffer,
}: {
  tenantId: string;
  invoiceNumber: string;
  pdfBuffer: Buffer | Uint8Array;
}): Promise<{ provider: "cloudflare_r2" | "supabase" | "memory"; key: string; url?: string }> {
  const key = `${tenantId}/invoices/${invoiceNumber}.pdf`;

  // 1. Try Cloudflare R2
  if (getR2Client()) {
    const r2Result = await uploadToCloudflareR2({
      key,
      buffer: pdfBuffer,
      contentType: "application/pdf",
    });
    if (r2Result) {
      return { provider: "cloudflare_r2", key, url: r2Result.url };
    }
  }

  // 2. Try Supabase Storage
  const supabaseResult = await uploadToSupabaseStorage({
    bucket: "invoices",
    path: key,
    fileBuffer: pdfBuffer,
    contentType: "application/pdf",
  });
  if (supabaseResult) {
    return { provider: "supabase", key, url: supabaseResult.publicUrl };
  }

  // 3. Dev / Memory fallback
  return { provider: "memory", key };
}
