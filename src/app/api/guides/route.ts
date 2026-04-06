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

  if (guide?.auth_user_id) {
    await supabase.auth.admin.deleteUser(guide.auth_user_id);
  }

  const { error } = await supabase.from("guides").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
