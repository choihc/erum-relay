import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { userInfo, slotId } = await request.json();

    if (!userInfo || !slotId) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      );
    }

    const { name, parish, phone_last_4 } = userInfo;

    // 입력값 검증
    if (!name?.trim() || !parish || !phone_last_4?.trim()) {
      return NextResponse.json(
        { error: '모든 필수 정보를 입력해주세요.' },
        { status: 400 }
      );
    }

    if (phone_last_4.length !== 4 || !/^\d{4}$/.test(phone_last_4)) {
      return NextResponse.json(
        { error: '휴대전화 뒷 4자리는 숫자 4자리여야 합니다.' },
        { status: 400 }
      );
    }

    // 사용자 생성 또는 찾기
    let user;
    const { data: existingUser, error: userSearchError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('name', name.trim())
      .eq('parish', parish)
      .eq('phone_last_4', phone_last_4)
      .limit(1);

    if (userSearchError) {
      console.error('User search error:', userSearchError);
      return NextResponse.json(
        { error: '사용자 조회 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    if (existingUser && existingUser.length > 0) {
      user = existingUser[0];
    } else {
      // 새 사용자 생성
      const { data: newUser, error: userCreateError } = await supabaseAdmin
        .from('users')
        .insert({
          name: name.trim(),
          parish,
          phone_last_4,
        })
        .select('id')
        .single();

      if (userCreateError) {
        console.error('User creation error:', userCreateError);
        return NextResponse.json(
          { error: '사용자 등록 중 오류가 발생했습니다.' },
          { status: 500 }
        );
      }

      user = newUser;
    }

    // 중복 신청 확인
    const { data: existingRegistration, error: duplicateCheckError } =
      await supabaseAdmin
        .from('registrations')
        .select('id')
        .eq('user_id', user.id)
        .eq('slot_id', slotId)
        .limit(1);

    if (duplicateCheckError) {
      console.error('Duplicate check error:', duplicateCheckError);
      return NextResponse.json(
        { error: '중복 신청 확인 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    if (existingRegistration && existingRegistration.length > 0) {
      return NextResponse.json(
        { error: '이미 해당 시간대에 신청하셨습니다.' },
        { status: 400 }
      );
    }

    // 재시도 로직으로 동시성 제어 (Race Condition 해결)
    const maxRetries = 3;
    const retryDelay = 100; // 100ms
    let attempt = 0;
    let registration;

    while (attempt < maxRetries) {
      try {
        // 최신 시간대 상태 확인
        const { data: currentSlotStatus, error: slotError } =
          await supabaseAdmin
            .from('slot_status')
            .select('*')
            .eq('id', slotId)
            .single();

        if (slotError) {
          console.error('Slot check error:', slotError);
          return NextResponse.json(
            { error: '시간대 정보 확인 중 오류가 발생했습니다.' },
            { status: 500 }
          );
        }

        if (!currentSlotStatus) {
          return NextResponse.json(
            { error: '존재하지 않는 시간대입니다.' },
            { status: 404 }
          );
        }

        // 마감 체크 - available_spots이 0 이하이면 마감
        if (currentSlotStatus.available_spots <= 0) {
          return NextResponse.json(
            { error: '해당 시간대는 마감되었습니다.' },
            { status: 400 }
          );
        }

        // 신청 등록 시도
        const { data: newRegistration, error: registrationError } =
          await supabaseAdmin
            .from('registrations')
            .insert({
              user_id: user.id,
              slot_id: slotId,
            })
            .select('*')
            .single();

        if (registrationError) {
          // 중복 키 오류 (23505) - 동시 신청으로 인한 실패
          if (registrationError.code === '23505') {
            console.log(
              `Registration attempt ${
                attempt + 1
              } failed due to concurrent access, retrying...`
            );
            attempt++;

            if (attempt >= maxRetries) {
              return NextResponse.json(
                {
                  error:
                    '동시 신청이 많아 처리에 실패했습니다. 잠시 후 다시 시도해주세요.',
                },
                { status: 409 }
              );
            }

            // 재시도 전 잠시 대기
            await new Promise((resolve) => setTimeout(resolve, retryDelay));
            continue;
          }

          // 기타 오류
          console.error('Registration error:', registrationError);
          return NextResponse.json(
            { error: '신청 등록 중 오류가 발생했습니다.' },
            { status: 500 }
          );
        }

        // 성공적으로 등록됨
        registration = newRegistration;
        break;
      } catch (error) {
        console.error(`Registration attempt ${attempt + 1} error:`, error);
        attempt++;

        if (attempt >= maxRetries) {
          return NextResponse.json(
            { error: '신청 처리 중 오류가 발생했습니다. 다시 시도해주세요.' },
            { status: 500 }
          );
        }

        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
    }

    return NextResponse.json({
      success: true,
      registration,
      message: '성공적으로 신청되었습니다.',
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
