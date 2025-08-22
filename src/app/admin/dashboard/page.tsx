'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { DayPicker } from 'react-day-picker';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loading } from '@/components/ui/loading';
import { supabase } from '@/lib/supabase';

interface SlotStatus {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  max_participants: number;
  current_participants: number;
  available_spots: number;
}

interface Registration {
  id: string;
  name: string;
  parish: string;
  phone_last_4: string;
  created_at: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date()
  );
  const [slots, setSlots] = useState<SlotStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [detailDialog, setDetailDialog] = useState<{
    open: boolean;
    slot?: SlotStatus;
    registrations?: Registration[];
  }>({ open: false });

  useEffect(() => {
    // 관리자 토큰 확인
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) {
      router.push('/admin');
      return;
    }
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

      const { data, error } = await supabase
        .from('slot_status')
        .select('*')
        .eq('date', dateStr)
        .order('start_time');

      if (error) {
        throw error;
      }

      setSlots(data || []);
    } catch (err) {
      console.error('Error fetching slots:', err);
      setError('시간대 정보를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSlotDetails = async (slot: SlotStatus) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('registrations')
        .select(
          `
          id,
          created_at,
          user:users(name, parish, phone_last_4)
        `
        )
        .eq('slot_id', slot.id)
        .order('created_at');

      if (error) {
        throw error;
      }

      const registrations =
        data?.map((reg: any) => ({
          id: reg.id,
          name: reg.user.name,
          parish: reg.user.parish,
          phone_last_4: reg.user.phone_last_4,
          created_at: reg.created_at,
        })) || [];

      setDetailDialog({
        open: true,
        slot,
        registrations,
      });
    } catch (err) {
      console.error('Error fetching slot details:', err);
      setError('상세 정보를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    router.push('/admin');
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00'); // 시간대 이슈 방지
    return `${date.getMonth() + 1}월 ${date.getDate()}일`;
  };

  const formatTime = (timeStr: string) => {
    return timeStr.substring(0, 5);
  };

  // 평일만 선택 가능하도록 필터링
  const isWeekday = (date: Date) => {
    const day = date.getDay();
    return day >= 1 && day <= 5; // 월요일(1) ~ 금요일(5)
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* 헤더 */}
      <div className="text-center mb-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-primary">관리자 대시보드</h1>
          <Button variant="outline" onClick={handleLogout}>
            로그아웃
          </Button>
        </div>
        <p className="text-lg text-muted-foreground mt-2">
          기도 시간 신청 현황을 확인하세요
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
            onSelect={setSelectedDate}
            disabled={(date) => !isWeekday(date)}
            startMonth={new Date(2025, 8)} // 2025년 9월 (0-based)
            endMonth={new Date(2025, 8)} // 2025년 9월만
            defaultMonth={new Date(2025, 8)} // 기본으로 9월 표시
            showOutsideDays={false}
            fixedWeeks={false}
            numberOfMonths={1}
            modifiers={{
              selected: selectedDate || undefined,
            }}
            modifiersClassNames={{
              selected: 'bg-orange-600 text-white !font-bold  shadow-xl',
            }}
            className="rounded-md border p-6 bg-background shadow-sm"
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
              day_disabled:
                'text-muted-foreground opacity-30 cursor-not-allowed hover:bg-transparent',
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
                    2025년 9월 가을 릴레이 기도
                  </h3>
                </div>
              ),
            }}
          />
        </div>
      </div>

      {/* 시간대 현황 섹션 */}
      {selectedDate && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-center mb-6">
            {selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일 시간대
            현황
          </h2>

          {isLoading ? (
            <Loading />
          ) : slots.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              해당 날짜에 이용 가능한 시간대가 없습니다.
            </div>
          ) : (
            <div className="space-y-3 max-w-2xl mx-auto">
              {slots.map((slot) => (
                <div
                  key={slot.id}
                  className="flex items-center justify-between p-4 border rounded-lg bg-background hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <span className="font-medium text-lg">
                      {formatTime(slot.start_time)} ~{' '}
                      {formatTime(slot.end_time)}
                    </span>
                    <Badge
                      variant={
                        slot.current_participants === 0
                          ? 'secondary'
                          : 'default'
                      }
                    >
                      {slot.current_participants}/{slot.max_participants}명
                    </Badge>
                    {slot.available_spots === 0 && (
                      <Badge variant="destructive">마감</Badge>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    className="h-10 px-6"
                    onClick={() => fetchSlotDetails(slot)}
                    disabled={isLoading}
                  >
                    현황 확인
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 상세 현황 다이얼로그 */}
      <Dialog
        open={detailDialog.open}
        onOpenChange={(open) => setDetailDialog({ open })}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {detailDialog.slot && (
                <>
                  {formatDate(detailDialog.slot.date)}{' '}
                  {formatTime(detailDialog.slot.start_time)}~
                  {formatTime(detailDialog.slot.end_time)} 신청자 현황
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              총 {detailDialog.registrations?.length || 0}명이 신청했습니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {detailDialog.registrations &&
            detailDialog.registrations.length > 0 ? (
              detailDialog.registrations.map((registration, index) => (
                <div
                  key={registration.id}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                >
                  <div className="space-y-1">
                    <div className="font-medium">
                      {index + 1}. {registration.name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {registration.parish} • 뒷4자리:{' '}
                      {registration.phone_last_4}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(registration.created_at).toLocaleString()}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                신청자가 없습니다.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
