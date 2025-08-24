import { createClient } from '@supabase/supabase-js';

// 환경변수 확인
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}

if (!supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
}

// 클라이언트용 Supabase 인스턴스 (읽기 전용)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 서버용 Supabase 인스턴스 (관리자 권한)
export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey || supabaseAnonKey // 서버 키가 없으면 anon 키 사용
);

// 타입 정의
export interface User {
  id: string;
  name: string;
  parish: string; // 교구
  phone_last_4: string; // 휴대전화 뒷 4자리
  created_at: string;
}

export interface PrayerSlot {
  id: string;
  date: string; // YYYY-MM-DD
  start_time: string; // HH:mm
  end_time: string; // HH:mm
  max_participants?: number; // 옵셔널로 변경 (무제한)
  created_at: string;
}

export interface Registration {
  id: string;
  user_id: string;
  slot_id: string;
  created_at: string;
  user?: User;
  prayer_slot?: PrayerSlot;
}

// 교구 목록
export const PARISHES = [
  '1 교구',
  '2 교구',
  '3 교구',
  '4 교구',
  '5 교구',
  '6 교구',
  '7 교구',
  '8 교구',
  '9 교구',
  '다음세대',
  '기타',
] as const;

export type Parish = (typeof PARISHES)[number];
