'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
import { ListSkeleton } from '@/components/ui/loading';
import { Input } from '@/components/ui/input';
import { Home, Edit3, Check, X, Settings } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type {
  GlobalSettingsResponse,
  UpdateGlobalSettingsRequest,
} from '@/types/admin';

interface SlotStatus {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  max_participants?: number; // 옵셔널로 변경
  current_participants: number;
  available_spots?: number; // 옵셔널로 변경
}

interface Registration {
  id: string;
  name: string;
  parish: string;
  phone_last_4: string;
  created_at: string;
}

interface AdminStats {
  totalRegistrations: number;
  totalUsers: number;
  todayRegistrations: number;
  parishStats: Record<string, number>;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date(2025, 8, 8) // 2025년 9월 9일 (첫 번째 선택 가능한 월요일)
  );
  const [slots, setSlots] = useState<SlotStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [detailDialog, setDetailDialog] = useState<{
    open: boolean;
    slot?: SlotStatus;
    registrations?: Registration[];
  }>({ open: false });
  const [scrollPosition, setScrollPosition] = useState(0);

  // 글로벌 설정 관련 state
  const [globalMaxParticipants, setGlobalMaxParticipants] = useState<number>(0);
  const [isEditingGlobal, setIsEditingGlobal] = useState(false);
  const [globalEditValue, setGlobalEditValue] = useState<string>('');
  const [isGlobalLoading, setIsGlobalLoading] = useState(false);

  useEffect(() => {
    // 관리자 토큰 확인
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) {
      router.push('/admin');
      return;
    }
  }, [router]);

  // 다이얼로그 닫힐 때 스크롤 위치 복원
  useEffect(() => {
    if (!detailDialog.open && scrollPosition > 0) {
      const timer = setTimeout(() => {
        window.scrollTo(0, scrollPosition);
      }, 0);

      return () => clearTimeout(timer);
    }
  }, [detailDialog.open, scrollPosition]);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats');
      if (!response.ok) {
        throw new Error('통계 정보를 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  // 글로벌 설정 조회
  const fetchGlobalSettings = async () => {
    try {
      const response = await fetch('/api/admin/global-settings');
      if (!response.ok) {
        throw new Error('글로벌 설정을 불러오는데 실패했습니다.');
      }

      const data: GlobalSettingsResponse = await response.json();
      setGlobalMaxParticipants(data.maxParticipants);
      setGlobalEditValue(data.maxParticipants.toString());
    } catch (err) {
      console.error('Error fetching global settings:', err);
      setError('글로벌 설정을 불러오는데 실패했습니다.');
    }
  };

  // 글로벌 설정 편집 시작
  const handleEditGlobalSettings = () => {
    setIsEditingGlobal(true);
    setGlobalEditValue(globalMaxParticipants.toString());
  };

  // 글로벌 설정 저장
  const handleSaveGlobalSettings = async () => {
    const newMaxParticipants = parseInt(globalEditValue);

    if (isNaN(newMaxParticipants) || newMaxParticipants < 1) {
      setError('유효한 숫자를 입력해주세요. (1 이상)');
      return;
    }

    setIsGlobalLoading(true);
    try {
      const requestBody: UpdateGlobalSettingsRequest = {
        maxParticipants: newMaxParticipants,
      };

      const response = await fetch('/api/admin/global-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '설정 수정에 실패했습니다.');
      }

      const result = await response.json();
      setGlobalMaxParticipants(result.maxParticipants);
      setIsEditingGlobal(false);
      setError('');

      // 슬롯 목록 새로고침
      if (selectedDate) {
        await fetchSlots(selectedDate);
      }
    } catch (err) {
      console.error('Error updating global settings:', err);
      setError(
        err instanceof Error ? err.message : '설정 수정에 실패했습니다.'
      );
    } finally {
      setIsGlobalLoading(false);
    }
  };

  // 글로벌 설정 편집 취소
  const handleCancelGlobalEdit = () => {
    setIsEditingGlobal(false);
    setGlobalEditValue(globalMaxParticipants.toString());
    setError('');
  };

  const fetchSlots = useCallback(async (date: Date) => {
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
  }, []);

  const fetchSlotDetails = async (slot: SlotStatus) => {
    // 현재 스크롤 위치 저장
    setScrollPosition(window.pageYOffset || document.documentElement.scrollTop);

    try {
      // user_registrations 뷰를 사용하여 더 간단하게 조회
      const { data, error } = await supabase
        .from('user_registrations')
        .select('id, name, parish, phone_last_4, created_at')
        .eq('slot_id', slot.id)
        .order('created_at');

      if (error) {
        throw error;
      }

      const registrations =
        data?.map((reg) => ({
          id: reg.id,
          name: reg.name || '',
          parish: reg.parish || '',
          phone_last_4: reg.phone_last_4 || '',
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
    }
  };

  useEffect(() => {
    if (selectedDate) {
      fetchSlots(selectedDate);
    }

    // 통계 데이터 가져오기
    fetchStats();

    // 글로벌 설정 가져오기
    fetchGlobalSettings();
  }, [selectedDate, fetchSlots]);

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
        <h1 className="text-3xl font-bold text-primary">관리자 대시보드</h1>
        <p className="text-lg text-muted-foreground mt-2">
          기도 시간 신청 현황을 확인하세요.
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 총 신청 건수 */}
      <div className="mb-8 text-center">
        <div className="bg-card p-6 rounded-lg border inline-block">
          <h3 className="text-lg font-medium text-muted-foreground mb-2">
            현재 총 신청 건수
          </h3>
          <p className="text-4xl font-bold text-primary">
            {stats ? `${stats.totalRegistrations}` : '-'}건
          </p>
        </div>
      </div>

      {/* 글로벌 설정 섹션 */}
      <div className="mb-8">
        <div className="max-w-md mx-auto">
          <div className="bg-card p-6 rounded-lg border">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold text-primary">
                전체 최대 신청인원 설정
              </h3>
            </div>

            {isEditingGlobal ? (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="1"
                  value={globalEditValue}
                  onChange={(e) => setGlobalEditValue(e.target.value)}
                  className="w-20 text-center"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSaveGlobalSettings();
                    } else if (e.key === 'Escape') {
                      handleCancelGlobalEdit();
                    }
                  }}
                  autoFocus
                  disabled={isGlobalLoading}
                />
                <span className="text-muted-foreground">명</span>
                <div className="flex gap-1 ml-auto">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={handleSaveGlobalSettings}
                    disabled={isGlobalLoading}
                  >
                    <Check className="h-4 w-4 text-green-600" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={handleCancelGlobalEdit}
                    disabled={isGlobalLoading}
                  >
                    <X className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-primary">
                    {globalMaxParticipants < 1 ? '-' : globalMaxParticipants}
                  </span>
                  <span className="text-muted-foreground">명</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleEditGlobalSettings}
                  className="flex items-center gap-1"
                  disabled={isGlobalLoading}
                >
                  <Edit3 className="h-4 w-4" />
                  수정
                </Button>
              </div>
            )}

            <p className="text-sm text-muted-foreground mt-3">
              모든 시간대에 적용되는 최대 신청인원입니다.
            </p>
          </div>
        </div>
      </div>

      {/* 캘린더 섹션 */}
      <div className="mb-8">
        <div className="flex justify-center">
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            disabled={(date) => !isSelectableDate(date)}
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

      {/* 시간대 현황 섹션 */}
      {selectedDate && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-center mb-6">
            {selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일 시간대
            현황
          </h2>

          {isLoading ? (
            <ListSkeleton />
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
                    <Badge
                      variant={
                        slot.current_participants === 0
                          ? 'secondary'
                          : slot.current_participants >=
                            (slot.max_participants || globalMaxParticipants)
                          ? 'destructive'
                          : 'default'
                      }
                    >
                      신청인원 {slot.current_participants}/
                      {slot.max_participants || globalMaxParticipants}명
                    </Badge>
                  </div>
                  <div className="w-32 flex justify-end">
                    <Button
                      variant="outline"
                      className="h-10 px-6"
                      onClick={() => fetchSlotDetails(slot)}
                      disabled={isLoading}
                    >
                      확인
                    </Button>
                  </div>
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
