import { describe, expect, it } from "vitest";
import { getSafeInternalRedirectPath } from "./safe-redirect";

describe("getSafeInternalRedirectPath", () => {
  it("acepta rutas internas simples", () => {
    expect(getSafeInternalRedirectPath("/p/profe-juan")).toBe("/p/profe-juan");
    expect(getSafeInternalRedirectPath("/login?redirectTo=%2Fp%2Fprofe-juan")).toBe(
      "/login?redirectTo=%2Fp%2Fprofe-juan",
    );
  });

  it("rechaza valores vacios o nulos", () => {
    expect(getSafeInternalRedirectPath("")).toBeNull();
    expect(getSafeInternalRedirectPath("   ")).toBeNull();
    expect(getSafeInternalRedirectPath(null)).toBeNull();
    expect(getSafeInternalRedirectPath(undefined)).toBeNull();
  });

  it("rechaza rutas peligrosas", () => {
    expect(getSafeInternalRedirectPath("https://evil.com")).toBeNull();
    expect(getSafeInternalRedirectPath("http://evil.com")).toBeNull();
    expect(getSafeInternalRedirectPath("//evil.com")).toBeNull();
    expect(getSafeInternalRedirectPath("javascript:alert(1)")).toBeNull();
    expect(getSafeInternalRedirectPath("p/profe-juan")).toBeNull();
  });
});
