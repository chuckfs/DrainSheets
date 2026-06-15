import { type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/middleware";

const PUBLIC_ROUTES = ["/login", "/forgot-password", "/auth/callback", "/api/health"];

function isPublicRoute(pathname: string) {
  return PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export async function middleware(request: NextRequest) {
  const { supabase, response } = createClient(request);
  const pathname = request.nextUrl.pathname;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !isPublicRoute(pathname)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return Response.redirect(loginUrl);
  }

  if (user && (pathname === "/login" || pathname === "/forgot-password")) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/";
    return Response.redirect(dashboardUrl);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
