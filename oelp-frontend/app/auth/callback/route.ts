import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");
  const error_description = requestUrl.searchParams.get("error_description");
  const next = requestUrl.searchParams.get("next") ?? "/";

  if (error) {
    return NextResponse.redirect(`${requestUrl.origin}/login?error=${encodeURIComponent(error_description || error)}`);
  }

  if (code) {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) {
      console.error("OAuth code exchange failed:", exchangeError.message);
      const message = /rate limit/i.test(exchangeError.message)
        ? "Too many sign-in attempts. Please wait a few minutes, then try again."
        : "Sign-in could not be completed. Please try again.";
      return NextResponse.redirect(
        `${requestUrl.origin}/login?error=${encodeURIComponent(message)}`
      );
    }
  }

  return NextResponse.redirect(`${requestUrl.origin}${next}`);
}
