import { redirect } from "next/navigation";

type PerfilProfesorPageProps = {
  searchParams?: Promise<{ updated?: string }>;
};

export default async function PerfilProfesorPage({ searchParams }: PerfilProfesorPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const updated = resolvedSearchParams?.updated;

  if (updated) {
    redirect(`/dashboard/profesor/ajustes?updated=${updated}`);
  }

  redirect("/dashboard/profesor/ajustes");
}
