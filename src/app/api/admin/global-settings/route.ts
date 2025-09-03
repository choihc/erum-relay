import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import type {
  GlobalSettingsResponse,
  UpdateGlobalSettingsRequest,
  UpdateGlobalSettingsResponse,
  ApiErrorResponse,
} from '@/types/admin';

// 글로벌 설정 조회
export async function GET(
  request: NextRequest
): Promise<NextResponse<GlobalSettingsResponse | ApiErrorResponse>> {
  try {
    const { data: settings, error } = await supabase
      .from('global_settings')
      .select('setting_value')
      .eq('setting_key', 'max_participants_per_slot')
      .single();

    if (error) {
      console.error('Error fetching global settings:', error);
      return NextResponse.json(
        { error: '설정을 불러오는데 실패했습니다.' },
        { status: 500 }
      );
    }

    if (!settings) {
      return NextResponse.json(
        { error: '설정을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      maxParticipants: settings.setting_value,
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 글로벌 설정 수정
export async function PUT(
  request: NextRequest
): Promise<NextResponse<UpdateGlobalSettingsResponse | ApiErrorResponse>> {
  try {
    const body: UpdateGlobalSettingsRequest = await request.json();
    const { maxParticipants } = body;

    // 입력값 검증
    if (typeof maxParticipants !== 'number' || maxParticipants < 1) {
      return NextResponse.json(
        { error: '유효하지 않은 값입니다. 1 이상의 숫자를 입력해주세요.' },
        { status: 400 }
      );
    }

    // 관리자 권한으로 글로벌 설정 업데이트
    const { data, error } = await supabaseAdmin
      .from('global_settings')
      .update({
        setting_value: maxParticipants,
        updated_at: new Date().toISOString(),
      })
      .eq('setting_key', 'max_participants_per_slot')
      .select();

    if (error) {
      console.error('Error updating global settings:', error);
      return NextResponse.json(
        { error: '설정 수정에 실패했습니다.' },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: '설정을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '최대 신청인원이 성공적으로 수정되었습니다.',
      maxParticipants: data[0].setting_value,
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
