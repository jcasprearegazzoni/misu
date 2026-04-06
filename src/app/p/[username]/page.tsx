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
  price_individual: number | string | null;
  price_dobles: number | string | null;
  price_trio: number | string | null;
  price_grupal: number | string | null;
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

const PRECIO_LABELS: Array<{
  key: keyof Pick<PublicProfesorRow, "price_individual" | "price_dobles" | "price_trio" | "price_grupal">;
  label: string;
}> = [
  { key: "price_individual", label: "Individual" },
  { key: "price_dobles", label: "Dobles" },
  { key: "price_trio", label: "Trío" },
  { key: "price_grupal", label: "Grupal" },
];

function normalizePrice(value: unknown) {
  if (value === null || value === undefined) {
    return null;
  }

  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function getSportLabel(sport: PublicProfesorRow["sport"]) {
  if (sport === "tenis") {
    return "Tenis";
  }
  if (sport === "padel") {
    return "Pádel";
  }
  if (sport === "ambos") {
    return "Tenis y pádel";
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
  const preciosNormalizados = {
    price_individual: normalizePrice(profesor.price_individual),
    price_dobles: normalizePrice(profesor.price_dobles),
    price_trio: normalizePrice(profesor.price_trio),
    price_grupal: normalizePrice(profesor.price_grupal),
  };
  const preciosVisibles = PRECIO_LABELS.filter(({ key }) => preciosNormalizados[key] !== null);

  return (
    <>
      <AppNavbar />
      <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-8 sm:px-6 sm:py-10">
        <section
          className="rounded-xl border p-4"
          style={{ background: "var(--surface-1)", borderColor: "var(--border)" }}
        >
          <p
            className="text-xs font-medium uppercase tracking-wide"
            style={{ color: "var(--muted-2)" }}
          >
            Perfil público
          </p>
          <h1 className="mt-1 text-2xl font-semibold" style={{ color: "var(--foreground)" }}>
            {profesor.name}
          </h1>
          <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
            Deporte: {getSportLabel(profesor.sport)}
          </p>
          <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
            {profesor.bio?.trim() || "Profesor de clases personalizadas."}
          </p>
        </section>

        {preciosVisibles.length > 0 ? (
          <section
            className="mt-4 rounded-2xl border p-4"
            style={{ background: "var(--surface-1)", borderColor: "var(--border)" }}
          >
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--muted-2)" }}>
              Precios por clase
            </p>
            <div className="mt-3 grid gap-2">
              {preciosVisibles.map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between gap-3">
                  <span className="text-sm" style={{ color: "var(--muted)" }}>
                    {label}
                  </span>
                  <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                    $ {preciosNormalizados[key]!.toLocaleString("es-AR", { maximumFractionDigits: 0 })}
                  </span>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {activePackages.length > 0 ? (
          <section
            className="mt-4 rounded-xl border p-4"
            style={{ background: "var(--surface-1)", borderColor: "var(--border)" }}
          >
            <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
              Paquetes de clases
            </p>
            <p className="mt-1 text-xs" style={{ color: "var(--muted-2)" }}>
              Solicitá un paquete y coordiná el pago con el profesor para activar tus créditos.
            </p>
            <div className="mt-3 grid grid-cols-1 items-start gap-3 sm:grid-cols-2 md:grid-cols-3">
              {activePackages.map((pkg) =>
                userRole === "alumno" ? (
                  <div
                    key={pkg.id}
                    className="rounded-lg border p-3"
                    style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}
                  >
                    {pkg.description ? (
                      <p className="mb-2 text-xs" style={{ color: "var(--muted-2)" }}>
                        {pkg.description}
                      </p>
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
                  <div
                    key={pkg.id}
                    className="rounded-lg border p-3"
                    style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}
                  >
                    <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                      {pkg.name}
                    </p>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>
                      {pkg.total_classes} clases ·{" "}
                      {new Intl.NumberFormat("es-AR", {
                        style: "currency",
                        currency: "ARS",
                        maximumFractionDigits: 0,
                      }).format(Number(pkg.price))}
                    </p>
                    {pkg.description ? (
                      <p className="mt-1 text-xs" style={{ color: "var(--muted-2)" }}>
                        {pkg.description}
                      </p>
                    ) : null}
                    {!user ? (
                      <Link
                        href={loginHref}
                        className="mt-3 inline-flex w-full items-center justify-center rounded-lg px-3 py-2 text-xs font-semibold transition hover:opacity-90"
                        style={{ background: "var(--misu)", color: "#fff" }}
                      >
                        Solicitar
                      </Link>
                    ) : (
                      <p className="mt-2 text-xs" style={{ color: "var(--muted-2)" }}>
                        Usá una cuenta de alumno para solicitar.
                      </p>
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
          <p
            className="mt-6 rounded-lg border px-4 py-3 text-sm"
            style={{ background: "var(--surface-1)", borderColor: "var(--border)", color: "var(--muted)" }}
          >
            No hay clases disponibles para este día.
          </p>
        ) : (
          <section
            className="mt-6 rounded-xl border px-4 py-3"
            style={{ background: "var(--surface-1)", borderColor: "var(--border)" }}
          >
            <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
              {slotsData.selectedGroup.label}
            </p>
            <div className="mt-3 grid gap-2">
              {slotsData.selectedGroup.items.map((item) => (
                <div
                  key={item.slotKey}
                  className="rounded-md border px-3 py-3"
                  style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                        {item.timeLabel}
                      </p>
                      {item.clubNombre ? (
                        <p className="text-xs font-medium" style={{ color: "var(--muted)" }}>
                          {item.clubNombre}
                        </p>
                      ) : (
                        <p className="text-xs" style={{ color: "var(--muted-2)" }}>
                          Particulares
                        </p>
                      )}
                      <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>
                        {item.slotInfoLabel}
                      </p>
                    </div>

                    <div className="min-w-40">
                      {!user ? (
                        <Link
                          href={loginHref}
                          className="btn-primary inline-flex w-full items-center justify-center rounded-md px-3 py-2 text-xs font-medium"
                        >
                          Iniciá sesión para reservar
                        </Link>
                      ) : userRole === "alumno" ? (
                        <ReserveSlotForm
                          profesorId={profesor.user_id}
                          date={item.date}
                          startTime={item.startTime}
                          endTime={item.endTime}
                          fixedType={item.fixedType}
                          sport={profesor.sport === "ambos" ? null : (profesor.sport ?? null)}
                        />
                      ) : (
                        <p
                          className="rounded-md border px-3 py-2 text-xs"
                          style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--muted)" }}
                        >
                          Estás logueado como profesor. Para reservar, usá una cuenta de alumno.
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
