-- 공지사항 테이블
CREATE TABLE notices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 정렬/필터용 인덱스 (updated_at 내림차순)
CREATE INDEX notices_updated_at_idx ON notices (updated_at DESC);

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION set_notice_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notices_set_updated_at
BEFORE UPDATE ON notices
FOR EACH ROW
EXECUTE FUNCTION set_notice_updated_at();
