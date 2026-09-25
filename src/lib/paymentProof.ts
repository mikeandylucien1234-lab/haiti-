import { supabase, ensureCustomerSession } from "@/lib/supabase";

const MAX_SIZE_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

// Bucket privé (contrairement aux photos de maison) : une preuve de paiement est
// sensible. On stocke ici le CHEMIN de l'objet, jamais une URL — l'admin et le
// client génèrent une URL signée à la demande pour la consulter.
export async function uploadPaymentProof(file: File): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("Format non supporté. Utilisez une photo JPG/PNG/WEBP ou un PDF.");
  }
  if (file.size > MAX_SIZE_BYTES) {
    throw new Error("Fichier trop volumineux (8 Mo maximum).");
  }

  const session = await ensureCustomerSession();
  if (!session) throw new Error("Session client indisponible.");

  const extension = file.name.split(".").pop() || "jpg";
  const path = `${session.user.id}/${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage.from("payment-proofs").upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw error;

  return path;
}

export async function getPaymentProofSignedUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from("payment-proofs").createSignedUrl(path, 300);
  if (error || !data) throw error ?? new Error("Impossible de générer le lien vers la preuve.");
  return data.signedUrl;
}
