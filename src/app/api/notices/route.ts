import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

// 최신 수정순으로 공지사항 조회
// ?limit=30 형태로 개수 제한, ?offset=30 로 페이지네이션
export async function GET(request: NextRequest) {
  const supabase = createAdminClient();
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "30"), 100);
  const offset = parseInt(searchParams.get("offset") || "0");

  const { data, error, count } = await supabase
    .from("notices")
    .select("*", { count: "exact" })
    .order("updated_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ items: data || [], total: count || 0 });
}

export async function POST(request: NextRequest) {
  const supabase = createAdminClient();
  const { title, content } = await request.json();

  if (!title || !title.trim()) {
    return NextResponse.json({ error: "제목을 입력하세요." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("notices")
    .insert({ title: title.trim(), content: content || "" })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function PUT(request: NextRequest) {
  const supabase = createAdminClient();
  const { id, title, content } = await request.json();

  if (!id) {
    return NextResponse.json({ error: "ID가 필요합니다." }, { status: 400 });
  }
  if (!title || !title.trim()) {
    return NextResponse.json({ error: "제목을 입력하세요." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("notices")
    .update({ title: title.trim(), content: content || "" })
    .eq("id", id)
    .select()
    .single();

  if (error) {
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

  const { error } = await supabase.from("notices").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
