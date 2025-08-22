import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8 min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md space-y-6">
        <Card className="text-center">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-primary">
              🍂 9월 가을 릴레이 기도 🍂
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground space-y-2">
              <p>• 평일 오전 7시 ~ 오후 7시</p>
              <p>• 1시간씩 릴레이로 기도</p>
            </div>

            <div className="space-y-3">
              <Link href="/register" className="block">
                <Button className="w-full text-lg py-6" size="lg">
                  시작하기
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* 관리자 버튼 - 우하단 고정 */}
        <div className="fixed bottom-6 right-6">
          <Link href="/admin">
            <Button variant="outline" size="sm" className="text-xs">
              관리자
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
