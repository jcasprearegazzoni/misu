import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { ProfesorSettingsForm } from "./settings-form";

export default async function ProfesorConfiguracionPage() {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  if (profile.role !== "profesor") {
    redirect("/dashboard/alumno/turnos");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-4 py-8 sm:px-6 sm:py-10">
      {/* Header */}
      <div>
        <h1
          className="text-2xl font-black tracking-tight sm:text-3xl"
          style={{ color: "var(--foreground)" }}
        >
          Configuración
        </h1>
        <p className="mt-1.5 text-sm" style={{ color: "var(--muted)" }}>
          Definí reglas de cancelación y el flujo cuando un alumno queda solo en clase.
        </p>
      </div>

      {/* Info precios */}
      <div
        className="alert-info mt-6"
        style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}
      >
        <span style={{ flexShrink: 0 }}>💡</span>
        <p>
          Los precios de clase se gestionan en{" "}
          <strong style={{ color: "#93c5fd" }}>Finanzas</strong>, en la sección Parámetros financieros.
        </p>
      </div>

      {/* Formulario */}
      <div className="card mt-6 p-5">
        <ProfesorSettingsForm
          initialValues={{
            cancel_without_charge_hours:
              profile.cancel_without_charge_hours === null
                ? ""
                : String(profile.cancel_without_charge_hours),
            solo_warning_hours: profile.solo_warning_hours === null ? "" : String(profile.solo_warning_hours),
            solo_decision_deadline_minutes:
              profile.solo_decision_deadline_minutes === null
                ? ""
                : String(profile.solo_decision_deadline_minutes),
          }}
        />
      </div>
    </main>
  );
}
