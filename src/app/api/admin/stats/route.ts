import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // 총 신청 건수 조회
    const { count: totalRegistrations, error: registrationsError } =
      await supabase
        .from('registrations')
        .select('*', { count: 'exact', head: true });

    if (registrationsError) {
      console.error('Total registrations count error:', registrationsError);
      return NextResponse.json(
        { error: '총 신청 건수를 불러오는데 실패했습니다.' },
        { status: 500 }
      );
    }

    // 총 사용자 수 조회
    const { count: totalUsers, error: usersError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (usersError) {
      console.error('Total users count error:', usersError);
      return NextResponse.json(
        { error: '총 사용자 수를 불러오는데 실패했습니다.' },
        { status: 500 }
      );
    }

    // 교구별 신청 현황 조회
    const { data: parishStats, error: parishError } = await supabase
      .from('user_registrations')
      .select('parish')
      .order('parish');

    if (parishError) {
      console.error('Parish stats error:', parishError);
      return NextResponse.json(
        { error: '교구별 현황을 불러오는데 실패했습니다.' },
        { status: 500 }
      );
    }

    // 교구별 통계 계산
    const parishCounts: Record<string, number> = {};
    parishStats?.forEach((stat) => {
      if (stat.parish) {
        parishCounts[stat.parish] = (parishCounts[stat.parish] || 0) + 1;
      }
    });

    // 오늘 신청 건수 조회
    const today = new Date().toISOString().split('T')[0];
    const { count: todayRegistrations, error: todayError } = await supabase
      .from('registrations')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', `${today}T00:00:00.000Z`)
      .lt('created_at', `${today}T23:59:59.999Z`);

    if (todayError) {
      console.error('Today registrations count error:', todayError);
    }

    return NextResponse.json({
      totalRegistrations: totalRegistrations || 0,
      totalUsers: totalUsers || 0,
      todayRegistrations: todayRegistrations || 0,
      parishStats: parishCounts,
    });
  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json(
      { error: '통계 정보를 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}
