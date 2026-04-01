import Link from "next/link";
import { RegisterForm } from "./register-form";

export default function RegisterPage() {
  return (
    <main
      className="flex min-h-screen w-full"
      style={{ background: "var(--background)" }}
    >
      {/* Panel izquierdo decorativo (solo desktop) */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12"
        style={{
          background: "linear-gradient(145deg, var(--surface-1) 0%, var(--surface-2) 100%)",
          borderRight: "1px solid var(--border)",
        }}
      >
        <Link href="/">
          <span
            className="text-2xl font-black tracking-tighter logo-glow"
            style={{ color: "var(--misu)" }}
          >
            misu
          </span>
        </Link>

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
          <h2
            className="text-2xl font-bold leading-snug tracking-tight"
            style={{ color: "var(--foreground)" }}
          >
            Primer mes{" "}
            <span style={{ color: "var(--misu)" }}>completamente gratis.</span>
          </h2>
          <p className="mt-4 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
            Creá tu cuenta en menos de un minuto y empezá a organizar tus clases
            al instante. Sin tarjeta de crédito requerida.
          </p>

          <ul className="mt-7 grid gap-3">
            {[
              "Agenda semanal automática",
              "Reservas desde el celular",
              "Cobros y paquetes integrados",
              "Notificaciones sin hacer nada",
            ].map((item) => (
              <li
                key={item}
                className="flex items-center gap-2.5 text-sm"
                style={{ color: "var(--muted)" }}
              >
                <span
                  style={{
                    width: "18px",
                    height: "18px",
                    borderRadius: "50%",
                    background: "var(--misu-subtle)",
                    border: "1px solid var(--border-misu)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "10px",
                    color: "var(--misu)",
                    flexShrink: 0,
                  }}
                >
                  ✓
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs" style={{ color: "var(--muted-2)" }}>
          misu · Tenis & Pádel · Argentina
        </p>
      </div>

      {/* Panel derecho — formulario */}
      <div className="flex w-full flex-col justify-center px-6 py-10 lg:w-1/2 lg:px-16 xl:px-24">
        {/* Logo mobile */}
        <Link href="/" className="mb-8 lg:hidden">
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
            Crear cuenta
          </h1>
          <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
            Elegí tu rol y completá tus datos.
          </p>

          <RegisterForm />

          <div
            className="mt-6 pt-6"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              ¿Ya tenés cuenta?{" "}
              <Link href="/login" className="text-link font-semibold">
                Iniciar sesión
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
