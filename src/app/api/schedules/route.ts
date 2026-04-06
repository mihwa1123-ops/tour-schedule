import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const supabase = createAdminClient();
  const { searchParams } = new URL(request.url);
  const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));
  const month = parseInt(searchParams.get("month") || String(new Date().getMonth()));

  const startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const endDate = new Date(year, month + 1, 0);
  const endDateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(endDate.getDate()).padStart(2, "0")}`;

  const { data: schedules, error } = await supabase
    .from("schedules")
    .select(`
      *,
      course:courses(*),
      confirmed_guide:guides!schedules_confirmed_guide_id_fkey(*),
      availability:guide_availability(*, guide:guides(*))
    `)
    .gte("date", startDate)
    .lte("date", endDateStr)
    .order("date");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(schedules);
}

export async function PUT(request: NextRequest) {
  const supabase = createAdminClient();
  const body = await request.json();
  const { id, ...updates } = body;

  const { data, error } = await supabase
    .from("schedules")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = createAdminClient();
  const body = await request.json();

  // 월별 스케줄 일괄 생성
  const { year, month } = body;
  const lastDay = new Date(year, month + 1, 0).getDate();

  // 모든 코스 조회
  const { data: allCourses } = await supabase.from("courses").select("id, name");
  const courseByName = new Map(allCourses?.map(c => [c.name, c.id]) || []);

  // 요일별 기본 코스 매핑 (0=일, 1=월, ..., 6=토)
  const dayToCourse: Record<number, string> = {
    0: "일요마실", // 일
    1: "휴일",     // 월
    2: "마실A",    // 화
    3: "마실B",    // 수
    4: "마실A",    // 목
    5: "마실B",    // 금
    6: "토요마실", // 토
  };

  const schedules = [];
  for (let d = 1; d <= lastDay; d++) {
    const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const dayOfWeek = new Date(year, month, d).getDay();
    const courseName = dayToCourse[dayOfWeek];
    const courseId = courseName ? courseByName.get(courseName) || null : null;

    schedules.push({
      date,
      course_id: courseId,
      reservations: 0,
      bank_transfer: 0,
      onsite_purchase: 0,
      vehicle_info: "",
      notes: "",
      confirmed_guide_id: null,
    });
  }

  const { data, error } = await supabase
    .from("schedules")
    .upsert(schedules, { onConflict: "date" })
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 각 스케줄에 대해 모든 인솔자의 가용성 레코드 생성
  const { data: guides } = await supabase.from("guides").select("id");
  if (guides && data) {
    const availabilities = [];
    for (const schedule of data) {
      const dayOfWeek = new Date(schedule.date).getDay();
      if (dayOfWeek === 1) continue; // 월요일 제외
      for (const guide of guides) {
        availabilities.push({
          schedule_id: schedule.id,
          guide_id: guide.id,
          available: false,
        });
      }
    }
    if (availabilities.length > 0) {
      await supabase
        .from("guide_availability")
        .upsert(availabilities, { onConflict: "schedule_id,guide_id" });
    }
  }

  return NextResponse.json(data);
}
