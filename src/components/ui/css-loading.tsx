'use client';

interface CSSLoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

export function CSSLoading({
  size = 'md',
  text = '로딩 중...',
  fullScreen = false,
  className = '',
}: CSSLoadingProps) {
  const sizeClasses = {
    sm: 'w-20 h-20',
    md: 'w-32 h-32',
    lg: 'w-48 h-48',
  };

  const leafSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
  };

  const loadingContent = (
    <div
      className={`flex flex-col items-center justify-center space-y-4 ${className}`}
    >
      <div
        className={`${sizeClasses[size]} relative bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg flex items-center justify-center overflow-hidden`}
      >
        {/* 여러 개의 떨어지는 잎사귀 */}
        {/* 떨어지는 잎사귀 애니메이션 */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-full h-full">
            <div
              className={`absolute animate-bounce ${leafSizes[size]}`}
              style={{
                left: '10%',
                animationDelay: '0s',
                animationDuration: '2s',
              }}
            >
              🍂
            </div>
            <div
              className={`absolute animate-pulse ${leafSizes[size]}`}
              style={{
                left: '30%',
                animationDelay: '0.5s',
                animationDuration: '2.5s',
              }}
            >
              🍁
            </div>
            <div
              className={`absolute animate-bounce ${leafSizes[size]}`}
              style={{
                left: '50%',
                animationDelay: '1s',
                animationDuration: '3s',
              }}
            >
              🍂
            </div>
            <div
              className={`absolute animate-spin ${leafSizes[size]}`}
              style={{
                left: '70%',
                animationDelay: '1.5s',
                animationDuration: '4s',
              }}
            >
              🍁
            </div>
            <div
              className={`absolute animate-ping ${leafSizes[size]}`}
              style={{
                left: '90%',
                animationDelay: '2s',
                animationDuration: '3.5s',
              }}
            >
              🍂
            </div>
          </div>
        </div>
      </div>
      {text && (
        <p className="text-muted-foreground text-sm font-medium animate-pulse">
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-background rounded-lg border shadow-lg p-8">
          {loadingContent}
        </div>
      </div>
    );
  }

  return loadingContent;
}

// 페이지 로딩용 컴포넌트
export function CSSPageLoading({
  text = '페이지를 불러오는 중...',
}: {
  text?: string;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <CSSLoading size="lg" text={text} />
    </div>
  );
}

// 인라인 로딩용 컴포넌트
export function CSSInlineLoading({
  text = '불러오는 중...',
}: {
  text?: string;
}) {
  return (
    <div className="flex items-center justify-center py-8">
      <CSSLoading size="sm" text={text} />
    </div>
  );
}

// 버튼 내부 로딩용 컴포넌트
export function CSSButtonLoading() {
  return (
    <div className="flex items-center space-x-2">
      <div className="w-5 h-5 flex items-center justify-center">
        <div className="animate-spin text-current text-sm">🍂</div>
      </div>
      <span>처리 중...</span>
    </div>
  );
}
