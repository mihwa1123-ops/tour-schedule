import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

export async function PUT(request: NextRequest) {
  const supabase = createAdminClient();
  const { guide_id, guide_ids, new_password } = await request.json();

  if (!new_password || new_password.length < 4) {
    return NextResponse.json({ error: "비밀번호는 4자 이상이어야 합니다." }, { status: 400 });
  }

  // 일괄 변경 (guide_ids) 또는 개별 변경 (guide_id)
  const ids = guide_ids || [guide_id];

  const { data: guides } = await supabase
    .from("guides")
    .select("id, auth_user_id")
    .in("id", ids);

  if (!guides || guides.length === 0) {
    return NextResponse.json({ error: "인솔자를 찾을 수 없습니다." }, { status: 404 });
  }

  const errors: string[] = [];
  for (const guide of guides) {
    if (!guide.auth_user_id) continue;
    const { error } = await supabase.auth.admin.updateUserById(guide.auth_user_id, {
      password: new_password,
    });
    if (error) errors.push(`${guide.id}: ${error.message}`);
  }

  if (errors.length > 0) {
    return NextResponse.json({ error: `일부 변경 실패: ${errors.join(", ")}` }, { status: 500 });
  }

  return NextResponse.json({ success: true, count: guides.length });
}
