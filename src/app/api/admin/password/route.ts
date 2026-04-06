import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

export async function PUT(request: NextRequest) {
  const supabase = createAdminClient();
  const { current_password, new_password } = await request.json();

  if (!new_password || new_password.length < 4) {
    return NextResponse.json({ error: "새 비밀번호는 4자 이상이어야 합니다." }, { status: 400 });
  }

  // 현재 비밀번호 확인 (DB 먼저, 없으면 환경변수)
  const { data: setting } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "admin_password")
    .single();

  const currentPassword = setting?.value || process.env.ADMIN_PASSWORD;

  if (current_password !== currentPassword) {
    return NextResponse.json({ error: "현재 비밀번호가 틀렸습니다." }, { status: 401 });
  }

  // 새 비밀번호 저장
  const { error } = await supabase
    .from("settings")
    .upsert({ key: "admin_password", value: new_password }, { onConflict: "key" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
