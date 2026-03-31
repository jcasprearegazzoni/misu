import Link from "next/link";
import { notFound } from "next/navigation";
import { WeekCalendarStrip } from "@/components/calendar/week-calendar-strip";
import { AppNavbar } from "@/components/app-navbar";
import { ReserveSlotForm } from "@/app/alumno/profesores/[profesorId]/slots/reserve-slot-form";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getProfesorSlotsByWeek, parseWeekOffset } from "@/lib/turnos/get-profesor-slots";
import { BuyPackageForm } from "./buy-package-form";

type PublicProfesorRow = {
  user_id: string;
  username: string;
  name: string;
  bio: string | null;
  sport: "tenis" | "padel" | "ambos" | null;
};

type PackageRow = {
  id: number;
  name: string;
  total_classes: number;
  price: number;
  description: string | null;
};

type PageProps = {
  params: Promise<{ username: string }>;
  searchParams?: Promise<{ weekOffset?: string; day?: string }>;
};

function getSportLabel(sport: PublicProfesorRow["sport"]) {
  if (sport === "tenis") {
    return "Tenis";
  }
  if (sport === "padel") {
    return "Padel";
  }
  if (sport === "ambos") {
    return "Tenis y padel";
  }
  return "No definido";
}

export default async function PublicProfesorPage({ params, searchParams }: PageProps) {
  const { username } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const weekOffset = parseWeekOffset(resolvedSearchParams?.weekOffset);
  const supabase = await createSupabaseServerClient();

  const { data: profesorData, error: profesorError } = await supabase.rpc("get_public_profesor_by_username", {
    p_username: username,
  });

  if (profesorError) {
    notFound();
  }

  const profesor = ((profesorData ?? [])[0] ?? null) as PublicProfesorRow | null;
  if (!profesor) {
    notFound();
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userRole: "alumno" | "profesor" | null = null;
  if (user) {
    const { data: roleData } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .single();
    if (roleData?.role === "alumno" || roleData?.role === "profesor") {
      userRole = roleData.role;
    }
  }

  // Paquetes activos del profesor (visibles para todos los autenticados por RLS).
  const { data: packagesData } = user
    ? await supabase
        .from("packages")
        .select("id, name, total_classes, price, description")
        .eq("profesor_id", profesor.user_id)
        .eq("active", true)
        .order("price", { ascending: true })
    : { data: [] };

  const activePackages = (packagesData ?? []) as PackageRow[];

  const slotsData = await getProfesorSlotsByWeek({
    supabase,
    profesorId: profesor.user_id,
    weekOffset,
    selectedDayParam: resolvedSearchParams?.day,
  });

  const loginHref = `/login?redirectTo=${encodeURIComponent(`/p/${profesor.username}`)}`;

  return (
    <>
      <AppNavbar />
      <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-8 sm:px-6 sm:py-10">
      <section className="rounded-xl border border-zinc-300 bg-white p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Perfil publico</p>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-900">{profesor.name}</h1>
        <p className="mt-2 text-sm text-zinc-700">Deporte: {getSportLabel(profesor.sport)}</p>
        <p className="mt-1 text-sm text-zinc-600">{profesor.bio?.trim() || "Profesor de clases personalizadas."}</p>
      </section>

      {activePackages.length > 0 ? (
        <section className="mt-4 rounded-xl border border-zinc-300 bg-white p-4">
          <p className="text-sm font-semibold text-zinc-900">Paquetes de clases</p>
          <p className="mt-1 text-xs text-zinc-500">
            Solicitá un paquete y coordiná el pago con el profesor para activar tus créditos.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {activePackages.map((pkg) =>
              userRole === "alumno" ? (
                <div key={pkg.id} className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                  {pkg.description ? (
                    <p className="mb-2 text-xs text-zinc-500">{pkg.description}</p>
                  ) : null}
                  <BuyPackageForm
                    packageId={pkg.id}
                    profesorId={profesor.user_id}
                    packageName={pkg.name}
                    totalClasses={pkg.total_classes}
                    price={Number(pkg.price)}
                  />
                </div>
              ) : (
                <div key={pkg.id} className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                  <p className="text-sm font-semibold text-zinc-900">{pkg.name}</p>
                  <p className="text-xs text-zinc-600">
                    {pkg.total_classes} clases ·{" "}
                    {new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(Number(pkg.price))}
                  </p>
                  {pkg.description ? <p className="mt-1 text-xs text-zinc-500">{pkg.description}</p> : null}
                  {!user ? (
                    <Link
                      href={loginHref}
                      className="mt-2 inline-flex rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white"
                    >
                      Inicia sesión para solicitar
                    </Link>
                  ) : (
                    <p className="mt-2 text-xs text-zinc-500">Usá una cuenta de alumno para solicitar.</p>
                  )}
                </div>
              )
            )}
          </div>
        </section>
      ) : null}

      <WeekCalendarStrip
        weekDates={slotsData.weekDates}
        selectedDay={slotsData.selectedDay}
        tone="booking"
        subtitle="Semana disponible"
        prevHref={`/p/${profesor.username}?weekOffset=${Math.max(0, slotsData.weekOffset - 1)}&day=${slotsData.selectedDay}`}
        nextHref={`/p/${profesor.username}?weekOffset=${slotsData.weekOffset + 1}&day=${slotsData.selectedDay}`}
        dayHrefBuilder={(date) => `/p/${profesor.username}?weekOffset=${slotsData.weekOffset}&day=${date}`}
        resetHref={slotsData.weekOffset !== 0 ? `/p/${profesor.username}?weekOffset=0&day=${slotsData.todayIso}` : undefined}
      />

      {!slotsData.selectedGroup || slotsData.selectedGroup.items.length === 0 ? (
        <p className="mt-6 rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-700">
          No hay clases disponibles para este dia.
        </p>
      ) : (
        <section className="mt-6 rounded-xl border border-zinc-300 bg-white px-4 py-3">
          <p className="text-sm font-semibold text-zinc-900">{slotsData.selectedGroup.label}</p>
          <div className="mt-3 grid gap-2">
            {slotsData.selectedGroup.items.map((item) => (
              <div key={item.slotKey} className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">{item.timeLabel}</p>
                    <p className="mt-1 text-xs text-zinc-600">{item.slotInfoLabel}</p>
                  </div>

                  <div className="min-w-40">
                    {!user ? (
                      <Link
                        href={loginHref}
                        className="inline-flex w-full items-center justify-center rounded-md bg-zinc-900 px-3 py-2 text-xs font-medium text-white"
                      >
                        Inicia sesion para reservar
                      </Link>
                    ) : userRole === "alumno" ? (
                      <ReserveSlotForm
                        profesorId={profesor.user_id}
                        date={item.date}
                        startTime={item.startTime}
                        endTime={item.endTime}
                        fixedType={item.fixedType}
                      />
                    ) : (
                      <p className="rounded-md border border-zinc-300 bg-zinc-100 px-3 py-2 text-xs text-zinc-700">
                        Estas logueado como profesor. Para reservar, usa una cuenta alumno.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
      </main>
    </>
  );
}
