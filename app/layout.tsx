import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'HanaCheck｜鼻くそチェッカー',
  description: 'カメラに顔を映すだけで、鼻くそがついているか自動でチェックしてくれるアプリ。',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className="h-full">
      <body className="h-full bg-gray-950">{children}</body>
    </html>
  )
}
