'use client';

import { useEffect, useRef } from 'react';
import Lottie from 'lottie-react';
import animationData from '../../../public/AutumnLeaves.json';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

export function Loading({
  size = 'md',
  fullScreen = false,
  className = '',
}: LoadingProps) {
  const lottieRef = useRef<{
    setSpeed: (speed: number) => void;
  } | null>(null);

  const sizeClasses = {
    sm: 'w-20 h-20',
    md: 'w-32 h-32',
    lg: 'w-48 h-48',
  };

  useEffect(() => {
    if (lottieRef.current) {
      lottieRef.current.setSpeed(1.2); // 조금 더 빠르게
    }
  }, []);

  const loadingContent = (
    <div
      className={`flex flex-col items-center justify-center space-y-4 ${className}`}
    >
      <div
        className={`${sizeClasses[size]} relative flex items-center justify-center overflow-hidden`}
      >
        <Lottie
          lottieRef={lottieRef}
          animationData={animationData}
          loop={true}
          autoplay={true}
          rendererSettings={{
            preserveAspectRatio: 'xMidYMid slice',
          }}
          style={{
            width: '100%',
            height: '100%',
            filter: 'hue-rotate(10deg) saturate(1.2)', // 가을 느낌 강화
          }}
          onLoadedImages={() => {
            console.log('Lottie animation loaded');
          }}
          onError={(error) => {
            console.error('Lottie error:', error);
          }}
        />
        {/* 폴백 애니메이션 */}
        <div className="absolute inset-0 flex items-center justify-center text-orange-600 animate-bounce">
          <div
            className="text-4xl animate-spin"
            style={{ animationDuration: '3s' }}
          >
            🍂
          </div>
        </div>
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
        {loadingContent}
      </div>
    );
  }

  return loadingContent;
}

// 페이지 로딩용 컴포넌트
export function PageLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loading size="lg" />
    </div>
  );
}

// 인라인 로딩용 컴포넌트
export function InlineLoading() {
  return (
    <div className="flex items-center justify-center py-8">
      <Loading size="sm" />
    </div>
  );
}

// 버튼 내부 로딩용 컴포넌트
export function ButtonLoading() {
  return (
    <div className="flex items-center space-x-2">
      <div className="w-5 h-5 flex items-center justify-center">
        {animationData ? (
          <Lottie
            animationData={animationData}
            loop={true}
            autoplay={true}
            style={{
              width: '100%',
              height: '100%',
              filter: 'brightness(0) invert(1)', // 버튼 텍스트 색에 맞춤
            }}
          />
        ) : (
          <div className="animate-spin text-current">🍂</div>
        )}
      </div>
    </div>
  );
}

// 리스트 스켈레톤 로딩 컴포넌트
export function ListSkeleton({
  count = 3,
  className = '',
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="flex items-center p-4 border rounded-lg bg-background animate-pulse"
        >
          {/* 시간 영역 스켈레톤 */}
          <div className="w-35 flex-shrink-0">
            <div className="h-5 bg-gray-200 rounded w-24"></div>
          </div>

          {/* 중앙 배지 영역 스켈레톤 */}
          <div className="flex-1 flex justify-center pr-2">
            <div className="h-6 bg-gray-200 rounded-full w-20"></div>
          </div>

          {/* 버튼 영역 스켈레톤 */}
          <div className="w-32 flex justify-end">
            <div className="h-10 bg-gray-200 rounded w-20"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

// 시간대 선택 전용 스켈레톤
export function TimeSlotSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="space-y-3 max-w-4xl mx-auto">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="flex items-center p-4 border rounded-lg bg-background hover:bg-accent/50 transition-colors animate-pulse"
        >
          {/* 시간 표시 스켈레톤 */}
          <div className="font-medium text-lg w-35 flex-shrink-0">
            <div className="h-6 bg-gray-200 rounded w-28"></div>
          </div>

          {/* 신청인원 배지 스켈레톤 */}
          <div className="flex-1 flex justify-center pr-2">
            <div className="h-6 bg-gray-200 rounded-full w-24 px-3 py-1"></div>
          </div>

          {/* 신청하기 버튼 스켈레톤 */}
          <div className="w-32 flex justify-end">
            <div className="h-10 bg-gray-200 rounded w-20 px-6"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
