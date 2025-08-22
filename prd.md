# 📑 PRD – 9월 가을 릴레이 기도 웹앱

## 1) 개요

- **프로젝트명**: 9월 가을 릴레이 기도 신청 시스템
- **목적**: 교인들이 온라인에서 편리하게 릴레이 기도 시간대를 신청/취소하고, 내 신청 내역을 조회하며, 관리자는 전체 현황을 열람/관리
- **플랫폼**: 웹(모바일 퍼스트)
- **기술 스택**
  - **Frontend**: Next.js App Router(최신), TypeScript
  - **UI**: shadcn/ui + TailwindCSS (메인 컬러 `#BF6600`, 가을 웜톤)
  - **DB/BaaS**: Supabase(PostgreSQL, Edge, Storage), RLS
  - **배포**: Vercel(가정)

---

## 2) 핵심 사용자 흐름

### 2.1 시작 페이지

- **CTA**: `시작하기` → 신원 입력 페이지
- **관리자 버튼**(우하단): 관리자 코드 입력 페이지 이동

```ascii
┌───────────────────────────────┐
│       9월 가을 릴레이 기도      │
│  [시작하기]                    │
│                         [관리자]│
└───────────────────────────────┘
```

### 2.2 신원 입력 페이지

- **입력**: 이름, 교구(드롭다운), 휴대전화 뒷 4자리
- **동작**
  - `신청하기` → 신청 페이지로 이동
  - `나의 신청 확인하기` → 신청 내역(없으면 “신청내역이 없습니다.” 얼럿)

```ascii
이름: [__________]
교구: [v 드롭다운]
휴대전화 뒷 4자리: [____]

[신청하기]    [나의 신청 확인하기]
```

### 2.3 신청 페이지

- 상단 캘린더에서 날짜 선택 (주말은 제외하고 월요일~금요일 만 선택 가능)
- 선택 날짜의 시간대 리스트 오전 7시부터 오후 7시까지
  - 항목: `HH:mm~HH:mm`, 현재 신청 인원, [신청하기]
- `신청하기` → 모달("9월 19일 10:00~11:00 신청하시겠습니까?") → 확인 시 신청 완료

```ascii
[캘린더]

시간대 리스트
07:00~08:00  신청인원 3명  [신청하기]
08:00~09:00  신청인원 2명  [신청하기]
...
```

### 2.4 신청 완료 페이지

- 메시지: “OOO 성도님, 9월 19일 10:00~11:00로 신청되었습니다.”
- 버튼: `나의 신청내역 확인하기`, `시작 페이지로 이동`

### 2.5 신청 내역 페이지

- 과거 시간: `완료` 표시
- 미래 시간: `신청 취소` 버튼 제공(모달 확인 후 취소 완료 페이지)

### 2.6 신청 취소 완료 페이지

- 메시지: “OOO 성도님, 9월 19일 10:00~11:00로 신청이 취소되었습니다.”
- 버튼: `신청 페이지로 이동`, `시작 페이지로 이동`

### 2.7 관리자

- **관리자 코드 입력 페이지** → 코드 검증 성공 시 **관리자 대시보드**
- **대시보드**
  - 캘린더에서 날짜 선택 → 하단 리스트에 시간별 신청 현황
  - 각 시간대 `현황 확인` → 모달로 해당 시간 신청자 목록(이름/교구/뒷4자리)

---

## 3) 권한/보안 전략 (Supabase)

- **RLS 활성화**: 모든 테이블 RLS ON
- **쓰기/취소는 서버 라우트(Next.js Route Handler)에서 서비스 키 사용**
  - 클라이언트는 **읽기 전용**(slots 현황, 내 신청 내역 조회)
- **관리자 코드**: 서버 환경변수(`ADMIN_CODE`)로 비교(별도 DB 저장 불필요)
- **키 노출 방지**
  - **클라이언트**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - **서버**: `SUPABASE_SERVICE_ROLE_KEY` (절대 클라이언트 번들에 포함 X)

---

## 4) UI/디자인(샤드씨엔, 가을 웜톤)

- **메인 컬러**: `#BF6600`
- **보조 팔레트**: 베이지/브라운 계열 (배경/카드/보더 톤다운)
- **컴포넌트**: shadcn/ui Button, Card, Calendar, Dialog, Alert, Badge 등
- **타이포**: Sans-serif 기본, 라운드 코너(2xl), 적절한 그림자/여백(p-4~6)
- **아이콘**: lucide-react

---

## 5) 환경변수(.env)

```dotenv
# Client
NEXT_PUBLIC_SUPABASE_URL=https://pqcgvnnprdvbedxabrre.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxY2d2bm5wcmR2YmVkeGFicnJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4NjY0MDgsImV4cCI6MjA3MTQ0MjQwOH0.2TTpl0knxO-Frmd6ozxGIL4fuHtaM-fy8pHoShITeQk

# Server only
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxY2d2bm5wcmR2YmVkeGFicnJlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTg2NjQwOCwiZXhwIjoyMDcxNDQyNDA4fQ.HB8wzQIwvSyockxRCOpvk12zUbgxXGjQU1AhsU99HIU
ADMIN_CODE=9191
```

> `SUPABASE_SERVICE_ROLE_KEY`는 **서버 전용**입니다. Vercel Project Environment에 **Encrypted**로 저장하고 빌드/런타임에서만 사용하세요.

---

## 6) API

- DB 에 바로 sql 로 요청하지 말고 nextjs 에서 제공하는 rest API를 통하여 호출하도록 설계
