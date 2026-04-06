import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 관리자 페이지 보호
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const adminSession = request.cookies.get("admin_session");
    if (!adminSession || adminSession.value !== "authenticated") {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  // 인솔자 페이지 보호 - Supabase Auth 쿠키 확인
  if (pathname.startsWith("/schedule")) {
    const supabaseAuth = request.cookies.get("sb-access-token") ||
      request.cookies.getAll().find(c => c.name.includes("auth-token"));
    if (!supabaseAuth) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/schedule/:path*"],
};
