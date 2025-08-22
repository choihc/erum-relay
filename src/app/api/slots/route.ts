import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json(
        { error: '날짜 정보가 필요합니다.' },
        { status: 400 }
      );
    }

    // 날짜 형식 검증
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return NextResponse.json(
        { error: '올바른 날짜 형식이 아닙니다. (YYYY-MM-DD)' },
        { status: 400 }
      );
    }

    // 해당 날짜의 시간대 정보 조회
    const { data: initialSlots, error: initialError } = await supabase
      .from('slot_status')
      .select('*')
      .eq('date', date)
      .order('start_time');

    if (initialError) {
      console.error('Slots fetch error:', initialError);
      return NextResponse.json(
        { error: '시간대 정보를 불러오는데 실패했습니다.' },
        { status: 500 }
      );
    }

    // 시간대가 없으면 자동으로 생성 (평일만)
    let slots = initialSlots;
    if (!slots || slots.length === 0) {
      const targetDate = new Date(date + 'T00:00:00');
      const dayOfWeek = targetDate.getDay();

      // 월요일(1)부터 금요일(5)까지만 시간대 생성
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        console.log('Creating slots for date:', date);

        // 오전 7시부터 오후 6시까지 (7:00-18:00 시작, 8:00-19:00 종료)
        const timeSlots = [];
        for (let hour = 7; hour <= 18; hour++) {
          const startTime = `${hour.toString().padStart(2, '0')}:00:00`;
          const endTime = `${(hour + 1).toString().padStart(2, '0')}:00:00`;

          timeSlots.push({
            date,
            start_time: startTime,
            end_time: endTime,
            max_participants: 10,
          });
        }

        // prayer_slots 테이블에 시간대 삽입 (관리자 권한 사용)
        const { error: insertError } = await supabaseAdmin
          .from('prayer_slots')
          .insert(timeSlots);

        if (insertError) {
          console.error('Error creating slots:', insertError);
          // 삽입 오류가 있어도 계속 진행 (중복 키 오류 등)
        }

        // 다시 조회
        const { data: newSlots, error: refetchError } = await supabase
          .from('slot_status')
          .select('*')
          .eq('date', date)
          .order('start_time');

        if (!refetchError) {
          slots = newSlots;
        }
      }
    }

    return NextResponse.json({
      success: true,
      slots: slots || [],
      date,
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
