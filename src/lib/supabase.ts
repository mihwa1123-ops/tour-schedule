import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 클라이언트 사이드 Supabase 클라이언트 (인솔자 인증용)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 서버 사이드 Supabase 클라이언트 (관리자 API용, RLS 우회)
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(supabaseUrl, serviceRoleKey);
}
