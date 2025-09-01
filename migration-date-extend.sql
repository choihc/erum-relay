-- 날짜 범위 확장 마이그레이션 스크립트
-- 9월 8일~22일에서 9월 8일~26일로 확장

-- 9월 23일~26일 평일 시간대 생성
DO $$
DECLARE
  loop_date DATE;
  start_date DATE := '2025-09-23'; -- 9월 23일부터
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

-- 완료 메시지
SELECT 
  '날짜 범위 확장 완료! 9월 23일~26일 평일 시간대가 추가되었습니다.' as result,
  COUNT(*) as created_slots
FROM prayer_slots 
WHERE date BETWEEN '2025-09-23' AND '2025-09-26';
