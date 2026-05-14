import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { checkRateLimit } from '@/lib/rateLimit'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'too_many_requests' }, { status: 429 })
  }

  const { image, lang = 'ja' } = await req.json()
  if (!image) {
    return NextResponse.json({ error: 'no_image' }, { status: 400 })
  }

  const base64 = image.replace(/^data:image\/\w+;base64,/, '')

  const prompt = lang === 'en'
    ? `Look at the person's nose in this image and determine if there is any visible booger (nasal debris or dark spots inside the nostril).

Reply ONLY in the following JSON format (no explanation):
{"visible": true or false, "confidence": "high" or "low"}

If the nose is not visible or cannot be determined, return {"visible": false, "confidence": "low"}.`
    : `この画像に写っている人物の鼻の中を観察してください。鼻くそ（鼻腔内の汚れや黒ずみ）が見えているかどうか判定してください。

以下のJSON形式のみで返答してください（説明文不要）：
{"visible": true または false, "confidence": "high" または "low"}

鼻が見えない・判定できない場合は {"visible": false, "confidence": "low"} を返してください。`

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 128,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: { type: 'base64', media_type: 'image/jpeg', data: base64 },
        },
        { type: 'text', text: prompt },
      ],
    }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) return NextResponse.json({ visible: false, confidence: 'low' })

  try {
    return NextResponse.json(JSON.parse(match[0]))
  } catch {
    return NextResponse.json({ visible: false, confidence: 'low' })
  }
}
