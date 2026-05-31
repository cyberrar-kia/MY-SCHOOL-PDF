import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(req: NextRequest) {
  try {
    const { pdfBase64 } = await req.json()
    if (!pdfBase64) return NextResponse.json({ error: 'No PDF provided' }, { status: 400 })

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: 'application/pdf',
          data: pdfBase64,
        },
      },
      {
        text: `Analyze this PDF document and provide a comprehensive, well-structured summary.

Format your response clearly with:
- An overall introduction (2-3 sentences about what the document covers)
- Chapter or Topic breakdowns (use the actual chapter/topic names from the document)
- Under each section: key concepts, important definitions, and main points in bullet points
- A brief conclusion noting what the student should take away

Be specific, educational, and thorough. Use clear headings for each section. If it's a past question paper, summarize the topics covered and question patterns instead.`,
      },
    ])

    const summary = result.response.text()
    return NextResponse.json({ summary })
  } catch (error) {
    console.error('Gemini analyze error:', error)
    return NextResponse.json({ error: 'Failed to analyze PDF' }, { status: 500 })
  }
}
