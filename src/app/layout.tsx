import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#6C5CE7',
};

export const metadata: Metadata = {
  title: '好奇小博士 Dr. Curious — 台灣兒童 AI 百科',
  description:
    '專為台灣 5-10 歲孩童設計的繁體中文語音 AI 百科！用長按說話的方式，讓好奇博士用台灣口音回答每一個「為什麼」。支援注音標註。',
  keywords: ['兒童AI', '百科', '注音', '台灣', '語音助手', '好奇小博士', '教育', '繁體中文'],
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '好奇小博士',
  },
  openGraph: {
    title: '好奇小博士 — 台灣兒童 AI 百科',
    description: '專為台灣 5-10 歲孩童設計的繁體中文語音 AI 百科，支援注音標註',
    locale: 'zh_TW',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
