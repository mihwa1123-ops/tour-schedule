import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

export async function PUT(request: NextRequest) {
  const supabase = createAdminClient();
  const { schedule_id, guide_id, available } = await request.json();

  const { data, error } = await supabase
    .from("guide_availability")
    .upsert(
      { schedule_id, guide_id, available },
      { onConflict: "schedule_id,guide_id" }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}
