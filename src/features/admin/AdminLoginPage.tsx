import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (signInError) {
      setError("Identifiants incorrects.");
      return;
    }
    navigate({ to: "/admin" });
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-brand-green px-5">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white rounded-3xl p-6">
        <img src="/images/logo.webp" alt="Kreyòl Délis" className="w-14 h-14 rounded-full mx-auto mb-4" />
        <h1 className="text-lg font-extrabold text-center mb-1">Espace restaurant</h1>
        <p className="text-sm text-brand-sage text-center mb-6">Kreyòl Délis</p>

        <label className="block mb-3">
          <span className="block text-sm font-semibold mb-1">E-mail</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-brand-cream-3 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-green"
          />
        </label>
        <label className="block mb-4">
          <span className="block text-sm font-semibold mb-1">Mot de passe</span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-brand-cream-3 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-green"
          />
        </label>

        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-green-dark text-white rounded-full py-3 font-semibold disabled:opacity-60"
        >
          {loading ? "Connexion…" : "Se connecter"}
        </button>
      </form>
    </div>
  );
}
