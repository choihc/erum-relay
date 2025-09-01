-- 기존 데이터베이스 업데이트 마이그레이션 스크립트
-- max_participants 기본값을 3으로 변경하고 기존 데이터 업데이트

-- 1. prayer_slots 테이블의 기본값 변경
ALTER TABLE prayer_slots ALTER COLUMN max_participants SET DEFAULT 3;

-- 2. 기존 무제한(999999) 또는 기본값(10) 데이터를 3으로 업데이트
UPDATE prayer_slots 
SET max_participants = 3 
WHERE max_participants = 999999 OR max_participants = 10 OR max_participants > 100;

-- 3. 9월 8일~26일 범위 외의 데이터 삭제 (필요한 경우)
-- 주석 해제하여 사용하세요
-- DELETE FROM registrations WHERE slot_id IN (
--   SELECT id FROM prayer_slots 
--   WHERE date < '2025-09-08' OR date > '2025-09-26'
-- );
-- DELETE FROM prayer_slots 
-- WHERE date < '2025-09-08' OR date > '2025-09-26';

-- 4. 9월 8일~26일 평일 데이터가 없다면 생성
DO $$
DECLARE
  loop_date DATE;
  start_date DATE := '2025-09-08'; -- 9월 8일부터
  end_date DATE := '2025-09-26';   -- 9월 26일까지
  current_hour INTEGER;
  slot_exists BOOLEAN;
BEGIN
  loop_date := start_date;
  
  WHILE loop_date <= end_date LOOP
    -- 월요일(1)부터 금요일(5)까지만
    IF EXTRACT(DOW FROM loop_date) BETWEEN 1 AND 5 THEN
      -- 7시부터 18시까지 (19시 끝) - 오전 7시부터 오후 7시까지
      FOR current_hour IN 7..18 LOOP
        -- 해당 시간대가 이미 존재하는지 확인
        SELECT EXISTS(
          SELECT 1 FROM prayer_slots 
          WHERE date = loop_date 
          AND start_time = (current_hour || ':00:00')::TIME
          AND end_time = ((current_hour + 1) || ':00:00')::TIME
        ) INTO slot_exists;
        
        -- 존재하지 않으면 생성
        IF NOT slot_exists THEN
          INSERT INTO prayer_slots (date, start_time, end_time, max_participants)
          VALUES (
            loop_date,
            (current_hour || ':00:00')::TIME,
            ((current_hour + 1) || ':00:00')::TIME,
            3
          );
        END IF;
      END LOOP;
    END IF;
    
    loop_date := loop_date + INTERVAL '1 day';
  END LOOP;
END $$;

-- 5. 기존 뷰 삭제 후 재생성 (안전하게)
DROP VIEW IF EXISTS slot_status;
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

-- 6. 뷰에 대한 읽기 권한
GRANT SELECT ON slot_status TO anon, authenticated;

-- 7. 사용자별 신청 내역 뷰 재생성
DROP VIEW IF EXISTS user_registrations;
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

-- 8. 뷰에 대한 읽기 권한
GRANT SELECT ON user_registrations TO anon, authenticated;

-- 완료 메시지
SELECT 'Migration completed successfully!' as result;
