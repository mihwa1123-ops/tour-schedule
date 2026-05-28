-- ============================================================
-- Supabase 2026-05-30 보안 변경 대응
-- public 스키마 테이블에 명시적 GRANT 권한 부여
-- ============================================================

-- 1. public 스키마 사용 권한
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- 2. guides: 로그인한 사용자만 읽기
GRANT SELECT ON guides TO authenticated;

-- 3. courses: 로그인한 사용자만 읽기
GRANT SELECT ON courses TO authenticated;

-- 4. schedules: 로그인한 사용자만 읽기
GRANT SELECT ON schedules TO authenticated;

-- 5. guide_availability: 로그인한 사용자 읽기 + 본인 행 수정
GRANT SELECT, UPDATE ON guide_availability TO authenticated;

-- 6. notices: 로그인한 사용자만 읽기
GRANT SELECT ON notices TO authenticated;

-- ============================================================
-- notices 테이블 RLS 보안 강화
-- (기존 002_notices.sql에서 RLS가 누락되어 있었음)
-- ============================================================

ALTER TABLE notices ENABLE ROW LEVEL SECURITY;

-- 로그인한 사용자: 공지사항 읽기 허용
CREATE POLICY "notices_read" ON notices FOR SELECT TO authenticated USING (true);
