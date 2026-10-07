import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { captureException } from "./sentry";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

let clientInstance: SupabaseClient | null = null;
let adminInstance: SupabaseClient | null = null;

/**
 * Returns a standard Supabase client for authenticated or anonymous operations.
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }
  if (!clientInstance) {
    clientInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
      },
    });
  }
  return clientInstance;
}

/**
 * Returns an admin Supabase client using the Service Role Key.
 * Bypasses RLS for backend batch operations and storage management.
 */
export function getSupabaseAdminClient(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return null;
  }
  if (!adminInstance) {
    adminInstance = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
      },
    });
  }
  return adminInstance;
}

export interface UploadStorageOptions {
  bucket?: string;
  path: string;
  fileBuffer: Buffer | Uint8Array;
  contentType: string;
  upsert?: boolean;
}

/**
 * Upload a file to Supabase Storage bucket.
 * Default bucket: 'documents' or 'invoices'
 */
export async function uploadToSupabaseStorage({
  bucket = "invoices",
  path,
  fileBuffer,
  contentType,
  upsert = true,
}: UploadStorageOptions): Promise<{ path: string; publicUrl?: string } | null> {
  const client = getSupabaseAdminClient() || getSupabaseClient();
  if (!client) {
    console.warn("[Supabase Storage] Supabase credentials not configured. Skipping remote upload.");
    return null;
  }

  try {
    const { data, error } = await client.storage
      .from(bucket)
      .upload(path, fileBuffer, {
        contentType,
        upsert,
      });

    if (error) {
      captureException(error, { bucket, path });
      throw error;
    }

    const { data: publicUrlData } = client.storage.from(bucket).getPublicUrl(path);

    return {
      path: data.path,
      publicUrl: publicUrlData?.publicUrl,
    };
  } catch (err) {
    captureException(err, { action: "uploadToSupabaseStorage", bucket, path });
    console.error(`[Supabase Storage Error] Failed to upload ${path}:`, err);
    return null;
  }
}

/**
 * Generate a signed URL for a private file stored in Supabase Storage.
 */
export async function getSupabaseSignedUrl(
  path: string,
  bucket = "invoices",
  expiresInSeconds = 3600
): Promise<string | null> {
  const client = getSupabaseAdminClient() || getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client.storage
      .from(bucket)
      .createSignedUrl(path, expiresInSeconds);

    if (error) throw error;
    return data.signedUrl;
  } catch (err) {
    captureException(err, { action: "getSupabaseSignedUrl", bucket, path });
    return null;
  }
}
