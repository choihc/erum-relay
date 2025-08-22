# 🍂 9월 가을 릴레이 기도 웹앱

교인들이 온라인에서 편리하게 릴레이 기도 시간대를 신청/취소하고, 내 신청 내역을 조회하며, 관리자는 전체 현황을 열람/관리할 수 있는 웹 애플리케이션입니다.

## 🚀 기술 스택

- **Frontend**: Next.js 15 (App Router), TypeScript, React
- **UI/UX**: shadcn/ui + TailwindCSS (가을 웜톤 테마)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: 간단한 사용자 정보 기반 인증
- **Deployment**: Vercel Ready

## 🎨 디자인 특징

- **메인 컬러**: `#BF6600` (가을 오렌지)
- **가을 웜톤 팔레트**: 베이지/브라운 계열
- **모바일 퍼스트**: 반응형 디자인
- **컴포넌트**: shadcn/ui 기반 모던 UI

## 📱 주요 기능

### 일반 사용자

- ✅ 신원 입력 (이름, 교구, 휴대전화 뒷4자리)
- ✅ 캘린더 기반 날짜 선택 (평일만 가능)
- ✅ 시간대별 신청 현황 조회
- ✅ 기도 시간 신청/취소
- ✅ 나의 신청 내역 조회

### 관리자

- ✅ 관리자 코드 인증
- ✅ 날짜별 전체 현황 대시보드
- ✅ 시간대별 신청자 목록 조회
- ✅ 실시간 신청 현황 모니터링

## 🏗 프로젝트 구조

```
src/
├── app/
│   ├── (pages)/
│   │   ├── page.tsx              # 시작 페이지
│   │   ├── register/             # 신원 입력
│   │   ├── apply/                # 신청 페이지
│   │   ├── my-registrations/     # 나의 신청 내역
│   │   └── admin/                # 관리자 페이지
│   ├── api/
│   │   ├── register/             # 신청 API
│   │   ├── cancel/               # 취소 API
│   │   ├── slots/                # 시간대 조회 API
│   │   └── admin/                # 관리자 API
│   ├── globals.css               # 가을 웜톤 스타일
│   └── layout.tsx
├── components/ui/                # shadcn/ui 컴포넌트
├── lib/
│   ├── supabase.ts              # Supabase 설정 및 타입
│   └── utils.ts                 # 유틸리티 함수
└── ...
```

## 🛠 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 내용을 추가:

```env
# Client
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Server only
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ADMIN_CODE=9191
```

### 3. 데이터베이스 설정

`supabase-schema.sql` 파일의 내용을 Supabase SQL Editor에서 실행:

```bash
# 스키마 파일 확인
cat supabase-schema.sql
```

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)에 접속

## 📋 데이터베이스 스키마

### Tables

- **users**: 사용자 정보 (이름, 교구, 전화번호 뒷4자리)
- **prayer_slots**: 기도 시간대 (날짜, 시작/종료 시간, 최대 인원)
- **registrations**: 신청 내역 (사용자-시간대 매핑)

### Views

- **slot_status**: 시간대별 신청 현황 뷰
- **user_registrations**: 사용자별 신청 내역 뷰

## 🔐 보안 및 권한

- **RLS(Row Level Security)**: 모든 테이블에 활성화
- **읽기 전용 클라이언트**: anon key 사용
- **쓰기 작업**: 서버 API에서 service_role key 사용
- **관리자 인증**: 환경변수 기반 코드 인증

## 🚀 배포

### Vercel 배포

1. GitHub에 프로젝트 푸시
2. Vercel에서 프로젝트 연결
3. 환경변수 설정:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (Encrypted)
   - `ADMIN_CODE` (Encrypted)

## 🎯 사용법

### 일반 사용자 흐름

1. **시작하기** 버튼 클릭
2. 신원 정보 입력 (이름, 교구, 휴대전화 뒷4자리)
3. 캘린더에서 날짜 선택 (평일만)
4. 원하는 시간대 신청
5. 신청 완료 확인

### 관리자 흐름

1. 우하단 **관리자** 버튼 클릭
2. 관리자 코드 입력 (기본값: 9191)
3. 대시보드에서 날짜 선택
4. 시간대별 현황 확인
5. **현황 확인** 버튼으로 상세 신청자 목록 조회

## 📞 지원 교구

- 베드로 교구
- 바오로 교구
- 요한 교구
- 마태오 교구
- 마르코 교구
- 루카 교구
- 야고보 교구
- 안드레아 교구
- 필립보 교구
- 토마스 교구

## 🕐 운영 시간

- **평일**: 월요일 ~ 금요일
- **시간**: 오전 7시 ~ 오후 7시 (1시간 단위)
- **최대 인원**: 시간대당 10명

## 🔧 개발 참고사항

### 커스텀 컬러 팔레트

CSS 변수를 통해 가을 웜톤 테마 구현:

- Primary: `#BF6600` (가을 오렌지)
- 배경: 따뜻한 베이지 톤
- 카드: 부드러운 웜 그레이
- 보더: 연한 브라운 계열

### API 엔드포인트

- `POST /api/register`: 기도 시간 신청
- `POST /api/cancel`: 신청 취소
- `GET /api/slots`: 시간대 현황 조회
- `POST /api/admin/verify`: 관리자 인증

---

**Built with ❤️ for 교회 공동체**
