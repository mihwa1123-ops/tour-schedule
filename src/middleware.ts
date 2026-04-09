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

  // 인솔자 페이지(/schedule) 는 클라이언트 사이드에서 localStorage 기반
  // Supabase 세션으로 보호하기 때문에 미들웨어에서는 체크하지 않는다.
  // (@supabase/supabase-js 의 기본 스토리지는 localStorage 이므로 쿠키가 없다)

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
