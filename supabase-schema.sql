-- 9월 가을 릴레이 기도 웹앱 데이터베이스 스키마

-- 사용자 테이블
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  parish VARCHAR(50) NOT NULL,
  phone_last_4 VARCHAR(4) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 기도 시간대 테이블
CREATE TABLE prayer_slots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  max_participants INTEGER DEFAULT 3 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(date, start_time, end_time)
);

-- 신청 테이블
CREATE TABLE registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  slot_id UUID REFERENCES prayer_slots(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, slot_id)
);

-- 인덱스 생성
CREATE INDEX idx_prayer_slots_date ON prayer_slots(date);
CREATE INDEX idx_registrations_user_id ON registrations(user_id);
CREATE INDEX idx_registrations_slot_id ON registrations(slot_id);
CREATE INDEX idx_users_name_parish_phone ON users(name, parish, phone_last_4);

-- RLS 정책 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

-- 읽기 전용 정책 (모든 사용자가 읽기 가능)
CREATE POLICY "Allow read access to prayer_slots" ON prayer_slots
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow read access to registrations" ON registrations
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow read access to users" ON users
  FOR SELECT TO anon, authenticated USING (true);

-- 쓰기는 서버에서만 (service_role 키 사용)

-- 기본 기도 시간대 데이터 삽입 (9월 한 달간 평일 7시-19시)
DO $$
DECLARE
  loop_date DATE;
  start_date DATE := '2025-09-01'; -- 2025년 9월 첫 번째 날
  end_date DATE := '2025-09-30';   -- 2025년 9월 마지막 날
  current_hour INTEGER;
BEGIN
  loop_date := start_date;
  
  WHILE loop_date <= end_date LOOP
    -- 월요일(1)부터 금요일(5)까지만
    IF EXTRACT(DOW FROM loop_date) BETWEEN 1 AND 5 THEN
      -- 7시부터 18시까지 (19시 끝) - 오전 7시부터 오후 7시까지
      FOR current_hour IN 7..18 LOOP
        INSERT INTO prayer_slots (date, start_time, end_time)
        VALUES (
          loop_date,
          (current_hour || ':00:00')::TIME,
          ((current_hour + 1) || ':00:00')::TIME
        );
      END LOOP;
    END IF;
    
    loop_date := loop_date + INTERVAL '1 day';
  END LOOP;
END $$;

-- 기존 2024년 데이터 삭제 및 2025년 데이터로 마이그레이션
DELETE FROM registrations WHERE slot_id IN (
  SELECT id FROM prayer_slots WHERE date >= '2024-01-01' AND date < '2025-01-01'
);
DELETE FROM prayer_slots WHERE date >= '2024-01-01' AND date < '2025-01-01';

-- 뷰 생성: 시간대별 신청 현황
CREATE VIEW slot_status AS
SELECT 
  ps.id,
  ps.date,
  ps.start_time,
  ps.end_time,
  ps.max_participants,
  COUNT(r.id) as current_participants,
  (ps.max_participants - COUNT(r.id)) as available_spots
FROM prayer_slots ps
LEFT JOIN registrations r ON ps.id = r.slot_id
GROUP BY ps.id, ps.date, ps.start_time, ps.end_time, ps.max_participants
ORDER BY ps.date, ps.start_time;

-- 뷰에 대한 읽기 권한
GRANT SELECT ON slot_status TO anon, authenticated;

-- 뷰 생성: 사용자별 신청 내역
CREATE VIEW user_registrations AS
SELECT 
  r.id,
  r.user_id,
  r.slot_id,
  r.created_at,
  u.name,
  u.parish,
  u.phone_last_4,
  ps.date,
  ps.start_time,
  ps.end_time,
  (ps.date + ps.start_time) < NOW() as is_completed
FROM registrations r
JOIN users u ON r.user_id = u.id
JOIN prayer_slots ps ON r.slot_id = ps.id
ORDER BY ps.date, ps.start_time;

-- 뷰에 대한 읽기 권한
GRANT SELECT ON user_registrations TO anon, authenticated;
