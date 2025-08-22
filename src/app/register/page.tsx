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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ButtonLoading } from '@/components/ui/loading';
import { PARISHES } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    parish: '',
    phone_last_4: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (action: 'apply' | 'check') => {
    setError('');
    setIsLoading(true);

    // 입력값 검증
    if (
      !formData.name.trim() ||
      !formData.parish ||
      !formData.phone_last_4.trim()
    ) {
      setError('모든 항목을 입력해주세요.');
      setIsLoading(false);
      return;
    }

    if (
      formData.phone_last_4.length !== 4 ||
      !/^\d{4}$/.test(formData.phone_last_4)
    ) {
      setError('휴대전화 뒷 4자리는 숫자 4자리여야 합니다.');
      setIsLoading(false);
      return;
    }

    try {
      if (action === 'check') {
        // 기존 신청 내역 확인
        const { data: users, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('name', formData.name.trim())
          .eq('parish', formData.parish)
          .eq('phone_last_4', formData.phone_last_4)
          .limit(1);

        if (userError) {
          throw userError;
        }

        if (users && users.length > 0) {
          // 사용자 정보를 localStorage에 저장하고 신청 내역 페이지로 이동
          localStorage.setItem(
            'userInfo',
            JSON.stringify({
              userId: users[0].id,
              ...formData,
            })
          );
          router.push('/my-registrations');
        } else {
          setError('신청 내역이 없습니다.');
        }
      } else {
        // 신청 페이지로 이동 (사용자 정보를 localStorage에 저장)
        localStorage.setItem('userInfo', JSON.stringify(formData));
        router.push('/apply');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-primary text-2xl font-bold">
              신원 입력
            </CardTitle>
            <CardDescription className="text-center">
              신청을 위해 정보를 입력해주세요
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-3">
              <label className="text-lg font-semibold text-primary block mb-2">
                이름
              </label>
              <Input
                placeholder="이름을 입력하세요"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>

            <div className="space-y-3">
              <label className="text-lg font-semibold text-primary block mb-2">
                교구
              </label>
              <Select
                value={formData.parish}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, parish: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="교구를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {PARISHES.map((parish) => (
                    <SelectItem key={parish} value={parish}>
                      {parish}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <label className="text-lg font-semibold text-primary block mb-2">
                휴대전화 뒷 4자리
              </label>
              <Input
                placeholder="휴대전화 뒷 4자리"
                maxLength={4}
                value={formData.phone_last_4}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    phone_last_4: e.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-3 pt-6">
              <Button
                className="w-full h-12 text-lg"
                onClick={() => handleSubmit('apply')}
                disabled={isLoading}
              >
                {isLoading ? <ButtonLoading /> : '신청하기'}
              </Button>
              <Button
                variant="outline"
                className="w-full h-12 text-lg"
                onClick={() => handleSubmit('check')}
                disabled={isLoading}
              >
                나의 신청 확인하기
              </Button>
            </div>

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
