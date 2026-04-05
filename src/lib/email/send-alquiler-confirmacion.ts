import { resend } from "./resend";

type AlquilerConfirmacionParams = {
  to: string;
  nombre: string;
  clubNombre: string;
  canchaNombre: string | null;
  deporte: string;
  fecha: string;
  horaInicio: string;
  duracionMinutos: number;
  estado: "confirmada" | "pendiente";
  clubTelefono: string | null;
  clubEmailContacto: string | null;
};

function formatDeporte(deporte: string) {
  if (deporte === "padel") return "Pádel";
  if (deporte === "tenis") return "Tenis";
  return deporte.charAt(0).toUpperCase() + deporte.slice(1);
}

function formatDuracion(minutos: number) {
  if (minutos < 60) return `${minutos} min`;
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  return resto > 0 ? `${horas}h ${resto}min` : `${horas}h`;
}

export async function sendAlquilerConfirmacionEmail(params: AlquilerConfirmacionParams) {
  const {
    to,
    nombre,
    clubNombre,
    canchaNombre,
    deporte,
    fecha,
    horaInicio,
    duracionMinutos,
    estado,
    clubTelefono,
    clubEmailContacto,
  } = params;

  const estadoLabel =
    estado === "confirmada"
      ? "✅ Confirmada"
      : "⏳ Pendiente de confirmación del club";

  const contactoLines: string[] = [];
  if (clubTelefono) contactoLines.push(`Teléfono: ${clubTelefono}`);
  if (clubEmailContacto) contactoLines.push(`Email: ${clubEmailContacto}`);
  const contactoSection =
    contactoLines.length > 0
      ? `<p style="color:#9ca3af;font-size:14px;margin:0 0 4px 0;">Contacto del club:</p>
         <p style="color:#e5e7eb;font-size:14px;margin:0;">${contactoLines.join(" · ")}</p>`
      : "";

  const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>Confirmación de alquiler</title></head>
<body style="background:#0c0c0e;color:#e5e7eb;font-family:system-ui,sans-serif;margin:0;padding:32px 16px;">
  <div style="max-width:480px;margin:0 auto;background:#1a1a1f;border-radius:16px;border:1px solid #2a2a32;overflow:hidden;">
    <div style="padding:24px 24px 16px 24px;border-bottom:1px solid #2a2a32;">
      <p style="font-size:22px;font-weight:900;color:#a78bfa;margin:0;letter-spacing:-0.5px;">misu</p>
    </div>
    <div style="padding:24px;">
      <p style="font-size:18px;font-weight:700;color:#f9fafb;margin:0 0 4px 0;">Hola, ${nombre}</p>
      <p style="color:#9ca3af;font-size:14px;margin:0 0 24px 0;">Acá está el resumen de tu reserva en <strong style="color:#e5e7eb;">${clubNombre}</strong>.</p>

      <div style="background:#111116;border-radius:12px;border:1px solid #2a2a32;padding:16px;margin-bottom:20px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="color:#9ca3af;font-size:13px;padding:4px 0;">Deporte</td>
            <td style="color:#e5e7eb;font-size:14px;font-weight:600;padding:4px 0;text-align:right;">${formatDeporte(deporte)}</td>
          </tr>
          ${canchaNombre ? `<tr><td style="color:#9ca3af;font-size:13px;padding:4px 0;">Cancha</td><td style="color:#e5e7eb;font-size:14px;font-weight:600;padding:4px 0;text-align:right;">${canchaNombre}</td></tr>` : ""}
          <tr>
            <td style="color:#9ca3af;font-size:13px;padding:4px 0;">Fecha</td>
            <td style="color:#e5e7eb;font-size:14px;font-weight:600;padding:4px 0;text-align:right;">${fecha}</td>
          </tr>
          <tr>
            <td style="color:#9ca3af;font-size:13px;padding:4px 0;">Hora</td>
            <td style="color:#e5e7eb;font-size:14px;font-weight:600;padding:4px 0;text-align:right;">${horaInicio.slice(0, 5)}</td>
          </tr>
          <tr>
            <td style="color:#9ca3af;font-size:13px;padding:4px 0;">Duración</td>
            <td style="color:#e5e7eb;font-size:14px;font-weight:600;padding:4px 0;text-align:right;">${formatDuracion(duracionMinutos)}</td>
          </tr>
          <tr>
            <td style="color:#9ca3af;font-size:13px;padding:4px 0;">Estado</td>
            <td style="font-size:14px;font-weight:600;padding:4px 0;text-align:right;">${estadoLabel}</td>
          </tr>
        </table>
      </div>

      ${
        contactoLines.length > 0
          ? `<div style="background:#111116;border-radius:12px;border:1px solid #2a2a32;padding:16px;">
               ${contactoSection}
             </div>`
          : ""
      }

      <p style="color:#6b7280;font-size:12px;margin:24px 0 0 0;">Este email fue generado automáticamente por misu. Si tenés dudas, contactá al club directamente.</p>
    </div>
  </div>
</body>
</html>`;

  await resend.emails.send({
    from: "misu <noreply@misu.app>",
    to,
    subject: `Reserva en ${clubNombre} — ${fecha} ${horaInicio.slice(0, 5)}`,
    html,
  });
}
