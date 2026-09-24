import { supabase, ensureCustomerSession } from "@/lib/supabase";

const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];

export async function uploadHousePhoto(file: File): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("Format d'image non supporté. Utilisez une photo JPEG, PNG ou WEBP.");
  }
  if (file.size > MAX_SIZE_BYTES) {
    throw new Error("Photo trop volumineuse (5 Mo maximum).");
  }

  const session = await ensureCustomerSession();
  if (!session) throw new Error("Session client indisponible.");

  const extension = file.name.split(".").pop() || "jpg";
  const path = `${session.user.id}/${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage.from("house-photos").upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from("house-photos").getPublicUrl(path);
  return data.publicUrl;
}
