"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ProfesorSettingsForm } from "@/app/dashboard/profesor/configuracion/settings-form";
import { PriceSettingsForm } from "@/app/dashboard/profesor/finanzas/price-settings-form";
import { ClubsManager } from "@/app/dashboard/profesor/perfil/clubs-manager";
import { PerfilForm } from "@/app/dashboard/profesor/perfil/perfil-form";
import { InvitacionesManager } from "@/app/dashboard/profesor/perfil/invitaciones-manager";
import { FrequentScheduleManager } from "@/app/dashboard/profesor/clases/disponibilidad/frequent-schedule-manager";
import { AusenciasManager } from "@/app/dashboard/profesor/clases/disponibilidad/ausencias-manager";
import { GatewayConfigForm } from "@/components/payments/GatewayConfigForm";
import { saveProfesorGatewayConfig } from "./gateway-actions";

type ChecklistItem = {
  id: string;
  label: string;
  done: boolean;
  href: string;
  cta: string;
};

type Invitacion = {
  id: number;
  club: { nombre: string; direccion: string | null };
  invited_at: string;
};

type ClubPropio = {
  id: number;
  nombre: string;
};

type Club = {
  id: number;
  nombre: string;
  direccion: string | null;
  deporte: "tenis" | "padel" | "ambos";
  is_placeholder: boolean;
  court_cost_mode: "fixed_per_hour" | "per_student_percentage";
  court_cost_per_hour: number | null;
  court_percentage_per_student: number | null;
  cp_status: "pendiente" | "activo" | "inactivo";
};

type AvailabilityRow = {
  id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
  club_id: number | null;
  club_nombre: string | null;
};

type BlockedDateRow = {
  id: number;
  start_at: string;
  end_at: string;
  reason: string | null;
};

type AjustesSectionKey =
  | "onboarding"
  | "datos"
  | "precios"
  | "operativos"
  | "horarios"
  | "clubes"
  | "pagos";

type AjustesShellProps = {
  successMessage: string | null;
  checklist: ChecklistItem[];
  perfilInitialValues: {
    name: string;
    username: string;
    bio: string;
    sport: "tenis" | "padel" | "ambos";
    provincia: string;
    municipio: string;
    localidad: string;
  };
  priceInitialValues: {
    price_individual: string;
    price_dobles: string;
    price_trio: string;
    price_grupal: string;
  };
  operationalInitialValues: {
    cancel_without_charge_hours: string;
    solo_warning_hours: string;
    solo_decision_deadline_minutes: string;
  };
  invitaciones: Invitacion[];
  clubsPropios: ClubPropio[];
  clubs: Club[];
  availability: AvailabilityRow[];
  blockedDates: BlockedDateRow[];
  clubsForAvailability: Array<{ id: number; nombre: string }>;
  clubsError: boolean;
  gatewayInitialValues: {
    enabled: boolean;
    gateway: "mercadopago" | null;
    hasToken: boolean;
  };
};

const sectionLabels: Record<AjustesSectionKey, string> = {
  onboarding: "Para empezar",
  datos: "Datos del profesor",
  precios: "Precios",
  operativos: "Ajustes operativos",
  horarios: "Horarios",
  clubes: "Clubes",
  pagos: "Pagos online",
};

const sectionShortLabels: Record<AjustesSectionKey, string> = {
  onboarding: "Empezar",
  datos: "Datos",
  precios: "Precios",
  operativos: "Operativos",
  horarios: "Horarios",
  clubes: "Clubes",
  pagos: "Pagos",
};

const validSectionKeys = new Set<AjustesSectionKey>([
  "onboarding",
  "datos",
  "precios",
  "operativos",
  "horarios",
  "clubes",
  "pagos",
]);

function resolveSectionKey(
  value: string | null | undefined,
  hasPendingOnboarding: boolean,
): AjustesSectionKey {
  if (value === "ajustes") {
    return "operativos";
  }

  if (value && validSectionKeys.has(value as AjustesSectionKey)) {
    if (!hasPendingOnboarding && value === "onboarding") {
      return "datos";
    }

    return value as AjustesSectionKey;
  }

  return hasPendingOnboarding ? "onboarding" : "datos";
}

export function AjustesShell({
  successMessage,
  checklist,
  perfilInitialValues,
  priceInitialValues,
  operationalInitialValues,
  invitaciones,
  clubsPropios,
  clubs,
  availability,
  blockedDates,
  clubsForAvailability,
  clubsError,
  gatewayInitialValues,
}: AjustesShellProps) {
  const doneCount = useMemo(() => checklist.filter((item) => item.done).length, [checklist]);
  const hasPendingOnboarding = doneCount < checklist.length;
  const [activeSection, setActiveSection] = useState<AjustesSectionKey>(
    hasPendingOnboarding ? "onboarding" : "datos",
  );
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const contentTopRef = useRef<HTMLDivElement | null>(null);
  const visibleSections = useMemo(
    () =>
      ([
        hasPendingOnboarding ? "onboarding" : null,
        "datos",
        "precios",
        "operativos",
        "horarios",
        "clubes",
        "pagos",
      ].filter((item) => item !== null) as AjustesSectionKey[]),
    [hasPendingOnboarding],
  );

  useEffect(() => {
    function syncSectionFromHash() {
      const hashValue = window.location.hash.replace("#", "");
      setActiveSection(resolveSectionKey(hashValue, hasPendingOnboarding));
    }

    syncSectionFromHash();
    window.addEventListener("hashchange", syncSectionFromHash);

    return () => {
      window.removeEventListener("hashchange", syncSectionFromHash);
    };
  }, [hasPendingOnboarding]);

  function handleSectionChange(section: AjustesSectionKey) {
    setActiveSection(section);
    window.history.replaceState(null, "", `#${section}`);
    setIsMobileMenuOpen(false);
    contentTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="mt-6">
      <div className="card p-2 md:hidden">
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            className="flex min-h-[44px] w-full items-center justify-between rounded-md px-3 py-2.5 text-sm font-medium"
            style={{
              background: "var(--surface-3)",
              color: "var(--foreground)",
              border: "1px solid var(--border-hover)",
            }}
            aria-expanded={isMobileMenuOpen}
            aria-controls="ajustes-mobile-menu"
          >
            <span>{sectionShortLabels[activeSection]}</span>
            <span style={{ color: "var(--muted)" }}>{isMobileMenuOpen ? "▲" : "▼"}</span>
          </button>

          {isMobileMenuOpen ? (
            <nav
              id="ajustes-mobile-menu"
              aria-label="Submenu movil de ajustes"
              className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-20 grid gap-1 rounded-md p-1 shadow-xl"
              style={{
                background: "var(--surface-2)",
                border: "1px solid var(--border-hover)",
              }}
            >
              {visibleSections.map((key) => {
                const isActive = activeSection === key;
                return (
                  <button
                    key={`mobile-${key}`}
                    type="button"
                    onClick={() => handleSectionChange(key)}
                    className="w-full rounded-md px-3 py-2.5 text-left text-sm font-medium"
                    style={{
                      minHeight: "44px",
                      background: isActive ? "var(--surface-3)" : "transparent",
                      color: isActive ? "var(--foreground)" : "var(--muted)",
                      border: `1px solid ${isActive ? "var(--border-hover)" : "var(--border)"}`,
                    }}
                  >
                    <span className="flex w-full items-center justify-between gap-2">
                      <span>{sectionShortLabels[key]}</span>
                      {key === "clubes" && invitaciones.length > 0 ? (
                        <span
                          className="inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold"
                          style={{ background: "var(--warning)", color: "#fff" }}
                        >
                          {invitaciones.length}
                        </span>
                      ) : null}
                    </span>
                  </button>
                );
              })}
            </nav>
          ) : null}
        </div>
      </div>

      <div className="mt-3 grid gap-4 md:mt-0 md:grid-cols-[220px_minmax(0,1fr)] md:items-start">
        <aside className="hidden card p-2 md:sticky md:top-24 md:block">
          <nav aria-label="Submenu de ajustes" className="grid gap-1">
            {visibleSections.map((key) => {
              const isActive = activeSection === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleSectionChange(key)}
                  className="w-full rounded-md px-3 py-2 text-left text-sm font-medium transition-opacity hover:opacity-90"
                  style={{
                    background: isActive ? "var(--surface-3)" : "transparent",
                    color: isActive ? "var(--foreground)" : "var(--muted)",
                    border: `1px solid ${isActive ? "var(--border)" : "transparent"}`,
                  }}
                >
                  <span className="flex w-full items-center justify-between gap-2">
                    <span>{sectionLabels[key]}</span>
                    {key === "clubes" && invitaciones.length > 0 ? (
                      <span
                        className="inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold"
                        style={{ background: "var(--warning)", color: "#fff" }}
                      >
                        {invitaciones.length}
                      </span>
                    ) : null}
                  </span>
                </button>
              );
            })}
          </nav>
        </aside>

        <section className="min-w-0">
          <div ref={contentTopRef} />

          {hasPendingOnboarding && activeSection === "onboarding" ? (
            <div className="card p-3 sm:p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-base font-semibold" style={{ color: "var(--foreground)" }}>
                  Para empezar
                </h2>
                <span className="text-xs font-medium" style={{ color: "var(--muted)" }}>
                  {doneCount}/{checklist.length} completados
                </span>
              </div>
              <ul className="mt-3 grid gap-2">
                {checklist.map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm"
                    style={{
                      borderColor: item.done ? "var(--success-border)" : "var(--border)",
                      background: item.done ? "var(--success-bg)" : "var(--surface-2)",
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-semibold"
                        style={{
                          background: item.done ? "rgba(34, 197, 94, 0.2)" : "var(--surface-3)",
                          color: item.done ? "var(--success)" : "var(--muted)",
                        }}
                      >
                        {item.done ? "\u2713" : "\u2022"}
                      </span>
                      <span style={{ color: "var(--foreground)" }}>{item.label}</span>
                    </div>
                    {!item.done ? (
                      item.href.startsWith("#") ? (
                        <button
                          type="button"
                          className="btn-secondary w-full sm:w-auto"
                          style={{ padding: "0.4rem 0.7rem" }}
                          onClick={() =>
                            handleSectionChange(resolveSectionKey(item.href.replace("#", ""), hasPendingOnboarding))
                          }
                        >
                          {item.cta}
                        </button>
                      ) : (
                        <Link href={item.href} className="btn-secondary w-full sm:w-auto" style={{ padding: "0.4rem 0.7rem" }}>
                          {item.cta}
                        </Link>
                      )
                    ) : (
                      <span className="text-xs font-medium" style={{ color: "var(--success)" }}>
                        Completo
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {activeSection === "datos" ? (
            <div className="card p-3 sm:p-4">
              <h2 className="text-base font-semibold" style={{ color: "var(--foreground)" }}>
                Datos del profesor
              </h2>
              <PerfilForm successMessage={successMessage} initialValues={perfilInitialValues} />
            </div>
          ) : null}

          {activeSection === "precios" ? (
            <div className="card p-3 sm:p-4">
              <h2 className="text-base font-semibold" style={{ color: "var(--foreground)" }}>
                Precios
              </h2>
              <div className="mt-4">
                <PriceSettingsForm initialValues={priceInitialValues} />
              </div>
            </div>
          ) : null}

          {activeSection === "operativos" ? (
            <div className="card p-3 sm:p-4">
              <h2 className="text-base font-semibold" style={{ color: "var(--foreground)" }}>
                Ajustes operativos
              </h2>
              <ProfesorSettingsForm initialValues={operationalInitialValues} />
            </div>
          ) : null}

          {activeSection === "horarios" ? (
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(320px,1fr)] lg:items-start">
              <div className="card min-w-0 overflow-x-hidden p-4">
                <h3 className="mb-4 text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                  Horario frecuente
                </h3>
                <FrequentScheduleManager availability={availability} clubs={clubsForAvailability} bare />
              </div>
              <div className="card min-w-0 overflow-x-hidden p-4">
                <AusenciasManager blockedDates={blockedDates} bare />
              </div>
            </div>
          ) : null}

          {activeSection === "clubes" ? (
            <div className="card p-3 sm:p-4">
              <h2 className="text-base font-semibold" style={{ color: "var(--foreground)" }}>
                Clubes
              </h2>

              {invitaciones.length > 0 ? (
                <div className="mb-6">
                  <div className="mb-3 flex items-center gap-2">
                    <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                      Invitaciones pendientes
                    </h3>
                    <span
                      className="pill text-xs font-semibold"
                      style={{ background: "var(--warning-bg)", color: "var(--warning)" }}
                    >
                      {invitaciones.length}
                    </span>
                  </div>
                  <InvitacionesManager invitaciones={invitaciones} clubsPropios={clubsPropios} />
                </div>
              ) : null}

              {clubsError ? (
                <p className="alert-error mt-4">
                  No se pudieron cargar los clubes en este momento. Intenta nuevamente.
                </p>
              ) : (
                <ClubsManager clubs={clubs} />
              )}
            </div>
          ) : null}

          {activeSection === "pagos" ? (
            <div className="card p-3 sm:p-4">
              <h2 className="text-base font-semibold" style={{ color: "var(--foreground)" }}>
                Pagos online
              </h2>
              <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
                Habilitá MercadoPago para que tus alumnos paguen paquetes directamente desde la app.
              </p>
              <div className="mt-4">
                <GatewayConfigForm
                  enabled={gatewayInitialValues.enabled}
                  gateway={gatewayInitialValues.gateway}
                  hasToken={gatewayInitialValues.hasToken}
                  onSave={saveProfesorGatewayConfig}
                />
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
