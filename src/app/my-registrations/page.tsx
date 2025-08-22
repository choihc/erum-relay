'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loading } from '@/components/ui/loading';
import { supabase } from '@/lib/supabase';

interface UserRegistration {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  is_completed: boolean;
  created_at: string;
}

export default function MyRegistrationsPage() {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<any>(null);
  const [registrations, setRegistrations] = useState<UserRegistration[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [cancelDialog, setCancelDialog] = useState<{
    open: boolean;
    registration?: UserRegistration;
  }>({ open: false });

  useEffect(() => {
    // localStorage에서 사용자 정보 가져오기
    const savedUserInfo = localStorage.getItem('userInfo');
    if (!savedUserInfo) {
      router.push('/register');
      return;
    }
    const userInfo = JSON.parse(savedUserInfo);
    setUserInfo(userInfo);

    if (userInfo.userId) {
      fetchRegistrations(userInfo.userId);
    } else {
      // userId가 없는 경우 서버에서 조회
      findUserAndFetchRegistrations(userInfo);
    }
  }, [router]);

  const findUserAndFetchRegistrations = async (userInfo: any) => {
    setIsLoading(true);
    try {
      const { data: users, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('name', userInfo.name)
        .eq('parish', userInfo.parish)
        .eq('phone_last_4', userInfo.phone_last_4)
        .limit(1);

      if (userError) {
        throw userError;
      }

      if (users && users.length > 0) {
        const userId = users[0].id;
        setUserInfo((prev: any) => ({ ...prev, userId }));
        localStorage.setItem(
          'userInfo',
          JSON.stringify({ ...userInfo, userId })
        );
        await fetchRegistrations(userId);
      } else {
        setError('사용자 정보를 찾을 수 없습니다.');
      }
    } catch (err) {
      console.error('Error finding user:', err);
      setError('사용자 정보 조회 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRegistrations = async (userId: string) => {
    setIsLoading(true);
    setError('');

    try {
      const { data, error } = await supabase
        .from('user_registrations')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) {
        throw error;
      }

      setRegistrations(data || []);
    } catch (err) {
      console.error('Error fetching registrations:', err);
      setError('신청 내역을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async (registration: UserRegistration) => {
    if (!userInfo?.userId) return;

    setError('');

    try {
      const response = await fetch('/api/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          registrationId: registration.id,
          userId: userInfo.userId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '취소에 실패했습니다.');
      }

      // 성공 시 목록 새로고침
      await fetchRegistrations(userInfo.userId);
      setCancelDialog({ open: false });

      // 취소 완료 메시지 저장
      localStorage.setItem(
        'lastCancellation',
        JSON.stringify({
          name: userInfo.name,
          date: registration.date,
          startTime: registration.start_time,
          endTime: registration.end_time,
        })
      );
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message || '취소에 실패했습니다.');
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}월 ${date.getDate()}일`;
  };

  const formatTime = (timeStr: string) => {
    return timeStr.substring(0, 5);
  };

  if (!userInfo) {
    return <Loading size="lg" fullScreen />;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* 헤더 */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2">나의 신청 내역</h1>
        <p className="text-lg text-muted-foreground">
          {userInfo.name} 성도님의 기도 시간 신청 내역입니다
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 신청 내역 섹션 */}
      <div className="mb-8">
        {isLoading ? (
          <Loading />
        ) : registrations.length === 0 ? (
          <div className="text-center py-8 space-y-4">
            <p className="text-muted-foreground">신청 내역이 없습니다.</p>
            <Link href="/apply">
              <Button>새로운 신청하기</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3 max-w-2xl mx-auto">
            {registrations.map((registration) => (
              <div
                key={registration.id}
                className="flex items-center justify-between p-4 border rounded-lg bg-background hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center space-x-4 flex-1">
                  <span className="font-medium text-lg">
                    {formatDate(registration.date)}{' '}
                    {formatTime(registration.start_time)}~
                    {formatTime(registration.end_time)}
                  </span>
                  {registration.is_completed ? (
                    <Badge variant="secondary">완료</Badge>
                  ) : (
                    <Badge>예정</Badge>
                  )}
                </div>
                {!registration.is_completed && (
                  <Button
                    variant="outline"
                    className="h-10 px-6 ml-6"
                    onClick={() =>
                      setCancelDialog({ open: true, registration })
                    }
                    disabled={isLoading}
                  >
                    신청 취소
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="text-center space-y-6">
        <Link href="/apply">
          <Button className="w-full max-w-md text-base h-12">
            추가 신청하기
          </Button>
        </Link>
        <div className="mt-8">
          <Link href="/">
            <Button variant="ghost" className="text-base">
              시작 페이지로 이동
            </Button>
          </Link>
        </div>
      </div>

      {/* 취소 확인 다이얼로그 */}
      <Dialog
        open={cancelDialog.open}
        onOpenChange={(open) => setCancelDialog({ open })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>신청 취소</DialogTitle>
            <DialogDescription>
              {cancelDialog.registration && (
                <>
                  {formatDate(cancelDialog.registration.date)}{' '}
                  {formatTime(cancelDialog.registration.start_time)}~
                  {formatTime(cancelDialog.registration.end_time)} 시간대 신청을
                  취소하시겠습니까?
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelDialog({ open: false })}
            >
              아니오
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                cancelDialog.registration &&
                handleCancel(cancelDialog.registration)
              }
              disabled={isLoading}
            >
              {isLoading ? <Loading /> : '예, 취소합니다'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
