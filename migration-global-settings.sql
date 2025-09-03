-- 글로벌 설정을 위한 마이그레이션
-- 2025-01-XX: 최대 신청인원 글로벌 설정 기능 추가

-- 1. global_settings 테이블 생성
CREATE TABLE global_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key VARCHAR(50) UNIQUE NOT NULL,
  setting_value INTEGER NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 초기값 설정 (기존 기본값 3명 사용)
INSERT INTO global_settings (setting_key, setting_value) 
VALUES ('max_participants_per_slot', 3);

-- 3. RLS 정책 설정
ALTER TABLE global_settings ENABLE ROW LEVEL SECURITY;

-- 읽기 권한 (모든 사용자가 읽기 가능)
CREATE POLICY "Allow read access to global_settings" ON global_settings
  FOR SELECT TO anon, authenticated USING (true);

-- 쓰기는 서버에서만 (service_role 키 사용)

-- 4. slot_status 뷰를 글로벌 설정을 참조하도록 수정
CREATE OR REPLACE VIEW slot_status AS
SELECT 
  ps.id,
  ps.date,
  ps.start_time,
  ps.end_time,
  gs.setting_value as max_participants,
  COUNT(r.id) as current_participants,
  (gs.setting_value - COUNT(r.id)) as available_spots
FROM prayer_slots ps
CROSS JOIN global_settings gs
LEFT JOIN registrations r ON ps.id = r.slot_id
WHERE gs.setting_key = 'max_participants_per_slot'
GROUP BY ps.id, ps.date, ps.start_time, ps.end_time, gs.setting_value
ORDER BY ps.date, ps.start_time;

-- 5. 뷰에 대한 읽기 권한 재설정
GRANT SELECT ON slot_status TO anon, authenticated;

-- 6. 인덱스 생성 (성능 최적화)
CREATE INDEX idx_global_settings_key ON global_settings(setting_key);

-- 7. 업데이트 시간 자동 갱신을 위한 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 8. 트리거 생성
CREATE TRIGGER update_global_settings_updated_at 
    BEFORE UPDATE ON global_settings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
