import { describe, expect, it } from "vitest";
import {
  actualizarEstadoReservaCancha,
  parseEstadoReservaEditable,
  parseReservaId,
  type EstadoReservaEditable,
} from "./reserva-estado";

function createSupabaseMock(error: { message: string } | null) {
  return {
    from() {
      return {
        update(values: { estado: EstadoReservaEditable }) {
          return {
            eq(_idColumn: "id", reservaId: number) {
              return {
                eq(_clubColumn: "club_id", clubId: number) {
                  void values;
                  void reservaId;
                  void clubId;
                  return Promise.resolve({ error });
                },
              };
            },
          };
        },
      };
    },
  };
}

describe("parseEstadoReservaEditable", () => {
  it("acepta estados editables validos", () => {
    expect(parseEstadoReservaEditable("confirmada")).toBe("confirmada");
    expect(parseEstadoReservaEditable("cancelada")).toBe("cancelada");
  });

  it("rechaza estados no editables", () => {
    expect(parseEstadoReservaEditable("pendiente")).toBeNull();
    expect(parseEstadoReservaEditable("x")).toBeNull();
  });
});

describe("parseReservaId", () => {
  it("acepta ids enteros positivos", () => {
    expect(parseReservaId("12")).toBe(12);
    expect(parseReservaId(3)).toBe(3);
  });

  it("rechaza ids invalidos", () => {
    expect(parseReservaId("")).toBeNull();
    expect(parseReservaId("hola")).toBeNull();
    expect(parseReservaId(-1)).toBeNull();
    expect(parseReservaId(0)).toBeNull();
    expect(parseReservaId(2.5)).toBeNull();
  });
});

describe("actualizarEstadoReservaCancha", () => {
  it("devuelve ok=true cuando la actualizacion no falla", async () => {
    const supabase = createSupabaseMock(null);
    const result = await actualizarEstadoReservaCancha({
      supabase,
      clubId: 10,
      reservaId: 20,
      estado: "confirmada",
    });

    expect(result).toEqual({ ok: true });
  });

  it("devuelve error de db cuando supabase falla", async () => {
    const supabase = createSupabaseMock({ message: "fallo db" });
    const result = await actualizarEstadoReservaCancha({
      supabase,
      clubId: 10,
      reservaId: 20,
      estado: "cancelada",
    });

    expect(result).toEqual({ ok: false, reason: "db_error" });
  });
});

