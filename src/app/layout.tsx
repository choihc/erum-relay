import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: '가을, 기도로 수놓다',
  description: '7 to 7 성전 중보기도',
  openGraph: {
    title: '가을, 기도로 수놓다',
    description: '7 to 7 성전 중보기도',
    images: [
      {
        url: '/ogtag_image.png',
        width: 1200,
        height: 630,
        alt: '가을, 기도로 수놓다',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '가을, 기도로 수놓다',
    description: '7 to 7 성전 중보기도',
    images: ['/ogtag_image.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background font-sans`}
      >
        <div className="flex min-h-screen flex-col">
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
