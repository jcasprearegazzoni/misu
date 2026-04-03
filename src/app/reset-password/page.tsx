"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    const origin = window.location.origin;
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/callback?next=/update-password`,
    });

    if (resetError) {
      setError("No se pudieron enviar las instrucciones. Intentá nuevamente.");
      setIsSubmitting(false);
      return;
    }

    setSuccess("Si el email existe, recibirás instrucciones en tu casilla.");
    setIsSubmitting(false);
  }

  return (
    <main
      className="flex min-h-screen w-full items-center justify-center px-6 py-10"
      style={{ background: "var(--background)" }}
    >
      <div className="w-full max-w-sm">
        {/* Logo */}
        <Link href="/" className="mb-8 block">
          <span
            className="text-xl font-black tracking-tighter logo-glow"
            style={{ color: "var(--misu)" }}
          >
            misu
          </span>
        </Link>

        {/* Card */}
        <div className="card p-7">
          <h1
            className="text-xl font-black tracking-tight"
            style={{ color: "var(--foreground)" }}
          >
            Recuperar contraseña
          </h1>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
            Ingresá tu email y te enviamos un enlace para crear una nueva contraseña.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
            <label className="label">
              <span>Email</span>
              <input
                type="email"
                name="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="input"
                placeholder="email@ejemplo.com"
                required
                autoComplete="email"
              />
            </label>

            {error ? <div className="alert-error">{error}</div> : null}
            {success ? <div className="alert-success">{success}</div> : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full"
              style={{ padding: "0.75rem", justifyContent: "center" }}
            >
              {isSubmitting ? "Enviando..." : "Enviar instrucciones"}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-sm" style={{ color: "var(--muted)" }}>
          <Link href="/login" className="text-link font-medium">
            ← Volver a iniciar sesión
          </Link>
        </p>
      </div>
    </main>
  );
}
