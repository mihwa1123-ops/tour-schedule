import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";

// 인솔자의 Supabase Auth 비밀번호를 안전하게 설정한다.
// 1) auth_user_id 로 업데이트 시도
// 2) 실패 시 email 로 createUser
// 3) email 중복이면 listUsers 로 찾아서 업데이트 + 링크 복구
async function setGuidePassword(
  supabase: SupabaseClient,
  guide: { id: string; email: string; auth_user_id: string | null },
  password: string
): Promise<string | null> {
  // 1. 기존 auth_user_id 로 업데이트
  if (guide.auth_user_id) {
    const { error } = await supabase.auth.admin.updateUserById(guide.auth_user_id, {
      password,
    });
    if (!error) return null;
    // not found 가 아닌 다른 에러면 바로 반환
    const notFound =
      error.message?.toLowerCase().includes("not found") ||
      error.message?.toLowerCase().includes("user not found");
    if (!notFound) return error.message;
    // stale 링크 → 아래에서 복구
  }

  // 2. createUser 시도
  const { data: created, error: createErr } = await supabase.auth.admin.createUser({
    email: guide.email,
    password,
    email_confirm: true,
  });
  if (!createErr && created?.user) {
    await supabase
      .from("guides")
      .update({ auth_user_id: created.user.id })
      .eq("id", guide.id);
    return null;
  }

  // 3. 이미 존재하는 이메일 → listUsers 로 찾기
  const alreadyExists =
    createErr?.message?.toLowerCase().includes("already") ||
    createErr?.message?.toLowerCase().includes("registered");
  if (alreadyExists) {
    // 페이지네이션 루프
    let page = 1;
    const perPage = 1000;
    for (;;) {
      const { data: list, error: listErr } = await supabase.auth.admin.listUsers({
        page,
        perPage,
      });
      if (listErr) return listErr.message;
      const found = list?.users.find((u) => u.email === guide.email);
      if (found) {
        const { error: updErr } = await supabase.auth.admin.updateUserById(found.id, {
          password,
        });
        if (updErr) return updErr.message;
        await supabase
          .from("guides")
          .update({ auth_user_id: found.id })
          .eq("id", guide.id);
        return null;
      }
      if (!list || list.users.length < perPage) break;
      page += 1;
    }
  }

  return createErr?.message || "Unknown error";
}

export async function PUT(request: NextRequest) {
  const supabase = createAdminClient();
  const { guide_id, guide_ids, new_password } = await request.json();

  if (!new_password || new_password.length < 4) {
    return NextResponse.json(
      { error: "비밀번호는 4자 이상이어야 합니다." },
      { status: 400 }
    );
  }

  const ids = guide_ids || [guide_id];

  const { data: guides } = await supabase
    .from("guides")
    .select("id, email, auth_user_id")
    .in("id", ids);

  if (!guides || guides.length === 0) {
    return NextResponse.json({ error: "인솔자를 찾을 수 없습니다." }, { status: 404 });
  }

  const errors: string[] = [];
  for (const guide of guides) {
    const err = await setGuidePassword(supabase, guide, new_password);
    if (err) errors.push(`${guide.email}: ${err}`);
  }

  if (errors.length > 0) {
    return NextResponse.json(
      { error: `일부 변경 실패: ${errors.join(", ")}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, count: guides.length });
}
