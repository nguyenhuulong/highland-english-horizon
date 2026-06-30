// lib/storage.ts — Upload file lên Supabase Storage
// Bucket "comic-assets" phải được tạo sẵn trong Supabase Dashboard với policy public read

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const BUCKET = "comic-assets";

/**
 * Upload một file (Buffer hoặc ArrayBuffer) lên Supabase Storage.
 * Trả về public URL.
 */
export async function uploadToSupabase(opts: {
  buffer: Buffer | ArrayBuffer;
  fileName: string;     // vd: "characters/abc123.jpg"
  contentType: string;  // vd: "image/jpeg"
}): Promise<string> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error("Thiếu SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY trong .env");
  }

  const buf = opts.buffer instanceof ArrayBuffer
    ? Buffer.from(opts.buffer)
    : opts.buffer;

  const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${opts.fileName}`;

  const res = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      "Content-Type": opts.contentType,
      "x-upsert": "true",  // overwrite nếu file đã tồn tại
    },
    body: buf as unknown as BodyInit,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase Storage upload failed ${res.status}: ${err.slice(0, 200)}`);
  }

  // Trả về public URL
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${opts.fileName}`;
}

/**
 * Upload từ URL — fetch ảnh từ URL rồi re-upload lên Supabase.
 * Dùng để lưu ảnh AI gen (Together/Replicate trả về URL tạm) thành URL vĩnh viễn.
 */
export async function uploadFromUrl(opts: {
  sourceUrl: string;
  fileName: string;
}): Promise<string> {
  const res = await fetch(opts.sourceUrl);
  if (!res.ok) throw new Error(`Failed to fetch source URL: ${res.status}`);

  const contentType = res.headers.get("content-type") || "image/jpeg";
  const buffer = Buffer.from(await res.arrayBuffer());

  return uploadToSupabase({
    buffer,
    fileName: opts.fileName,
    contentType,
  });
}

/**
 * Xóa file khỏi Supabase Storage.
 */
export async function deleteFromSupabase(fileName: string): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return;

  await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${fileName}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` },
  });
}

/**
 * Tạo tên file duy nhất từ prefix + timestamp.
 */
export function makeFileName(prefix: string, ext = "jpg"): string {
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 7);
  return `${prefix}/${ts}-${rand}.${ext}`;
}
