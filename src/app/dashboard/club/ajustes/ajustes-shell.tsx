"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CurrentClub } from "@/lib/auth/get-current-club";
import { ClubPerfilForm } from "@/app/dashboard/club/perfil/perfil-form";
import { CanchasManager } from "@/app/dashboard/club/canchas/canchas-manager";
import { DisponibilidadManager } from "@/app/dashboard/club/configuracion/disponibilidad-manager";
import { FranjasManager } from "@/app/dashboard/club/configuracion/franjas-manager";
import { CancelarInvitacionForm } from "@/app/dashboard/club/profesores/cancelar-invitacion-form";
import { EliminarProfesorForm } from "@/app/dashboard/club/profesores/eliminar-profesor-form";
import { InvitarProfesorForm } from "@/app/dashboard/club/profesores/invitar-profesor-form";
import type { DeporteConfiguracion } from "@/app/dashboard/club/configuracion/disponibilidad-manager";
import { GatewayConfigForm } from "@/components/payments/GatewayConfigForm";
import { saveClubGatewayConfig } from "./gateway-actions";

type SectionKey = "perfil" | "profesores" | "horarios" | "pagos";

const sectionLabels: Record<SectionKey, string> = {
  perfil: "Perfil",
  profesores: "Profesores",
  horarios: "Canchas",
  pagos: "Pagos online",
};

type Cancha = {
  id: number;
  club_id: number;
  nombre: string;
  deporte: "tenis" | "padel" | "futbol";
  pared: "blindex" | "muro" | "mixto" | null;
  superficie: "sintetico" | "polvo_ladrillo" | "cemento" | "blindex" | "f5" | "f7" | "f8" | "f11";
  techada: boolean;
  iluminacion: boolean;
  activa: boolean;
};

type ClubProfesorRow = {
  status: "pendiente" | "activo" | "inactivo";
  invited_at: string | null;
  profesor_id: string;
};

type ProfesorSearchRow = {
  user_id: string;
  name: string | null;
  username: string | null;
  sport: string | null;
  zone: string | null;
  provincia: string | null;
};

type DisponibilidadItem = {
  id: number;
  deporte: DeporteConfiguracion;
  day_of_week: number;
  apertura: string;
  cierre: string;
  duraciones: number[];
};

type FranjaItem = {
  id: number;
  deporte: DeporteConfiguracion;
  day_of_week: number;
  desde: string;
  hasta: string;
  duracion_minutos: number;
  precio: number;
  cancha_id: number | null;
};

type Props = {
  club: CurrentClub;
  configuracion: { confirmacion_automatica: boolean; cancelacion_horas_limite: number };
  canchas: Cancha[];
  clubProfesores: ClubProfesorRow[];
  perfilesMap: Record<string, ProfesorSearchRow>;
  disponibilidad: DisponibilidadItem[];
  franjas: FranjaItem[];
  canchasActivas: { id: number; nombre: string; deporte: string }[];
  searchQuery: string;
  searchResults: ProfesorSearchRow[];
  defaultSection: string | null;
  profileUpdated: boolean;
  gatewayInitialValues: {
    enabled: boolean;
    gateway: "mercadopago" | null;
    hasToken: boolean;
  };
};

function resolveSectionKey(value: string | null | undefined): SectionKey {
  const valid = new Set<SectionKey>(["perfil", "profesores", "horarios", "pagos"]);
  if (value && valid.has(value as SectionKey)) return value as SectionKey;
  return "perfil";
}

function StatusPill({ status }: { status: "pendiente" | "activo" | "inactivo" }) {
  const styles =
    status === "activo"
      ? { background: "var(--success-bg)", color: "var(--success)" }
      : status === "pendiente"
        ? { background: "var(--warning-bg)", color: "var(--warning)" }
        : { background: "var(--muted-2)", color: "var(--muted)" };

  const label = status === "activo" ? "Activo" : status === "pendiente" ? "Pendiente" : "Inactivo";

  return (
    <span className="pill text-xs" style={styles}>
      {label}
    </span>
  );
}

function formatInvitadoHace(invited_at: string | null): string {
  if (!invited_at) return "";
  const diffMs = Date.now() - new Date(invited_at).getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Invitado hoy";
  if (diffDays === 1) return "Invitado ayer";
  if (diffDays < 7) return `Invitado hace ${diffDays} días`;
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 5) return `Invitado hace ${diffWeeks} ${diffWeeks === 1 ? "semana" : "semanas"}`;
  const diffMonths = Math.floor(diffDays / 30);
  return `Invitado hace ${diffMonths} ${diffMonths === 1 ? "mes" : "meses"}`;
}

function getSportTheme(deporte: DeporteConfiguracion) {
  if (deporte === "tenis") {
    return { activeBg: "#16a34a", border: "rgba(34, 197, 94, 0.4)", softBg: "rgba(22, 163, 74, 0.18)" };
  }
  if (deporte === "padel") {
    return { activeBg: "#d97706", border: "rgba(245, 158, 11, 0.4)", softBg: "rgba(217, 119, 6, 0.18)" };
  }
  return { activeBg: "#2563eb", border: "rgba(59, 130, 246, 0.4)", softBg: "rgba(37, 99, 235, 0.18)" };
}

export function ClubAjustesShell({
  club,
  configuracion,
  canchas,
  clubProfesores,
  perfilesMap,
  disponibilidad,
  franjas,
  canchasActivas,
  searchQuery,
  searchResults,
  defaultSection,
  profileUpdated,
  gatewayInitialValues,
}: Props) {
  const [activeSection, setActiveSection] = useState<SectionKey>(resolveSectionKey(defaultSection));
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const contentTopRef = useRef<HTMLDivElement | null>(null);
  const deportesDisponibles = useMemo<DeporteConfiguracion[]>(() => {
    const result: DeporteConfiguracion[] = [];
    if (club.tiene_tenis) result.push("tenis");
    if (club.tiene_padel) result.push("padel");
    if (club.tiene_futbol) result.push("futbol");
    return result.length > 0 ? result : ["tenis", "padel", "futbol"];
  }, [club]);
  const defaultSport = useMemo<DeporteConfiguracion>(() => {
    const fromData = [...disponibilidad, ...franjas]
      .map((item) => item.deporte)
      .find((deporte) => deportesDisponibles.includes(deporte));
    return fromData ?? deportesDisponibles[0] ?? "tenis";
  }, [disponibilidad, franjas, deportesDisponibles]);
  const [selectedDeporte, setSelectedDeporte] = useState<DeporteConfiguracion>(
    deportesDisponibles[0] ?? "tenis",
  );
  const sportSoftBg = selectedDeporte === "tenis"
    ? "rgba(22, 163, 74, 0.06)"
    : selectedDeporte === "padel"
      ? "rgba(217, 119, 6, 0.06)"
      : "rgba(37, 99, 235, 0.06)";

  useEffect(() => {
    if (!deportesDisponibles.includes(selectedDeporte)) {
      setSelectedDeporte(deportesDisponibles[0] ?? "tenis");
      return;
    }
    if (defaultSport !== selectedDeporte) {
      setSelectedDeporte(defaultSport);
    }
  }, [defaultSport, deportesDisponibles]);

  useEffect(() => {
    function syncFromHash() {
      const hash = window.location.hash.replace("#", "");
      setActiveSection(resolveSectionKey(hash || defaultSection));
    }
    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, [defaultSection]);

  function handleSectionChange(section: SectionKey) {
    setActiveSection(section);
    window.history.replaceState(null, "", `#${section}`);
    setIsMobileMenuOpen(false);
    contentTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function ProfesorAvatar({ name }: { name: string | null }) {
    const initials = (name ?? "?")
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("");
    return (
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
        style={{ background: "var(--misu)" }}
      >
        {initials || "?"}
      </div>
    );
  }

  function SportDot({ sport }: { sport: string | null }) {
    const color =
      sport === "tenis" ? "#16a34a" :
      sport === "padel" ? "#d97706" :
      sport === "futbol" ? "#2563eb" :
      "var(--muted)";
    return (
      <span
        className="inline-block h-2 w-2 rounded-full shrink-0"
        style={{ background: color }}
      />
    );
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
            <span>{sectionLabels[activeSection]}</span>
            <span style={{ color: "var(--muted)" }}>{isMobileMenuOpen ? "▲" : "▼"}</span>
          </button>

          {isMobileMenuOpen ? (
            <nav
              id="ajustes-mobile-menu"
              aria-label="Submenu móvil de ajustes"
              className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-20 grid gap-1 rounded-md p-1 shadow-xl"
              style={{
                background: "var(--surface-2)",
                border: "1px solid var(--border-hover)",
              }}
            >
              {(Object.keys(sectionLabels) as SectionKey[]).map((key) => {
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
                    {sectionLabels[key]}
                  </button>
                );
              })}
            </nav>
          ) : null}
        </div>
      </div>

      <div className="mt-3 grid gap-4 md:mt-0 md:grid-cols-[160px_minmax(0,1fr)] md:items-start">
        <aside className="hidden card p-2 md:sticky md:top-24 md:block">
          <nav aria-label="Submenu de ajustes" className="grid gap-1">
            {(Object.keys(sectionLabels) as SectionKey[]).map((key) => {
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
                  {sectionLabels[key]}
                </button>
              );
            })}
          </nav>
        </aside>

        <section className="min-w-0">
          <div ref={contentTopRef} />

          {activeSection === "perfil" ? (
            <div className="card p-4 sm:p-5">
              <ClubPerfilForm
                club={club}
                configuracion={configuracion}
                successMessage={profileUpdated ? "Perfil actualizado correctamente." : null}
                returnTo="/dashboard/club/ajustes?section=perfil"
              />
            </div>
          ) : null}

          {activeSection === "profesores" ? (
            <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
              <div className="order-2 card p-4 lg:order-1">
                <div className="mb-4 flex items-center gap-2">
                  <h2 className="text-base font-semibold" style={{ color: "var(--foreground)" }}>
                    Profesores
                  </h2>
                  {clubProfesores.length > 0 && (
                    <span className="pill text-xs" style={{ background: "var(--surface-3)", color: "var(--muted)" }}>
                      {clubProfesores.length}
                    </span>
                  )}
                </div>

                {clubProfesores.length === 0 ? (
                  <div
                    className="flex flex-col items-center gap-2 rounded-lg border px-4 py-8 text-center text-sm"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <p className="font-medium" style={{ color: "var(--foreground)" }}>
                      Sin profesores todavía
                    </p>
                    <p style={{ color: "var(--muted)" }}>Usá el buscador para invitar tu primer profesor →</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {clubProfesores.map((item) => {
                      const perfil = perfilesMap[item.profesor_id];
                      const isPending = item.status === "pendiente";
                      return (
                        <div
                          key={item.profesor_id}
                          className="flex flex-col gap-3 rounded-lg border px-3 py-3 sm:flex-row sm:items-center"
                          style={{
                            borderColor: isPending ? "var(--warning)" : "var(--border)",
                            borderLeftWidth: isPending ? "3px" : "1px",
                            background: isPending ? "var(--warning-bg)" : "var(--surface-2)",
                          }}
                        >
                          <ProfesorAvatar name={perfil?.name ?? null} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                              {perfil?.name ?? "Profesor sin nombre"}
                            </p>
                            <div className="flex flex-wrap items-center gap-1.5 text-xs" style={{ color: "var(--muted)" }}>
                              <span>@{perfil?.username ?? "sin-usuario"}</span>
                              {perfil?.sport && (
                                <>
                                  <span>·</span>
                                  <SportDot sport={perfil.sport} />
                                  <span>{perfil.sport}</span>
                                </>
                              )}
                              {(perfil?.zone ?? perfil?.provincia) && (
                                <>
                                  <span>·</span>
                                  <span className="truncate">{perfil?.zone ?? perfil?.provincia}</span>
                                </>
                              )}
                            </div>
                            {isPending && item.invited_at && (
                              <p className="mt-0.5 text-xs" style={{ color: "var(--warning)" }}>
                                {formatInvitadoHace(item.invited_at)}
                              </p>
                            )}
                          </div>
                          <div className="flex shrink-0 items-center gap-2 self-end sm:self-auto">
                            <StatusPill status={item.status} />
                            {item.status === "pendiente" ? (
                              <CancelarInvitacionForm profesorId={item.profesor_id} />
                            ) : item.status === "activo" ? (
                              <EliminarProfesorForm
                                profesorId={item.profesor_id}
                                profesorNombre={perfil?.name ?? "este profesor"}
                              />
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="order-1 card p-4 lg:order-2">
                <h2 className="mb-4 text-base font-semibold" style={{ color: "var(--foreground)" }}>
                  Agregar profesor
                </h2>

                <form className="flex flex-col gap-2 sm:flex-row" method="get">
                  <input type="hidden" name="section" value="profesores" />
                  <input
                    name="q"
                    defaultValue={searchQuery}
                    className="input flex-1"
                    placeholder="Nombre, usuario o zona..."
                    autoComplete="off"
                  />
                  <button className="btn-primary h-10 w-full shrink-0 px-3 sm:w-auto" type="submit">
                    Buscar
                  </button>
                </form>

                <div className="mt-4">
                  {searchQuery.length >= 2 ? (
                    searchResults.length > 0 ? (
                      <div className="space-y-2">
                        {searchResults.map((result) => (
                          <div
                            key={result.user_id}
                            className="flex flex-col gap-3 rounded-lg border px-3 py-3 sm:flex-row sm:items-center"
                            style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
                          >
                            <ProfesorAvatar name={result.name} />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                                {result.name ?? "Profesor sin nombre"}
                              </p>
                              <div className="flex flex-wrap items-center gap-1.5 text-xs" style={{ color: "var(--muted)" }}>
                                <span>@{result.username ?? "sin-usuario"}</span>
                                {result.sport && (
                                  <>
                                    <span>·</span>
                                    <SportDot sport={result.sport} />
                                    <span>{result.sport}</span>
                                  </>
                                )}
                                {(result.zone ?? result.provincia) && (
                                  <>
                                    <span>·</span>
                                    <span className="truncate">{result.zone ?? result.provincia}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="self-end sm:self-auto">
                              <InvitarProfesorForm profesorUserId={result.user_id} />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm" style={{ color: "var(--muted)" }}>
                        No se encontraron profesores con ese criterio.
                      </p>
                    )
                  ) : (
                    <p className="text-sm" style={{ color: "var(--muted)" }}>
                      Escribí al menos 2 caracteres para buscar.
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : null}

          {activeSection === "horarios" ? (
            <div className="grid gap-6">
              <div>
                <h2 className="text-base font-semibold sm:text-lg" style={{ color: "var(--foreground)" }}>
                  Elegí un deporte para ver y configurar sus canchas, horarios y precios.
                </h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {deportesDisponibles.map((dep) => {
                    const theme = getSportTheme(dep);
                    const isActive = selectedDeporte === dep;
                    const label = dep === "tenis" ? "Tenis" : dep === "padel" ? "Padel" : "Futbol";
                    return (
                      <button
                        key={dep}
                        type="button"
                        onClick={() => setSelectedDeporte(dep)}
                        className="rounded-full px-3 py-1 text-sm font-medium transition-all duration-200 hover:-translate-y-0.5"
                        style={
                          isActive
                            ? { background: theme.activeBg, color: "#fff" }
                            : {
                                border: `1px solid ${theme.border}`,
                                background: theme.softBg,
                                color: "var(--muted)",
                              }
                        }
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="mb-3 flex items-center gap-3">
                  <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                    Canchas
                  </h3>
                  {(() => {
                    const count = canchas.filter((c) => c.deporte === selectedDeporte).length;
                    return count > 0 ? (
                      <span className="pill" style={{ background: "var(--surface-2)", color: "var(--muted)" }}>
                        {count}
                      </span>
                    ) : null;
                  })()}
                  <div className="flex-1 border-t" style={{ borderColor: "var(--border)" }} />
                </div>
                <CanchasManager canchas={canchas} clubId={club.id} filterDeporte={selectedDeporte} />
              </div>

              <div className="flex items-center gap-3">
                <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                  Horarios y precios
                </h3>
                <div className="flex-1 border-t" style={{ borderColor: "var(--border)" }} />
              </div>

              <div className="grid gap-3 lg:grid-cols-2">
                <div className="rounded-xl p-3" style={{ background: sportSoftBg }}>
                  <DisponibilidadManager items={disponibilidad} selectedDeporte={selectedDeporte} bare />
                </div>
                <div className="rounded-xl p-3" style={{ background: sportSoftBg }}>
                  <FranjasManager
                    items={franjas}
                    disponibilidadItems={disponibilidad}
                    selectedDeporte={selectedDeporte}
                    canchas={canchasActivas}
                    bare
                  />
                </div>
              </div>
            </div>
          ) : null}

          {activeSection === "pagos" ? (
            <div className="card p-4 sm:p-5">
              <h2 className="text-base font-semibold" style={{ color: "var(--foreground)" }}>
                Pagos online
              </h2>
              <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
                Habilitá MercadoPago para recibir señas o pagos de reservas directamente desde la app.
              </p>
              <div className="mt-4">
                <GatewayConfigForm
                  enabled={gatewayInitialValues.enabled}
                  gateway={gatewayInitialValues.gateway}
                  hasToken={gatewayInitialValues.hasToken}
                  onSave={saveClubGatewayConfig}
                />
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
