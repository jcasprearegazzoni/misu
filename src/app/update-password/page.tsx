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
      setError("No se pudo actualizar la contraseña. Solicita un nuevo enlace.");
      setIsSubmitting(false);
      return;
    }

    setSuccess("Contraseña actualizada correctamente");
    setIsSubmitting(false);

    setTimeout(() => {
      router.push("/login");
    }, 1200);
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Actualizar contraseña</h1>

      {!isRecoverySessionReady ? (
        <div className="mt-6 rounded-lg border border-red-300 bg-red-100 px-3 py-3 text-sm font-medium text-red-800">
          El enlace de recuperación no es válido o expiró. Solicita uno nuevo.
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
        <label className="grid gap-1 text-sm font-medium text-zinc-800">
          <span>Nueva contraseña</span>
          <input
            type="password"
            name="new_password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            className="rounded-lg border border-zinc-400 bg-white px-3 py-2 text-zinc-900 placeholder-zinc-500 shadow-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/20"
            placeholder="Mínimo 6 caracteres"
            required
            minLength={6}
            disabled={!isRecoverySessionReady || isSubmitting}
          />
        </label>

        <label className="grid gap-1 text-sm font-medium text-zinc-800">
          <span>Confirmar contraseña</span>
          <input
            type="password"
            name="confirm_password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="rounded-lg border border-zinc-400 bg-white px-3 py-2 text-zinc-900 placeholder-zinc-500 shadow-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/20"
            placeholder="Repite la nueva contraseña"
            required
            minLength={6}
            disabled={!isRecoverySessionReady || isSubmitting}
          />
        </label>

        {error ? (
          <p className="rounded-lg border border-red-300 bg-red-100 px-3 py-2 text-sm font-medium text-red-800">
            {error}
          </p>
        ) : null}

        {success ? (
          <p className="rounded-lg border border-emerald-300 bg-emerald-100 px-3 py-2 text-sm font-medium text-emerald-800">
            {success}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting || !isRecoverySessionReady}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {isSubmitting ? "Actualizando..." : "Actualizar contraseña"}
        </button>
      </form>

      <p className="mt-6 text-sm text-zinc-600">
        <Link href="/reset-password" className="font-medium text-zinc-900 underline">
          Solicitar nuevo enlace
        </Link>
      </p>
    </main>
  );
}
