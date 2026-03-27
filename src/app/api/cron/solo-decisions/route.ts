import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function getCronSecretFromHeader(request: Request) {
  const headerSecret = request.headers.get("x-cron-secret");

  if (headerSecret) {
    return headerSecret;
  }

  const authorization = request.headers.get("authorization");
  if (!authorization) {
    return null;
  }

  const [scheme, token] = authorization.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null;
  }

  return token;
}

export async function POST(request: Request) {
  const expectedSecret = process.env.CRON_SECRET;
  const providedSecret = getCronSecretFromHeader(request);

  if (!expectedSecret || providedSecret !== expectedSecret) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    return NextResponse.json(
      { error: "Faltan variables de entorno para ejecutar el cron." },
      { status: 500 },
    );
  }

  const supabase = createClient(url, serviceRoleKey);

  const { data: createdCount, error: createError } = await supabase.rpc(
    "create_pending_solo_decisions",
  );

  if (createError) {
    return NextResponse.json(
      { error: "Error al crear decisiones pendientes.", detail: createError.message },
      { status: 500 },
    );
  }

  const { data: resolvedCount, error: resolveError } = await supabase.rpc(
    "resolve_expired_solo_decisions",
  );

  if (resolveError) {
    return NextResponse.json(
      { error: "Error al resolver decisiones vencidas.", detail: resolveError.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    created_pending: createdCount ?? 0,
    resolved_timeouts: resolvedCount ?? 0,
  });
}
