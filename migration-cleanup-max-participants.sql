-- 글로벌 설정 도입 후 불필요해진 컬럼 제거
-- 2025-01-XX: prayer_slots.max_participants 컬럼 제거

-- 1. 모든 기능이 글로벌 설정(global_settings)을 사용하는지 확인
-- slot_status 뷰가 global_settings를 참조하고 있어야 함

-- 2. 백업용 확인 쿼리 (실행 전 확인용 - 주석 해제하여 사용)
-- SELECT DISTINCT max_participants FROM prayer_slots;
-- SELECT COUNT(*) FROM prayer_slots WHERE max_participants != 3;

-- 3. prayer_slots 테이블에서 max_participants 컬럼 제거
-- 이제 모든 최대 참가자 수는 global_settings 테이블에서 관리됨
ALTER TABLE prayer_slots DROP COLUMN max_participants;

-- 4. 확인: slot_status 뷰가 정상적으로 동작하는지 테스트
-- SELECT * FROM slot_status LIMIT 1;

-- 마이그레이션 완료
-- 이제 모든 시간대의 최대 참가자 수는 global_settings.max_participants_per_slot 값으로 통일됨
