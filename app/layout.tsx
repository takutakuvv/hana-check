import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'HanaCheck｜鼻くそチェッカー',
  description: 'カメラに顔を映すだけで、鼻くそがついているか自動でチェックしてくれるアプリ。',
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className="h-full">
      <head>
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2913908713051662" crossOrigin="anonymous" />
      </head>
      <body className="h-full bg-gray-950">{children}</body>
    </html>
  )
}
