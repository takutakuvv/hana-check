'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

type Status = 'idle' | 'checking' | 'clean' | 'dirty' | 'error'
type Lang = 'ja' | 'en'

const STATUS_UI: Record<Lang, Record<Status, { emoji: string; message: string; color: string; bg: string }>> = {
  ja: {
    idle:     { emoji: '', message: 'ボタンを押してチェック', color: 'text-gray-300', bg: 'bg-gray-900' },
    checking: { emoji: '🔍', message: 'チェック中...', color: 'text-yellow-300', bg: 'bg-gray-900' },
    clean:    { emoji: '✅', message: '大丈夫です！', color: 'text-green-400', bg: 'bg-green-950' },
    dirty:    { emoji: '😱', message: 'ついてます！', color: 'text-red-400', bg: 'bg-red-950' },
    error:    { emoji: '⚠️', message: 'エラーが発生しました', color: 'text-orange-400', bg: 'bg-gray-900' },
  },
  en: {
    idle:     { emoji: '', message: 'Tap the button to check', color: 'text-gray-300', bg: 'bg-gray-900' },
    checking: { emoji: '🔍', message: 'Checking...', color: 'text-yellow-300', bg: 'bg-gray-900' },
    clean:    { emoji: '✅', message: "You're good!", color: 'text-green-400', bg: 'bg-green-950' },
    dirty:    { emoji: '😱', message: 'You got one!', color: 'text-red-400', bg: 'bg-red-950' },
    error:    { emoji: '⚠️', message: 'An error occurred', color: 'text-orange-400', bg: 'bg-gray-900' },
  },
}

const T = {
  ja: {
    subtitle: '鼻くそチェッカー',
    checkBtn: 'チェック開始',
    retryBtn: 'もう一度確認',
    stopBtn: '終了',
    lowConfidence: '確度低め — もう一度試してみてください',
  },
  en: {
    subtitle: 'Booger Checker',
    checkBtn: 'Start Check',
    retryBtn: 'Check Again',
    stopBtn: 'Done',
    lowConfidence: 'Low confidence — please try again',
  },
}

export default function Home() {
  const [lang, setLang] = useState<Lang>('ja')
  const [status, setStatus] = useState<Status>('idle')
  const [confidence, setConfidence] = useState<'high' | 'low' | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const t = T[lang]
  const ui = STATUS_UI[lang][status]
  const isDone = status === 'clean' || status === 'dirty' || status === 'error'

  const captureAndCheck = useCallback(async () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || video.readyState < 2) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.drawImage(video, 0, 0)
    const image = canvas.toDataURL('image/jpeg', 0.7)

    setStatus('checking')
    try {
      const res = await fetch('/api/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image, lang }),
      })
      const data = await res.json()
      setConfidence(data.confidence ?? null)
      setStatus(data.visible ? 'dirty' : 'clean')
    } catch {
      setStatus('error')
    }
  }, [lang])

  const handleCheck = useCallback(async () => {
    setConfidence(null)
    if (!streamRef.current) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        })
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play()
        }
        setTimeout(captureAndCheck, 1000)
      } catch {
        setStatus('error')
      }
    } else {
      await captureAndCheck()
    }
  }, [captureAndCheck])

  const handleStop = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    setStatus('idle')
    setConfidence(null)
  }, [])

  useEffect(() => {
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
    }
  }, [])

  return (
    <div className="h-full flex flex-col bg-gray-950 text-white sm:items-center sm:justify-center">
      <div className="w-full h-full flex flex-col sm:max-w-sm sm:h-[85vh] sm:rounded-3xl sm:overflow-hidden sm:shadow-2xl sm:border sm:border-gray-800">

        {/* ヘッダー */}
        <header className="flex-shrink-0 px-5 pt-8 pb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-indigo-400 tracking-tight">HanaCheck</h1>
            <p className="text-xs text-gray-500 mt-0.5">{t.subtitle}</p>
          </div>
          <div className="flex items-center bg-gray-800 rounded-lg overflow-hidden">
            {(['ja', 'en'] as const).map(l => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-2.5 py-1 text-xs font-bold transition-colors ${
                  lang === l ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-white'
                }`}
              >
                {l === 'ja' ? 'JP' : 'EN'}
              </button>
            ))}
          </div>
        </header>

        {/* 非表示カメラ */}
        <video ref={videoRef} className="hidden" autoPlay playsInline muted />
        <canvas ref={canvasRef} className="hidden" />

        {/* 結果表示エリア */}
        <div className={`flex-1 mx-5 rounded-3xl border border-gray-800 flex flex-col items-center justify-center gap-5 transition-colors ${ui.bg}`}>
          {ui.emoji && <p className="text-5xl">{ui.emoji}</p>}
          <p className={`text-2xl font-bold ${ui.color}`}>{ui.message}</p>
          {confidence === 'low' && isDone && (
            <p className="text-sm text-gray-500">{t.lowConfidence}</p>
          )}
          {status === 'checking' && (
            <div className="flex gap-2">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-2.5 h-2.5 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          )}
        </div>

        {/* ボタンエリア */}
        <div className="flex-shrink-0 px-5 pb-10 pt-5 flex flex-col gap-3">
          {!isDone ? (
            <button
              onClick={handleCheck}
              disabled={status === 'checking'}
              className="w-full py-5 rounded-2xl font-bold text-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white shadow-lg shadow-indigo-900 transition-all disabled:opacity-50"
            >
              {t.checkBtn}
            </button>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={handleCheck}
                className="flex-1 py-5 rounded-2xl font-bold text-lg bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white transition-all"
              >
                {t.retryBtn}
              </button>
              <button
                onClick={handleStop}
                className="flex-1 py-5 rounded-2xl font-bold text-lg bg-gray-800 hover:bg-gray-700 active:bg-gray-600 text-gray-300 transition-all"
              >
                {t.stopBtn}
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
