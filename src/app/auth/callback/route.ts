import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  if (token_hash && type) {
    await supabase.auth.verifyOtp({ token_hash, type: type as "magiclink" });
  }

  return NextResponse.redirect(new URL("/schedule", request.url));
}
