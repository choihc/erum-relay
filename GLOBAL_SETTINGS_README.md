# 글로벌 최대 신청인원 설정 기능

## 📋 개요

관리자가 모든 시간대에 적용되는 최대 신청인원을 실시간으로 수정할 수 있는 기능입니다.

## 🎯 주요 기능

- 관리자 대시보드에서 전체 최대 신청인원을 한 번에 설정
- 실시간 인라인 편집 (클릭하여 수정)
- 변경 시 모든 시간대에 즉시 적용
- 기존 신청자는 그대로 유지 (마감 처리만 변경)

## 🛠️ 구현 내용

### 1. 데이터베이스

```sql
-- 새로 추가된 테이블
CREATE TABLE global_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key VARCHAR(50) UNIQUE NOT NULL,
  setting_value INTEGER NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 초기 설정값
INSERT INTO global_settings (setting_key, setting_value)
VALUES ('max_participants_per_slot', 3);
```

### 2. 수정된 뷰

```sql
-- slot_status 뷰가 글로벌 설정을 참조하도록 수정
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
```

### 3. API 엔드포인트

- `GET /api/admin/global-settings` - 현재 설정 조회
- `PUT /api/admin/global-settings` - 설정 수정

### 4. UI 구성

- **관리자 대시보드**: 글로벌 설정 섹션 추가
- **Apply 페이지**: 동적 최대 인원 표시
- **실시간 편집**: 인라인 편집 모드 지원

## 📁 파일 구조

```
src/
├── app/api/admin/global-settings/route.ts  # 글로벌 설정 API
├── app/admin/dashboard/page.tsx            # 관리자 대시보드 (UI 추가)
├── app/apply/page.tsx                      # 신청 페이지 (동적 인원 표시)
├── app/api/slots/route.ts                  # 슬롯 생성 로직 수정
└── types/admin.ts                          # TypeScript 타입 정의

migration-global-settings.sql              # 데이터베이스 마이그레이션
migration-cleanup-max-participants.sql     # 불필요한 컬럼 제거
```

## 🚀 사용 방법

### 관리자 설정 변경

1. 관리자 로그인 후 대시보드 접속
2. "전체 최대 신청인원 설정" 섹션에서 수정 버튼 클릭
3. 원하는 숫자 입력 (1 이상)
4. 저장 버튼 클릭 또는 Enter 키 입력
5. 모든 시간대에 즉시 적용됨

### 신청자 경험

- 각 시간대별로 동적으로 계산된 최대 인원 표시
- 현재 신청인원/최대 인원 형태로 표시
- 마감 시 "마감" 버튼으로 표시

## 🔧 마이그레이션 방법

### 1단계: 글로벌 설정 추가

```bash
# migration-global-settings.sql 실행
```

### 2단계: 기존 컬럼 제거 (선택사항)

```bash
# migration-cleanup-max-participants.sql 실행
```

## 🧪 테스트 시나리오

1. **설정 변경**: 3명 → 1명으로 변경
2. **마감 처리**: 3명 신청된 시간대가 마감으로 표시되는지 확인
3. **신규 신청**: 새로운 시간대에서 1명 제한이 적용되는지 확인
4. **기존 신청**: 기존 신청자들이 그대로 유지되는지 확인

## 📝 주의사항

- 설정 변경 시 기존 신청자는 삭제되지 않음
- 새로운 설정보다 많은 신청자가 있는 시간대는 마감 처리됨
- 1 이상의 숫자만 입력 가능
- 변경사항은 즉시 모든 사용자에게 반영됨
