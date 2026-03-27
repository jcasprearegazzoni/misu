import { redirect } from "next/navigation";

export default async function AlumnoProfesorSlotsLegacyRedirectPage({
  params,
}: {
  params: Promise<{ profesorId: string }>;
}) {
  const { profesorId } = await params;
  redirect(`/alumno/profesores/${profesorId}/slots`);
}
