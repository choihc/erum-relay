'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

interface RegistrationInfo {
  name: string;
  date: string;
  startTime: string;
  endTime: string;
}

export default function ApplySuccessPage() {
  const router = useRouter();
  const [registrationInfo, setRegistrationInfo] =
    useState<RegistrationInfo | null>(null);

  useEffect(() => {
    const savedRegistration = localStorage.getItem('lastRegistration');
    if (!savedRegistration) {
      router.push('/');
      return;
    }
    setRegistrationInfo(JSON.parse(savedRegistration));
  }, [router]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}월 ${date.getDate()}일`;
  };

  const formatTime = (timeStr: string) => {
    return timeStr.substring(0, 5);
  };

  if (!registrationInfo) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md space-y-6">
        <Card className="text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-xl font-bold text-primary">
              신청이 완료되었습니다!
            </CardTitle>
            <CardDescription>
              {registrationInfo.name} 성도님의 기도 시간이 등록되었습니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/30 p-4 rounded-lg space-y-2">
              <p className="font-medium">신청 내용</p>
              <p className="text-lg font-semibold text-primary">
                {formatDate(registrationInfo.date)}{' '}
                {formatTime(registrationInfo.startTime)}~
                {formatTime(registrationInfo.endTime)}
              </p>
            </div>

            <div className="text-sm text-muted-foreground space-y-1">
              <p>• 기도 시간 5분 전에 준비해주세요</p>
              <p>• 신청 취소는 나의 신청내역에서 가능합니다</p>
            </div>

            <div className="space-y-3 pt-4">
              <Link href="/my-registrations" className="block">
                <Button className="w-full h-12 text-base font-medium">
                  나의 신청내역 확인하기
                </Button>
              </Link>
              <Link href="/" className="block">
                <Button
                  variant="outline"
                  className="w-full h-12 text-base font-medium"
                >
                  시작 페이지로 이동
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
