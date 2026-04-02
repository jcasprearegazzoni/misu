import Link from "next/link";
import { LoginForm } from "./login-form";

type LoginPageProps = {
  searchParams?: Promise<{ redirectTo?: string; verified?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const redirectTo = resolvedSearchParams?.redirectTo ?? null;
  const verifiedStatus = resolvedSearchParams?.verified ?? null;

  return (
    <main
      className="flex min-h-screen w-full items-center justify-center px-6 py-10"
      style={{ background: "var(--background)" }}
    >
      <div className="w-full max-w-sm">
        {/* Logo */}
        <Link href="/" className="mb-8 block">
          <span
            className="text-xl font-black tracking-tighter logo-glow"
            style={{ color: "var(--misu)" }}
          >
            misu
          </span>
        </Link>

        <h1
          className="text-2xl font-black tracking-tight"
          style={{ color: "var(--foreground)" }}
        >
          Bienvenido de vuelta
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
          Ingresá con tu email y contraseña.
        </p>

        {verifiedStatus === "1" ? (
          <div className="alert-success mt-5">
            ✓ Email confirmado correctamente. Ya podés iniciar sesión.
          </div>
        ) : null}

        {verifiedStatus === "0" ? (
          <div className="alert-error mt-5">
            No se pudo confirmar el email. Intentá nuevamente desde el enlace recibido.
          </div>
        ) : null}

        <LoginForm redirectTo={redirectTo} />

        <p className="mt-5 text-sm" style={{ color: "var(--muted)" }}>
          <Link href="/reset-password" className="text-link font-medium">
            ¿Olvidaste tu contraseña?
          </Link>
        </p>

        <div
          className="mt-6 pt-6"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            ¿No tenés cuenta?{" "}
            <Link href="/register" className="text-link font-semibold">
              Registrate
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
