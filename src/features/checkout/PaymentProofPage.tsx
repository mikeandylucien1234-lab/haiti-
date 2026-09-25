import { useEffect, useRef, useState } from "react";
import { Link, useParams, useRouter } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";
import { useSettings } from "@/features/catalog/queries";
import { uploadPaymentProof } from "@/lib/paymentProof";
import { formatHTG } from "@/lib/format";
import type { OrderRow } from "@/types/database";

const METHOD_LABEL: Record<string, string> = { moncash: "MonCash", natcash: "NatCash" };

export default function PaymentProofPage() {
  const router = useRouter();
  const { orderId } = useParams({ from: "/paiement/preuve/$orderId" });
  const { data: settings } = useSettings();
  const [order, setOrder] = useState<OrderRow | null>(null);
  const [loading, setLoading] = useState(true);

  const [transactionNumber, setTransactionNumber] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;

    supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single()
      .then(({ data }) => {
        if (active) {
          setOrder((data as unknown as OrderRow) ?? null);
          setLoading(false);
        }
      });

    const channel = supabase
      .channel(`order-payment-${orderId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${orderId}` },
        (payload) => {
          if (active) setOrder(payload.new as OrderRow);
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  if (loading) {
    return <div className="px-5 py-16 text-center text-brand-sage">Chargement…</div>;
  }

  if (!order || !settings) {
    return (
      <div className="px-5 py-16 text-center text-brand-sage">
        <p className="mb-4">Commande introuvable.</p>
        <Link to="/" className="text-brand-green font-semibold">
          Retour à l'accueil
        </Link>
      </div>
    );
  }

  const methodLabel = METHOD_LABEL[order.payment_method] ?? order.payment_method;
  const accountName = order.payment_method === "moncash" ? settings.moncash_name : settings.natcash_name;
  const accountNumber = order.payment_method === "moncash" ? settings.moncash_number : settings.natcash_number;

  async function handleSubmit() {
    if (!order) return;
    setError(null);
    const number = transactionNumber.trim();
    if (!number) {
      setError("Le numéro de transaction est requis.");
      return;
    }
    if (!file) {
      setError("Ajoutez une capture d'écran ou une photo de votre reçu.");
      return;
    }
    setUploading(true);
    try {
      const path = await uploadPaymentProof(file);
      const { data, error: fnError } = await supabase.functions.invoke("submit-payment-proof", {
        body: { order_id: order.id, transaction_number: number, payment_proof_path: path },
      });
      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);
      setOrder(data.order as OrderRow);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Impossible d'envoyer la preuve. Réessayez.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="pb-10">
      <header className="flex items-center gap-3 px-5 pt-5 pb-1">
        <button onClick={() => router.history.back()} className="w-9 h-9 rounded-full bg-brand-cream-2 flex items-center justify-center">
          ←
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-extrabold">Preuve de paiement</h1>
          <p className="text-xs text-brand-sage">Commande {order.order_number}</p>
        </div>
      </header>

      <div className="px-5 mt-4 flex flex-col gap-4">
        <div className="bg-brand-green-dark text-white rounded-2xl p-5 text-center">
          <p className="text-xs uppercase tracking-wider text-white/60 font-semibold">Total à payer</p>
          <p className="text-3xl font-extrabold text-brand-gold mt-1">{formatHTG(order.total_htg)}</p>
          <p className="text-xs text-white/60 mt-1">Montant fixé par votre commande — non modifiable</p>
        </div>

        {order.payment_status === "confirmed" && (
          <div className="bg-white rounded-2xl border-2 border-brand-green p-4 text-center">
            <p className="text-2xl mb-1">✓</p>
            <p className="font-bold text-brand-green">Paiement confirmé</p>
            <p className="text-sm text-brand-sage mt-1">Votre commande est en cours de traitement.</p>
            <Link
              to="/confirmation/$orderId"
              params={{ orderId: order.id }}
              className="inline-block mt-3 text-sm font-semibold text-brand-green"
            >
              Suivre ma commande →
            </Link>
          </div>
        )}

        {order.payment_status === "pending_verification" && (
          <div className="bg-white rounded-2xl border border-brand-gold p-4">
            <p className="font-bold text-brand-green-dark">Paiement en attente de vérification</p>
            <p className="text-sm text-brand-sage mt-1 leading-relaxed">
              Votre preuve de paiement a bien été envoyée. Votre paiement est actuellement en cours de vérification.
              Votre commande sera traitée après confirmation du paiement.
            </p>
            {order.transaction_number && (
              <p className="text-xs text-brand-sage mt-3">
                Numéro de transaction fourni : <span className="font-mono font-semibold text-brand-ink">{order.transaction_number}</span>
              </p>
            )}
          </div>
        )}

        {(order.payment_status === "pending_proof" || order.payment_status === "rejected") && (
          <>
            {order.payment_status === "rejected" && (
              <div className="bg-white rounded-2xl border border-red-300 p-4">
                <p className="font-bold text-red-600">Paiement refusé</p>
                <p className="text-sm text-brand-sage mt-1">
                  Votre preuve n'a pas pu être validée. Vérifiez vos informations et envoyez-la à nouveau, ou
                  contactez le restaurant.
                </p>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-brand-cream-3 p-4">
              <p className="font-bold text-sm mb-1">
                {methodLabel} — {accountName}
              </p>
              <p className="font-mono text-xl font-extrabold text-brand-green-dark tracking-wider">{accountNumber}</p>
              <p className="text-xs text-brand-sage mt-2">
                Effectuez un transfert {methodLabel} vers ce numéro, au nom de <strong>{accountName}</strong>.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-brand-cream-3 p-4">
              <p className="font-bold text-sm mb-2">Comment effectuer votre paiement</p>
              <ol className="text-sm text-brand-sage flex flex-col gap-1.5 list-decimal list-inside">
                <li>Ouvrez votre compte {methodLabel}.</li>
                <li>Effectuez un transfert vers le numéro {accountNumber}.</li>
                <li>
                  Vérifiez que le nom du bénéficiaire est <strong className="text-brand-ink">{accountName}</strong>.
                </li>
                <li>Envoyez exactement le montant indiqué sur votre commande.</li>
                <li>Une fois le transfert effectué, conservez votre reçu.</li>
                <li>Revenez ici et envoyez votre preuve de paiement ci-dessous.</li>
              </ol>
              <p className="text-sm font-semibold text-brand-ink mt-3">
                Montant à envoyer : <span className="text-brand-green">{formatHTG(order.total_htg)}</span>
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-brand-cream-3 p-4">
              <p className="font-bold text-sm mb-3">Envoyer ma preuve de paiement</p>

              <label className="block mb-3">
                <span className="block text-sm font-semibold text-brand-ink mb-1.5">Numéro de transaction</span>
                <input
                  value={transactionNumber}
                  onChange={(e) => setTransactionNumber(e.target.value)}
                  placeholder="Entrez le numéro de transaction indiqué sur votre reçu"
                  className="w-full bg-brand-cream-2 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-green"
                />
              </label>

              <label className="block mb-4">
                <span className="block text-sm font-semibold text-brand-ink mb-1.5">Capture d'écran ou photo du reçu</span>
                {file ? (
                  <div className="flex items-center gap-3 bg-brand-cream-2 rounded-2xl px-4 py-3">
                    <span className="text-sm text-brand-ink truncate flex-1">{file.name}</span>
                    <button onClick={() => setFile(null)} className="text-xs font-semibold text-brand-sage flex-shrink-0">
                      Retirer
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-brand-cream-3 rounded-2xl py-6 flex flex-col items-center gap-1.5 text-brand-sage"
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path d="M12 16V4m0 0-4 4m4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="text-sm font-medium">Ajouter un fichier</span>
                    <span className="text-xs">JPG, PNG ou PDF</span>
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="hidden"
                />
              </label>

              {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

              <button
                onClick={handleSubmit}
                disabled={uploading}
                className="w-full bg-brand-green-dark disabled:opacity-60 text-white rounded-full py-3.5 font-semibold"
              >
                {uploading ? "Envoi en cours…" : "Envoyer la preuve de paiement"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
