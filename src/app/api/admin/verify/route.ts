import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json(
        { error: '관리자 코드를 입력해주세요.' },
        { status: 400 }
      );
    }

    // 환경변수에서 관리자 코드 확인
    const adminCode = process.env.ADMIN_CODE;

    if (!adminCode) {
      console.error('ADMIN_CODE environment variable not set');
      return NextResponse.json(
        { error: '서버 설정 오류입니다.' },
        { status: 500 }
      );
    }

    if (code !== adminCode) {
      return NextResponse.json(
        { error: '올바르지 않은 관리자 코드입니다.' },
        { status: 401 }
      );
    }

    // 간단한 토큰 생성 (실제 프로덕션에서는 JWT 등을 사용할 것을 권장)
    const timestamp = Date.now().toString();
    const token = createHash('sha256')
      .update(adminCode + timestamp)
      .digest('hex')
      .substring(0, 32);

    return NextResponse.json({
      success: true,
      token,
      message: '관리자 인증이 완료되었습니다.',
    });
  } catch (error) {
    console.error('Admin verification error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
