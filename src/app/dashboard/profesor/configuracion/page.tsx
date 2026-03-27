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
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-3 py-6 sm:px-4 sm:py-8">
      <h1 className="text-xl font-semibold text-zinc-900 sm:text-2xl">Configuracion del Profesor</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Define reglas de cancelacion y del flujo de alumno cuando queda solo en una clase.
      </p>

      <div className="mt-4 rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-700">
        <p>
          Los precios de clase ahora se gestionan en <strong>Finanzas</strong>, en la seccion
          Precios base.
        </p>
      </div>

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
    </main>
  );
}
