import Link from "next/link";
import { AppNavbar } from "@/components/app-navbar";
import { UnirseForm } from "./unirse-form";

export default function UnirsePage() {
  return (
    <>
      <AppNavbar />
      <main className="min-h-screen" style={{ background: "var(--background)" }}>
        <section className="mx-auto flex w-full max-w-3xl flex-col px-4 py-8 sm:px-6 sm:py-10">
          <Link href="/" className="btn-ghost mb-4 w-fit text-sm" style={{ color: "var(--muted)" }}>
            ← Volver
          </Link>
          <div className="rounded-2xl border p-6 sm:p-8" style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}>
            <div className="max-w-2xl">
              <p className="pill" style={{ background: "var(--misu-subtle)", border: "1px solid var(--border-misu)", color: "var(--misu-light)" }}>
                Clubes
              </p>
              <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl" style={{ color: "var(--foreground)" }}>
                Sumá tu club a misu
              </h1>
            </div>

            <div className="mt-6">
              <UnirseForm />
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
