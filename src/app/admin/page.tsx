'use client';

import { useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function AdminPage() {
  const router = useRouter();
  const [adminCode, setAdminCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!adminCode.trim()) {
      setError('관리자 코드를 입력해주세요.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: adminCode }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // 관리자 인증 성공 - 토큰을 localStorage에 저장
        localStorage.setItem('adminToken', result.token);
        router.push('/admin/dashboard');
      } else {
        setError(result.error || '올바르지 않은 관리자 코드입니다.');
      }
    } catch (err) {
      console.error('Admin verification error:', err);
      setError('서버 오류가 발생했습니다.');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-primary text-2xl font-bold">
              관리자 로그인
            </CardTitle>
            <CardDescription className="text-center">
              관리자 코드를 입력해주세요
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-3">
                <label className="text-lg font-semibold text-primary block mb-2">
                  관리자 코드
                </label>
                <Input
                  type="password"
                  placeholder="코드를 입력하세요"
                  value={adminCode}
                  onChange={(e) => setAdminCode(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-3 pt-6">
                <Button
                  type="submit"
                  className="w-full h-12 text-lg"
                  disabled={isLoading}
                >
                  로그인
                </Button>
              </div>
            </form>

            <div className="text-center pt-6">
              <Link href="/">
                <Button variant="ghost" className="text-base">
                  시작 페이지로 돌아가기
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
