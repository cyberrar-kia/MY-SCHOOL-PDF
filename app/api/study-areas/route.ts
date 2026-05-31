import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(req: NextRequest) {
  try {
    const { pdfBase64 } = await req.json()
    if (!pdfBase64) return NextResponse.json({ error: 'No PDF provided' }, { status: 400 })

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const result = await model.generateContent([
      { inlineData: { mimeType: 'application/pdf', data: pdfBase64 } },
      {
        text: `Analyze this PDF and identify the most important study areas and concepts a student must master.

Return ONLY a JSON array of strings. Each string should be a specific, actionable study area.
Example format: ["Topic: Definition and importance of X", "Concept: How Y works and its applications", ...]

Include 15-20 specific study areas. Be specific, not generic. Reference actual content from the document.
Return ONLY valid JSON, no other text.`,
      },
    ])

    const text = result.response.text()
    const clean = text.replace(/```json|```/g, '').trim()

    let areas: string[] = []
    try {
      areas = JSON.parse(clean)
    } catch {
      // fallback: split by newlines
      areas = text.split('\n').filter(l => l.trim().length > 10).slice(0, 20)
    }

    return NextResponse.json({ areas })
  } catch (error) {
    console.error('Study areas error:', error)
    return NextResponse.json({ error: 'Failed to identify study areas' }, { status: 500 })
  }
}
