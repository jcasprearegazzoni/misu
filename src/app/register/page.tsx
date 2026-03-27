import { RegisterForm } from "./register-form";

export default function RegisterPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Registro</h1>
      <p className="mt-2 text-sm text-zinc-600">Crea tu cuenta y elige tu rol.</p>

      <RegisterForm />
    </main>
  );
}
