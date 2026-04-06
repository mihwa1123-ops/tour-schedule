import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("courses")
    .select("*")
    .order("name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function PUT(request: NextRequest) {
  const supabase = createAdminClient();
  const { id, description, image_url, link_url } = await request.json();

  const updates: Record<string, string | undefined> = {};
  if (description !== undefined) updates.description = description;
  if (image_url !== undefined) updates.image_url = image_url;
  if (link_url !== undefined) updates.link_url = link_url;

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
