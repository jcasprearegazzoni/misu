import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { approveLeadAction, rejectLeadAction } from "./leads-actions";

type ClubLeadRow = {
  id: number;
  nombre: string;
  direccion: string | null;
  cuit: string;
  email: string;
  telefono: string;
  mensaje: string | null;
  status: "pendiente" | "aprobado" | "rechazado";
  created_at: string;
  reviewed_at: string | null;
};

async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (!profile || profile.role !== "admin") redirect("/admin/login");
  return user;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function StatusBadge({ status }: { status: ClubLeadRow["status"] }) {
  if (status === "aprobado") {
    return (
      <span
        className="pill"
        style={{
          background: "var(--success-bg)",
          color: "var(--success)",
          border: "1px solid var(--success-border)",
        }}
      >
        Aprobado
      </span>
    );
  }

  if (status === "rechazado") {
    return (
      <span
        className="pill"
        style={{
          background: "var(--error-bg)",
          color: "var(--error)",
          border: "1px solid var(--error-border)",
        }}
      >
        Rechazado
      </span>
    );
  }

  return (
    <span
      className="pill"
      style={{
        background: "var(--warning-bg)",
        color: "var(--warning)",
        border: "1px solid var(--warning-border)",
      }}
    >
      Pendiente
    </span>
  );
}

export default async function AdminLeadsPage() {
  await requireAdmin();

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("club_leads")
    .select("*")
    .order("created_at", { ascending: false });

  const leads = (data ?? []) as ClubLeadRow[];

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6" style={{ background: "var(--background)" }}>
      <section className="mx-auto max-w-6xl">
        <div className="card p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold sm:text-2xl" style={{ color: "var(--foreground)" }}>
                Leads de clubes
              </h1>
              <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
                Revisá solicitudes pendientes y enviá invitaciones a los clubes aprobados.
              </p>
            </div>
            <span className="text-xs" style={{ color: "var(--muted-2)" }}>
              {leads.length} {leads.length === 1 ? "solicitud" : "solicitudes"}
            </span>
          </div>

          {error ? <p className="alert-error mt-4">No se pudieron cargar los leads.</p> : null}

          {!error && leads.length === 0 ? (
            <div className="alert-success mt-4">No hay solicitudes de clubes por revisar.</div>
          ) : null}

          {!error && leads.length > 0 ? (
            <div className="mt-4">
              <div className="grid gap-3 md:hidden">
                {leads.map((lead) => (
                  <article
                    key={lead.id}
                    className="rounded-xl border p-4"
                    style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                          {lead.nombre}
                        </h2>
                        <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>
                          {lead.direccion?.trim() ? lead.direccion : "Sin dirección"}
                        </p>
                      </div>
                      <StatusBadge status={lead.status} />
                    </div>

                    <div className="mt-4 grid gap-3 text-sm">
                      <div>
                        <p className="text-[11px] uppercase tracking-wide" style={{ color: "var(--muted-2)" }}>
                          CUIT
                        </p>
                        <p style={{ color: "var(--foreground)" }}>{lead.cuit}</p>
                      </div>
                      <div>
                        <p className="text-[11px] uppercase tracking-wide" style={{ color: "var(--muted-2)" }}>
                          Email
                        </p>
                        <p style={{ color: "var(--foreground)" }}>{lead.email}</p>
                      </div>
                      <div>
                        <p className="text-[11px] uppercase tracking-wide" style={{ color: "var(--muted-2)" }}>
                          Teléfono
                        </p>
                        <p style={{ color: "var(--foreground)" }}>{lead.telefono}</p>
                      </div>
                      <div>
                        <p className="text-[11px] uppercase tracking-wide" style={{ color: "var(--muted-2)" }}>
                          Mensaje
                        </p>
                        <p style={{ color: "var(--muted)" }}>
                          {lead.mensaje?.trim() ? lead.mensaje : "Sin mensaje"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] uppercase tracking-wide" style={{ color: "var(--muted-2)" }}>
                          Fecha
                        </p>
                        <p style={{ color: "var(--foreground)" }}>{formatDate(lead.created_at)}</p>
                      </div>
                    </div>

                    <div className="mt-4">
                      {lead.status === "pendiente" ? (
                        <div className="flex flex-wrap gap-2">
                          <form action={approveLeadAction} className="flex-1">
                            <input type="hidden" name="lead_id" value={lead.id} />
                            <button type="submit" className="btn-primary w-full justify-center text-sm">
                              Aprobar
                            </button>
                          </form>
                          <form action={rejectLeadAction} className="flex-1">
                            <input type="hidden" name="lead_id" value={lead.id} />
                            <button
                              type="submit"
                              className="btn-ghost w-full justify-center text-sm"
                              style={{ color: "var(--error)" }}
                            >
                              Rechazar
                            </button>
                          </form>
                        </div>
                      ) : (
                        <span className="text-xs" style={{ color: "var(--muted-2)" }}>
                          Sin acciones disponibles
                        </span>
                      )}
                    </div>
                  </article>
                ))}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <table className="table-dark min-w-[980px]">
                  <thead>
                    <tr>
                      <th>Nombre club</th>
                      <th>CUIT</th>
                      <th>Email</th>
                      <th>Teléfono</th>
                      <th>Mensaje</th>
                      <th>Fecha</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((lead) => (
                      <tr key={lead.id}>
                        <td>
                          <div className="font-medium">{lead.nombre}</div>
                          <div className="text-xs" style={{ color: "var(--muted)" }}>
                            {lead.direccion?.trim() ? lead.direccion : "Sin dirección"}
                          </div>
                        </td>
                        <td>{lead.cuit}</td>
                        <td>{lead.email}</td>
                        <td>{lead.telefono}</td>
                        <td style={{ maxWidth: "220px" }}>
                          <div className="text-sm" style={{ color: "var(--muted)" }}>
                            {lead.mensaje?.trim() ? lead.mensaje : "Sin mensaje"}
                          </div>
                        </td>
                        <td>{formatDate(lead.created_at)}</td>
                        <td>
                          <StatusBadge status={lead.status} />
                        </td>
                        <td>
                          {lead.status === "pendiente" ? (
                            <div className="flex flex-wrap gap-2">
                              <form action={approveLeadAction}>
                                <input type="hidden" name="lead_id" value={lead.id} />
                                <button type="submit" className="btn-primary text-sm">
                                  Aprobar
                                </button>
                              </form>
                              <form action={rejectLeadAction}>
                                <input type="hidden" name="lead_id" value={lead.id} />
                                <button
                                  type="submit"
                                  className="btn-ghost text-sm"
                                  style={{ color: "var(--error)" }}
                                >
                                  Rechazar
                                </button>
                              </form>
                            </div>
                          ) : (
                            <span className="text-xs" style={{ color: "var(--muted-2)" }}>
                              Sin acciones disponibles
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
