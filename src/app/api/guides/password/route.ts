import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

export async function PUT(request: NextRequest) {
  const supabase = createAdminClient();
  const { guide_id, new_password } = await request.json();

  if (!new_password || new_password.length < 4) {
    return NextResponse.json({ error: "비밀번호는 4자 이상이어야 합니다." }, { status: 400 });
  }

  // 인솔자의 auth_user_id 조회
  const { data: guide } = await supabase
    .from("guides")
    .select("auth_user_id")
    .eq("id", guide_id)
    .single();

  if (!guide?.auth_user_id) {
    return NextResponse.json({ error: "인솔자를 찾을 수 없습니다." }, { status: 404 });
  }

  // Supabase Auth 비밀번호 변경
  const { error } = await supabase.auth.admin.updateUserById(guide.auth_user_id, {
    password: new_password,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
