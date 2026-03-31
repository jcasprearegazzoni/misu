import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { getSafeInternalRedirectPath } from "@/lib/navigation/safe-redirect";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function buildRedirectUrl(requestUrl: string, path: string) {
  return new URL(path, requestUrl);
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const safeNext = getSafeInternalRedirectPath(requestUrl.searchParams.get("next")) ?? "/login";
  const supabase = await createSupabaseServerClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(buildRedirectUrl(request.url, "/login?verified=0"));
    }
    return NextResponse.redirect(buildRedirectUrl(request.url, safeNext));
  }

  if (tokenHash && type) {
    const otpType = type as EmailOtpType;
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: otpType,
    });

    if (error) {
      return NextResponse.redirect(buildRedirectUrl(request.url, "/login?verified=0"));
    }

    return NextResponse.redirect(buildRedirectUrl(request.url, safeNext));
  }

  return NextResponse.redirect(buildRedirectUrl(request.url, "/login"));
}
