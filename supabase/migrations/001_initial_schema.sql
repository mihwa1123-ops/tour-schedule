-- 인솔자 테이블
CREATE TABLE guides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  auth_user_id uuid UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- 투어 코스 테이블
CREATE TABLE courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- 기본 코스 데이터 삽입
INSERT INTO courses (name, description) VALUES
  ('마실A', '마실A 코스 설명'),
  ('마실B', '마실B 코스 설명'),
  ('토요일', '토요일 코스 설명'),
  ('일요일', '일요일 코스 설명'),
  ('휴일', '휴일 (운행 없음)');

-- 일별 스케줄 테이블
CREATE TABLE schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date UNIQUE NOT NULL,
  course_id uuid REFERENCES courses(id),
  reservations int DEFAULT 0,
  bank_transfer int DEFAULT 0,
  onsite_purchase int DEFAULT 0,
  vehicle_info text DEFAULT '',
  notes text DEFAULT '',
  confirmed_guide_id uuid REFERENCES guides(id),
  created_at timestamptz DEFAULT now()
);

-- 인솔자별 날짜 가능 여부
CREATE TABLE guide_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id uuid REFERENCES schedules(id) ON DELETE CASCADE,
  guide_id uuid REFERENCES guides(id) ON DELETE CASCADE,
  available boolean DEFAULT false,
  UNIQUE(schedule_id, guide_id)
);

-- 인덱스
CREATE INDEX idx_schedules_date ON schedules(date);
CREATE INDEX idx_schedules_confirmed_guide ON schedules(confirmed_guide_id);
CREATE INDEX idx_guide_availability_schedule ON guide_availability(schedule_id);
CREATE INDEX idx_guide_availability_guide ON guide_availability(guide_id);

-- RLS 활성화
ALTER TABLE guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE guide_availability ENABLE ROW LEVEL SECURITY;

-- courses: 인증된 사용자 읽기 허용
CREATE POLICY "courses_read" ON courses FOR SELECT TO authenticated USING (true);

-- schedules: 인증된 사용자 읽기 허용
CREATE POLICY "schedules_read" ON schedules FOR SELECT TO authenticated USING (true);

-- guide_availability: 인증된 사용자 읽기 허용
CREATE POLICY "availability_read" ON guide_availability FOR SELECT TO authenticated USING (true);

-- guide_availability: 본인만 수정 가능
CREATE POLICY "availability_update_own" ON guide_availability FOR UPDATE TO authenticated
  USING (guide_id IN (SELECT id FROM guides WHERE auth_user_id = auth.uid()))
  WITH CHECK (guide_id IN (SELECT id FROM guides WHERE auth_user_id = auth.uid()));

-- guides: 인증된 사용자 이름만 읽기 가능 (드롭다운용)
CREATE POLICY "guides_read" ON guides FOR SELECT TO authenticated USING (true);

-- service_role은 RLS를 우회하므로 관리자 API에서 사용
