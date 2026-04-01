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
      className="flex min-h-screen w-full"
      style={{ background: "var(--background)" }}
    >
      {/* Panel izquierdo decorativo (oculto en mobile) */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12"
        style={{
          background: "linear-gradient(145deg, var(--surface-1) 0%, var(--surface-2) 100%)",
          borderRight: "1px solid var(--border)",
        }}
      >
        {/* Logo */}
        <Link href="/">
          <span
            className="text-2xl font-black tracking-tighter logo-glow"
            style={{ color: "var(--misu)" }}
          >
            misu
          </span>
        </Link>

        {/* Quote */}
        <div>
          <div
            aria-hidden
            style={{
              width: "48px",
              height: "3px",
              borderRadius: "2px",
              background: "var(--misu)",
              marginBottom: "20px",
            }}
          />
          <blockquote
            className="text-2xl font-bold leading-snug tracking-tight"
            style={{ color: "var(--foreground)" }}
          >
            "Tu agenda,
            <br />
            <span style={{ color: "var(--misu)" }}>sin el caos."</span>
          </blockquote>
          <p className="mt-4 text-sm" style={{ color: "var(--muted)" }}>
            Gestioná clases, reservas y cobros desde cualquier dispositivo.
          </p>
        </div>

        {/* Footer info */}
        <p className="text-xs" style={{ color: "var(--muted-2)" }}>
          misu · Tenis & Pádel · Argentina
        </p>
      </div>

      {/* Panel derecho — formulario */}
      <div className="flex w-full flex-col justify-center px-6 py-10 lg:w-1/2 lg:px-16 xl:px-24">
        {/* Logo mobile */}
        <Link
          href="/"
          className="mb-8 lg:hidden"
        >
          <span
            className="text-xl font-black tracking-tighter logo-glow"
            style={{ color: "var(--misu)" }}
          >
            misu
          </span>
        </Link>

        <div className="mx-auto w-full max-w-sm">
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
                Registrate gratis
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
