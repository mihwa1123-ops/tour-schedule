-- 코스 상세 정보 필드 추가
ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS tour_location text DEFAULT '',
  ADD COLUMN IF NOT EXISTS location_description text DEFAULT '',
  ADD COLUMN IF NOT EXISTS boarding_location text DEFAULT '',
  ADD COLUMN IF NOT EXISTS docent_handover text DEFAULT '',
  ADD COLUMN IF NOT EXISTS link_url text DEFAULT '';

-- 기존 description 이 null 인 경우 빈 문자열로
UPDATE courses SET description = '' WHERE description IS NULL;

-- 새 컬럼도 null 방지
UPDATE courses SET tour_location = '' WHERE tour_location IS NULL;
UPDATE courses SET location_description = '' WHERE location_description IS NULL;
UPDATE courses SET boarding_location = '' WHERE boarding_location IS NULL;
UPDATE courses SET docent_handover = '' WHERE docent_handover IS NULL;
UPDATE courses SET link_url = '' WHERE link_url IS NULL;

-- PostgREST 스키마 캐시 새로고침
NOTIFY pgrst, 'reload schema';
