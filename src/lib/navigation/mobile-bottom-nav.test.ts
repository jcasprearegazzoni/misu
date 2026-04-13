import { describe, expect, it } from "vitest";
import {
  resolveActiveBottomNavIndex,
  type MobileBottomNavItem,
} from "./mobile-bottom-nav";

const items: MobileBottomNavItem[] = [
  {
    href: "/dashboard/profesor/turnos",
    label: "Clases",
    match: ["/dashboard/profesor/turnos", "/dashboard/profesor/calendario*"],
  },
  {
    href: "/dashboard/profesor/finanzas",
    label: "Finanzas",
    match: ["/dashboard/profesor/finanzas*", "/dashboard/profesor/pagos*"],
  },
  {
    href: "/dashboard/profesor/ajustes",
    label: "Ajustes",
    match: ["/dashboard/profesor/ajustes*"],
  },
];

describe("resolveActiveBottomNavIndex", () => {
  it("resuelve match exacto", () => {
    expect(resolveActiveBottomNavIndex("/dashboard/profesor/turnos", items)).toBe(0);
  });

  it("resuelve match por prefijo", () => {
    expect(resolveActiveBottomNavIndex("/dashboard/profesor/calendario/semana", items)).toBe(0);
  });

  it("prioriza exact match sobre prefijo", () => {
    const mixedItems: MobileBottomNavItem[] = [
      {
        href: "/dashboard/club/calendario",
        label: "Calendario",
        match: ["/dashboard/club*"],
      },
      {
        href: "/dashboard/club/ajustes",
        label: "Ajustes",
        match: ["/dashboard/club/ajustes"],
      },
    ];

    expect(resolveActiveBottomNavIndex("/dashboard/club/ajustes", mixedItems)).toBe(1);
  });

  it("prioriza el prefijo mas especifico cuando hay dos prefijos validos", () => {
    const mixedItems: MobileBottomNavItem[] = [
      {
        href: "/dashboard/alumno",
        label: "Alumno",
        match: ["/dashboard/alumno*"],
      },
      {
        href: "/dashboard/alumno/turnos",
        label: "Turnos",
        match: ["/dashboard/alumno/turnos*"],
      },
    ];

    expect(resolveActiveBottomNavIndex("/dashboard/alumno/turnos?tab=mis-clases", mixedItems)).toBe(1);
  });

  it("devuelve -1 cuando no hay coincidencias", () => {
    expect(resolveActiveBottomNavIndex("/dashboard/admin", items)).toBe(-1);
  });
});
