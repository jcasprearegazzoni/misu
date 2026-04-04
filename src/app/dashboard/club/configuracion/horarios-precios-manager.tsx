"use client";

import { useMemo, useState } from "react";
import { DisponibilidadManager, type DeporteConfiguracion } from "./disponibilidad-manager";
import { FranjasManager } from "./franjas-manager";

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
};

type Props = {
  disponibilidad: DisponibilidadItem[];
  franjas: FranjaItem[];
};

const deportes: Array<{ value: DeporteConfiguracion; label: string }> = [
  { value: "tenis", label: "Tenis" },
  { value: "padel", label: "Padel" },
  { value: "futbol", label: "Futbol" },
];

function getSportTheme(deporte: DeporteConfiguracion) {
  if (deporte === "tenis") return { activeBg: "#16a34a", border: "rgba(34, 197, 94, 0.4)", softBg: "rgba(22, 163, 74, 0.18)" };
  if (deporte === "padel") return { activeBg: "#d97706", border: "rgba(245, 158, 11, 0.4)", softBg: "rgba(217, 119, 6, 0.18)" };
  return { activeBg: "#2563eb", border: "rgba(59, 130, 246, 0.4)", softBg: "rgba(37, 99, 235, 0.18)" };
}

export function HorariosPreciosManager({ disponibilidad, franjas }: Props) {
  const defaultSport = useMemo<DeporteConfiguracion>(() => {
    const fromData = [...disponibilidad, ...franjas].find((item) => item.deporte);
    return fromData?.deporte ?? "tenis";
  }, [disponibilidad, franjas]);

  const [selectedDeporte, setSelectedDeporte] = useState<DeporteConfiguracion>(defaultSport);
  const [isDisponibilidadOpen, setIsDisponibilidadOpen] = useState(false);
  const [isFranjasOpen, setIsFranjasOpen] = useState(false);

  return (
    <section className="card p-5 sm:p-6">
      <div>
        <h2 className="text-base font-semibold sm:text-lg" style={{ color: "var(--foreground)" }}>
          Horarios y precios
        </h2>
        <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
          Elegi un deporte y configura disponibilidad y precios en un solo paso.
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {deportes.map((deporte) => {
          const theme = getSportTheme(deporte.value);
          const isActive = selectedDeporte === deporte.value;
          return (
            <button
              key={deporte.value}
              type="button"
              onClick={() => setSelectedDeporte(deporte.value)}
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
              {deporte.label}
            </button>
          );
        })}
      </div>

      <div className="mt-5 grid gap-4">
        <section className="rounded-xl border p-3 sm:p-4" style={{ borderColor: "var(--border)" }}>
          <button
            type="button"
            onClick={() => setIsDisponibilidadOpen((prev) => !prev)}
            aria-expanded={isDisponibilidadOpen}
            className="group flex w-full items-center justify-between gap-3 rounded-lg px-1 py-1 text-left transition-all duration-200"
          >
            <span className="text-sm font-semibold sm:text-base" style={{ color: "var(--foreground)" }}>
              Disponibilidad
            </span>
            <span
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border transition-colors duration-200 group-hover:border-[var(--accent)] group-hover:text-[var(--foreground)]"
              style={{ borderColor: "var(--border)", color: "var(--muted)", background: "var(--surface-1)" }}
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                fill="none"
                className={`h-5 w-5 transition-transform duration-300 ${isDisponibilidadOpen ? "rotate-180" : "rotate-0"}`}
              >
                <path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </button>
          {isDisponibilidadOpen ? (
            <div className="mt-3">
              <DisponibilidadManager items={disponibilidad} selectedDeporte={selectedDeporte} />
            </div>
          ) : null}
        </section>

        <section className="rounded-xl border p-3 sm:p-4" style={{ borderColor: "var(--border)" }}>
          <button
            type="button"
            onClick={() => setIsFranjasOpen((prev) => !prev)}
            aria-expanded={isFranjasOpen}
            className="group flex w-full items-center justify-between gap-3 rounded-lg px-1 py-1 text-left transition-all duration-200"
          >
            <span className="text-sm font-semibold sm:text-base" style={{ color: "var(--foreground)" }}>
              Precios por franja
            </span>
            <span
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border transition-colors duration-200 group-hover:border-[var(--accent)] group-hover:text-[var(--foreground)]"
              style={{ borderColor: "var(--border)", color: "var(--muted)", background: "var(--surface-1)" }}
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                fill="none"
                className={`h-5 w-5 transition-transform duration-300 ${isFranjasOpen ? "rotate-180" : "rotate-0"}`}
              >
                <path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </button>
          {isFranjasOpen ? (
            <div className="mt-3">
              <FranjasManager items={franjas} disponibilidadItems={disponibilidad} selectedDeporte={selectedDeporte} />
            </div>
          ) : null}
        </section>
      </div>
    </section>
  );
}
