import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("guides")
    .select("*")
    .order("name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = createAdminClient();
  const { name, email } = await request.json();

  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email,
    password: "tour26",
    email_confirm: true,
  });

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("guides")
    .insert({ name, email, auth_user_id: authUser.user.id })
    .select()
    .single();

  if (error) {
    // Auth 사용자도 롤백
    await supabase.auth.admin.deleteUser(authUser.user.id);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest) {
  const supabase = createAdminClient();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID가 필요합니다." }, { status: 400 });
  }

  // Auth 사용자도 삭제
  const { data: guide } = await supabase
    .from("guides")
    .select("auth_user_id")
    .eq("id", id)
    .single();

  // 관련 availability 먼저 삭제
  await supabase.from("guide_availability").delete().eq("guide_id", id);

  // schedules에서 confirmed_guide_id가 이 인솔자인 경우 null로 변경
  await supabase
    .from("schedules")
    .update({ confirmed_guide_id: null })
    .eq("confirmed_guide_id", id);

  const { error } = await supabase.from("guides").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (guide?.auth_user_id) {
    const { error: authErr } = await supabase.auth.admin.deleteUser(guide.auth_user_id);
    if (authErr) {
      console.error("Auth user delete failed:", authErr);
    }
  }

  return NextResponse.json({ success: true });
}
