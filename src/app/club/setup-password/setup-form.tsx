"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Phase = "loading" | "ready" | "success" | "error";

export function SetupForm() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // Una sola instancia del cliente para que la sesión en memoria persista entre setSession y updateUser
  const supabase = useRef(createSupabaseBrowserClient());
  const router = useRouter();

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    const type = params.get("type");

    if (type !== "invite" || !accessToken || !refreshToken) {
      setErrorMsg("Link de invitación inválido o expirado.");
      setPhase("error");
      return;
    }

    supabase.current.auth
      .setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(({ error }) => {
        if (error) {
          setErrorMsg("No se pudo verificar la invitación.");
          setPhase("error");
        } else {
          // Limpia el hash de la URL para evitar re-uso accidental
          window.history.replaceState(null, "", window.location.pathname);
          setPhase("ready");
        }
      });
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (password !== confirm) {
      setErrorMsg("Las contraseñas no coinciden.");
      return;
    }
    if (password.length < 8) {
      setErrorMsg("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    setErrorMsg(null);
    setSubmitting(true);

    const { error } = await supabase.current.auth.updateUser({ password });

    if (error) {
      setErrorMsg("No se pudo guardar la contraseña.");
      setSubmitting(false);
    } else {
      setPhase("success");
      router.push("/");
    }
  }

  if (phase === "loading") {
    return (
      <p className="mt-7 text-sm" style={{ color: "var(--muted)" }}>
        Verificando invitación...
      </p>
    );
  }

  if (phase === "error") {
    return <div className="alert-error mt-7">{errorMsg}</div>;
  }

  if (phase === "success") {
    return (
      <div className="alert-success mt-7">¡Contraseña creada! Redirigiendo...</div>
    );
  }

  return (
    <form className="mt-7 grid gap-4" onSubmit={handleSubmit}>
      <label className="label">
        <span>Contraseña</span>
        <input
          type="password"
          className="input"
          placeholder="Mínimo 8 caracteres"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setErrorMsg(null);
          }}
          required
          minLength={8}
          autoComplete="new-password"
        />
      </label>

      <label className="label">
        <span>Confirmar contraseña</span>
        <input
          type="password"
          className="input"
          placeholder="Repetí tu contraseña"
          value={confirm}
          onChange={(e) => {
            setConfirm(e.target.value);
            setErrorMsg(null);
          }}
          required
          minLength={8}
          autoComplete="new-password"
        />
      </label>

      {errorMsg ? <div className="alert-error">{errorMsg}</div> : null}

      <button
        type="submit"
        disabled={submitting}
        className="btn-primary mt-2 w-full"
        style={{ padding: "0.75rem", fontSize: "0.9375rem", justifyContent: "center" }}
      >
        {submitting ? "Guardando..." : "Confirmar"}
      </button>
    </form>
  );
}
