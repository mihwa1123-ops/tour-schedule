import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

// 코스 표시 순서 (명시적 우선순위)
const COURSE_ORDER: Record<string, number> = {
  "마실A": 1,
  "마실B": 2,
  "토요마실": 3,
  "일요마실": 4,
  "휴일": 99,
};

export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("courses").select("*");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const sorted = (data || []).slice().sort((a, b) => {
    const oa = COURSE_ORDER[a.name] ?? 50;
    const ob = COURSE_ORDER[b.name] ?? 50;
    if (oa !== ob) return oa - ob;
    return a.name.localeCompare(b.name);
  });
  return NextResponse.json(sorted);
}

export async function PUT(request: NextRequest) {
  const supabase = createAdminClient();
  const body = await request.json();
  const {
    id,
    description,
    tour_location,
    location_description,
    boarding_location,
    docent_handover,
    link_url,
  } = body;

  if (!id) {
    return NextResponse.json({ error: "id 가 필요합니다." }, { status: 400 });
  }

  const updates: Record<string, string> = {};
  if (description !== undefined) updates.description = description ?? "";
  if (tour_location !== undefined) updates.tour_location = tour_location ?? "";
  if (location_description !== undefined) updates.location_description = location_description ?? "";
  if (boarding_location !== undefined) updates.boarding_location = boarding_location ?? "";
  if (docent_handover !== undefined) updates.docent_handover = docent_handover ?? "";
  if (link_url !== undefined) updates.link_url = link_url ?? "";

  const { data, error } = await supabase
    .from("courses")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}
