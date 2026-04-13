"use client";

import { useMemo, useState } from "react";

export type GatewayConfigFormProps = {
  enabled: boolean;
  gateway: "mercadopago" | null;
  hasToken: boolean;
  onSave: (data: {
    enabled: boolean;
    gateway: "mercadopago";
    accessToken: string | null;
  }) => Promise<{ error?: string }>;
};

export function GatewayConfigForm({ enabled, gateway, hasToken, onSave }: GatewayConfigFormProps) {
  const [isEnabled, setIsEnabled] = useState(enabled);
  const [selectedGateway, setSelectedGateway] = useState<"mercadopago">(gateway ?? "mercadopago");
  const [accessTokenInput, setAccessTokenInput] = useState("");
  const [isTokenVisible, setIsTokenVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const accessTokenPlaceholder = useMemo(() => {
    if (hasToken) {
      return "••••••••• (token guardado)";
    }
    return "Pegá tu Access Token de producción";
  }, [hasToken]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const trimmedToken = accessTokenInput.trim();

    // Si se habilita y no existe token previo, se exige un token nuevo.
    if (isEnabled && !hasToken && trimmedToken.length === 0) {
      setErrorMessage("El Access Token es requerido para habilitar los pagos online");
      return;
    }

    // Si no se escribe token y ya habia uno, no se modifica el valor guardado.
    const accessTokenToSave = trimmedToken.length > 0 ? trimmedToken : hasToken ? null : null;

    setIsSaving(true);
    try {
      const result = await onSave({
        enabled: isEnabled,
        gateway: selectedGateway,
        accessToken: accessTokenToSave,
      });

      if (result.error) {
        setErrorMessage(result.error);
        return;
      }

      setSuccessMessage("Configuración guardada correctamente.");
      setAccessTokenInput("");
    } catch {
      setErrorMessage("No se pudo guardar la configuración de pagos online.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div
        className="rounded-xl border p-4"
        style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
      >
        <label className="flex cursor-pointer items-center justify-between gap-3">
          <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
            Habilitar cobro online
          </span>
          <input
            type="checkbox"
            checked={isEnabled}
            onChange={(event) => setIsEnabled(event.target.checked)}
            className="h-4 w-4"
          />
        </label>
      </div>

      <fieldset
        className="grid gap-4 rounded-xl border p-4"
        style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
        disabled={!isEnabled || isSaving}
      >
        <legend className="px-1 text-xs font-semibold uppercase" style={{ color: "var(--muted)" }}>
          Gateway
        </legend>

        <label className="flex items-center gap-2 text-sm" style={{ color: "var(--foreground)" }}>
          <input
            type="radio"
            name="gateway"
            value="mercadopago"
            checked={selectedGateway === "mercadopago"}
            onChange={() => setSelectedGateway("mercadopago")}
          />
          MercadoPago
        </label>

        <div className="grid gap-2">
          <label htmlFor="gateway-access-token" className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
            Access Token
          </label>

          <div
            className="flex items-center gap-2 rounded-lg border px-3 py-2"
            style={{ borderColor: "var(--border)", background: "var(--surface)" }}
          >
            <input
              id="gateway-access-token"
              type={isTokenVisible ? "text" : "password"}
              value={accessTokenInput}
              onChange={(event) => setAccessTokenInput(event.target.value)}
              className="w-full bg-transparent text-sm outline-none"
              style={{ color: "var(--foreground)" }}
              placeholder={accessTokenPlaceholder}
              autoComplete="off"
              spellCheck={false}
            />
            <button
              type="button"
              onClick={() => setIsTokenVisible((prev) => !prev)}
              className="shrink-0 rounded-md px-2 py-1 text-xs font-medium"
              style={{ border: "1px solid var(--border)", color: "var(--muted)" }}
            >
              {isTokenVisible ? "Ocultar" : "Mostrar"}
            </button>
          </div>
        </div>
      </fieldset>

      {errorMessage ? <p className="text-sm" style={{ color: "var(--danger)" }}>{errorMessage}</p> : null}
      {successMessage ? <p className="text-sm" style={{ color: "var(--success)" }}>{successMessage}</p> : null}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSaving}
          className="btn-primary w-full justify-center sm:w-auto disabled:opacity-60"
        >
          {isSaving ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </form>
  );
}
