import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { registrationId, userId } = await request.json();

    if (!registrationId || !userId) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 신청 정보 확인
    const { data: registration, error: fetchError } = await supabaseAdmin
      .from('registrations')
      .select(
        `
        id,
        user_id,
        prayer_slot:prayer_slots(date, start_time)
      `
      )
      .eq('id', registrationId)
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      console.error('Registration fetch error:', fetchError);
      return NextResponse.json(
        { error: '신청 정보 확인 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    if (!registration) {
      return NextResponse.json(
        { error: '존재하지 않는 신청입니다.' },
        { status: 404 }
      );
    }

    // 과거 시간대인지 확인
    const { prayer_slot } = registration as {
      prayer_slot: {
        date: string;
        start_time: string;
      }[];
    };
    if (prayer_slot && prayer_slot[0]) {
      const slotDateTime = new Date(
        `${prayer_slot[0].date}T${prayer_slot[0].start_time}`
      );
      const now = new Date();

      if (slotDateTime < now) {
        return NextResponse.json(
          { error: '이미 지난 시간대는 취소할 수 없습니다.' },
          { status: 400 }
        );
      }
    }

    // 신청 취소 (삭제)
    const { error: deleteError } = await supabaseAdmin
      .from('registrations')
      .delete()
      .eq('id', registrationId)
      .eq('user_id', userId);

    if (deleteError) {
      console.error('Registration delete error:', deleteError);
      return NextResponse.json(
        { error: '신청 취소 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '성공적으로 취소되었습니다.',
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
