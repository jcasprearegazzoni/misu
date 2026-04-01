"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isRecoverySessionReady, setIsRecoverySessionReady] = useState(true);

  useEffect(() => {
    async function checkRecoverySession() {
      const { data, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !data.session) {
        setIsRecoverySessionReady(false);
      }
    }

    checkRecoverySession();
  }, [supabase]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword.length < 6) {
      setError("Debe tener al menos 6 caracteres");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setIsSubmitting(true);

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      setError("No se pudo actualizar la contraseña. Solicitá un nuevo enlace.");
      setIsSubmitting(false);
      return;
    }

    setSuccess("¡Contraseña actualizada correctamente!");
    setIsSubmitting(false);

    setTimeout(() => {
      router.push("/login");
    }, 1200);
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
            Actualizar contraseña
          </h1>
          <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
            Ingresá tu nueva contraseña dos veces para confirmar.
          </p>

          {!isRecoverySessionReady ? (
            <div className="alert-error mt-5">
              El enlace de recuperación no es válido o expiró. Solicitá uno nuevo.
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
            <label className="label">
              <span>Nueva contraseña</span>
              <input
                type="password"
                name="new_password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                className="input"
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
                disabled={!isRecoverySessionReady || isSubmitting}
              />
            </label>

            <label className="label">
              <span>Confirmar contraseña</span>
              <input
                type="password"
                name="confirm_password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="input"
                placeholder="Repetí la nueva contraseña"
                required
                minLength={6}
                disabled={!isRecoverySessionReady || isSubmitting}
              />
            </label>

            {error ? <div className="alert-error">{error}</div> : null}
            {success ? <div className="alert-success">{success}</div> : null}

            <button
              type="submit"
              disabled={isSubmitting || !isRecoverySessionReady}
              className="btn-primary w-full"
              style={{ padding: "0.75rem", justifyContent: "center" }}
            >
              {isSubmitting ? "Actualizando..." : "Actualizar contraseña"}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-sm" style={{ color: "var(--muted)" }}>
          <Link href="/reset-password" className="text-link font-medium">
            Solicitar nuevo enlace
          </Link>
        </p>
      </div>
    </main>
  );
}
