'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

import { DayPicker } from 'react-day-picker';

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
import { TimeSlotSkeleton } from '@/components/ui/loading';
import { Home } from 'lucide-react';

interface SlotStatus {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  max_participants?: number; // 옵셔널로 변경
  current_participants: number;
  available_spots?: number; // 옵셔널로 변경
}

export default function ApplyPage() {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<{
    name: string;
    parish: string;
    phone_last_4: string;
    userId?: string;
  } | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date(2025, 8, 8) // 2025년 9월 8일 (첫 번째 선택 가능한 월요일)
  );
  const [slots, setSlots] = useState<SlotStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    slot?: SlotStatus;
  }>({ open: false });

  useEffect(() => {
    // localStorage에서 사용자 정보 가져오기
    const savedUserInfo = localStorage.getItem('userInfo');
    if (!savedUserInfo) {
      router.push('/register');
      return;
    }
    setUserInfo(JSON.parse(savedUserInfo));
  }, [router]);

  useEffect(() => {
    if (selectedDate) {
      fetchSlots(selectedDate);
    }
  }, [selectedDate]);

  const fetchSlots = async (date: Date) => {
    setIsLoading(true);
    setError('');

    try {
      // 로컬 시간으로 날짜 문자열 생성 (시간대 이슈 방지)
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      console.log('Fetching slots for date:', dateStr); // 디버깅용

      // API 엔드포인트 사용 (자동 시간대 생성 기능 포함)
      const response = await fetch(`/api/slots?date=${dateStr}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || '시간대 정보를 불러오는데 실패했습니다.'
        );
      }

      const result = await response.json();
      setSlots(result.slots || []);
    } catch (err) {
      console.error('Error fetching slots:', err);
      setError(
        err instanceof Error
          ? err.message
          : '시간대 정보를 불러오는데 실패했습니다.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = async (slot: SlotStatus) => {
    if (!userInfo) return;

    setError('');

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userInfo,
          slotId: slot.id,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '신청에 실패했습니다.');
      }

      // 성공 시 신청 완료 페이지로 이동
      localStorage.setItem(
        'lastRegistration',
        JSON.stringify({
          name: userInfo.name,
          date: slot.date,
          startTime: slot.start_time,
          endTime: slot.end_time,
        })
      );
      router.push('/apply/success');
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : '신청에 실패했습니다.');
    } finally {
      setConfirmDialog({ open: false });
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00'); // 시간대 이슈 방지
    return `${date.getMonth() + 1}월 ${date.getDate()}일`;
  };

  const formatTime = (timeStr: string) => {
    return timeStr.substring(0, 5);
  };

  // 9월 8일~26일 평일만 선택 가능하도록 필터링
  const isSelectableDate = (date: Date) => {
    const day = date.getDay();
    const isWeekday = day >= 1 && day <= 5; // 월요일(1) ~ 금요일(5)

    // 9월 8일~26일 범위 체크
    const year = date.getFullYear();
    const month = date.getMonth();
    const dateNum = date.getDate();

    const isInRange =
      year === 2025 && month === 8 && dateNum >= 8 && dateNum <= 26; // 9월은 0-based로 8

    return isWeekday && isInRange;
  };

  if (!userInfo) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl relative">
      {/* Floating Home Button */}
      <Link href="/" className="absolute top-4 left-4 z-10">
        <Button variant="outline" size="sm" className="h-8 w-8 p-0 shadow-md">
          <Home className="h-4 w-4" />
        </Button>
      </Link>

      {/* 헤더 */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2">기도 시간 신청</h1>
        <p className="text-lg text-muted-foreground mb-2">
          원하시는 날짜와 시간을 선택해주세요
        </p>
        <p className="text-sm text-orange-600 font-medium mb-1">
          ※ 각 시간대별 최대 3명까지 신청 가능합니다
        </p>
        <p className="text-sm text-muted-foreground">
          신청 가능 기간: 9월 8일 ~ 26일 (매주 월~금)
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 캘린더 섹션 */}
      <div className="mb-8">
        <div className="flex justify-center">
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={(date) => {
              setSelectedDate(date);
            }}
            disabled={(date) => !isSelectableDate(date)}
            startMonth={new Date(2025, 8)} // 2025년 9월 (0-based)
            endMonth={new Date(2025, 8)} // 2025년 9월만
            defaultMonth={new Date(2025, 8)} // 기본으로 9월 표시
            showOutsideDays={false}
            fixedWeeks={false}
            numberOfMonths={1}
            modifiers={{
              selected: selectedDate || undefined,
              available: (date) =>
                isSelectableDate(date) &&
                selectedDate?.toDateString() !== date.toDateString(),
            }}
            modifiersClassNames={{
              selected: 'bg-orange-600 text-white !font-bold shadow-xl',
              available:
                'bg-orange-50 border-orange-200 text-orange-700 font-medium hover:bg-orange-100',
            }}
            className="rounded-md border p-6 bg-background shadow-sm [&_.rdp-disabled]:!text-gray-400 [&_.rdp-disabled]:!bg-gray-100 [&_.rdp-disabled]:opacity-50 [&_.rdp-disabled]:cursor-not-allowed [&_.rdp-day_button]:w-full [&_.rdp-day_button]:h-full [&_.rdp-day_button]:p-3 [&_.rdp-day_button]:min-h-[48px]"
            classNames={{
              months:
                'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
              month: 'space-y-4',
              caption: 'flex justify-center pt-1 relative items-center',
              caption_label: 'text-lg font-semibold text-primary',
              nav: 'hidden',
              table: 'w-full border-collapse space-y-1',
              head_row: 'flex',
              head_cell:
                'text-muted-foreground rounded-md w-12 font-normal text-sm text-center',
              row: 'flex w-full mt-2',
              cell: 'text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20',
              day: 'h-12 w-12 p-0 font-normal hover:bg-accent hover:text-accent-foreground rounded-md transition-colors text-center',
              day_selected:
                'bg-primary text-primary-foreground hover:bg-primary focus:bg-primary',
              day_today: 'bg-accent text-accent-foreground font-semibold',
              day_outside: 'hidden',

              day_range_middle:
                'aria-selected:bg-accent aria-selected:text-accent-foreground',
              day_hidden: 'invisible',
            }}
            formatters={{
              formatWeekdayName: (day: Date) => {
                const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
                return weekdays[day.getDay()];
              },
            }}
            components={{
              MonthCaption: () => (
                <div className="flex justify-center items-center py-2">
                  <h3 className="text-lg font-semibold text-primary">
                    7 to 7 성전 중보기도
                  </h3>
                </div>
              ),
            }}
          />
        </div>
      </div>

      {/* 시간대 선택 섹션 */}
      {selectedDate && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-center mb-6">
            {selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일 시간대
            선택
          </h2>

          {isLoading ? (
            <TimeSlotSkeleton count={12} />
          ) : slots.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              해당 날짜에 이용 가능한 시간대가 없습니다.
            </div>
          ) : (
            <div className="space-y-3 max-w-4xl mx-auto">
              {slots.map((slot) => (
                <div
                  key={slot.id}
                  className="flex items-center p-4 border rounded-lg bg-background hover:bg-accent/50 transition-colors"
                >
                  <div className="font-medium text-lg w-35 flex-shrink-0">
                    {formatTime(slot.start_time)} ~ {formatTime(slot.end_time)}
                  </div>
                  <div className="flex-1 flex justify-center pr-2">
                    <Badge variant="secondary">
                      신청인원 {slot.current_participants}/3명
                    </Badge>
                  </div>
                  <div className="w-32 flex justify-end">
                    <Button
                      className="h-10 px-4"
                      disabled={isLoading || slot.current_participants >= 3}
                      onClick={() => setConfirmDialog({ open: true, slot })}
                    >
                      {slot.current_participants >= 3 ? '마감' : '신청하기'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="text-center">
        <Link href="/register">
          <Button variant="ghost" className="h-12 px-6 text-base font-medium">
            이전 페이지로 돌아가기
          </Button>
        </Link>
      </div>

      {/* 확인 다이얼로그 */}
      <Dialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ open })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              신청 확인
            </DialogTitle>
            <DialogDescription className="text-base text-muted-foreground">
              {confirmDialog.slot && (
                <>
                  {formatDate(confirmDialog.slot.date)}{' '}
                  {formatTime(confirmDialog.slot.start_time)}~
                  {formatTime(confirmDialog.slot.end_time)}
                  <br />
                  신청하시겠습니까?
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              className="h-12 px-8 text-base font-medium"
              onClick={() => setConfirmDialog({ open: false })}
            >
              취소
            </Button>
            <Button
              className="h-12 px-8 text-base font-medium"
              onClick={() =>
                confirmDialog.slot && handleApply(confirmDialog.slot)
              }
              disabled={isLoading}
            >
              확인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
