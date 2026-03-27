import { describe, expect, it } from "vitest";
import { requiredStringSchema } from "./required-string.schema";

describe("requiredStringSchema", () => {
  it("acepta texto valido", () => {
    const result = requiredStringSchema.safeParse("Profesor");
    expect(result.success).toBe(true);
  });

  it("rechaza string vacio o solo espacios", () => {
    const result = requiredStringSchema.safeParse("   ");
    expect(result.success).toBe(false);
  });
});
