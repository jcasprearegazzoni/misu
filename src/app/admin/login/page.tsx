import Link from "next/link";
import { AdminLoginForm } from "./login-form";

export default function AdminLoginPage() {
  return (
    <main
      className="flex min-h-screen w-full items-center justify-center px-6 py-10"
      style={{ background: "var(--background)" }}
    >
      <div className="card w-full max-w-sm p-6 sm:p-8">
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
          Acceso administrativo
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
          Ingresá con tu cuenta de administrador.
        </p>

        <AdminLoginForm />
      </div>
    </main>
  );
}
