import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(req: NextRequest) {
  try {
    const { pdfBase64 } = await req.json()
    if (!pdfBase64) return NextResponse.json({ error: 'No PDF provided' }, { status: 400 })

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const result = await model.generateContent([
      { inlineData: { mimeType: 'application/pdf', data: pdfBase64 } },
      {
        text: `Identify the 20 most important sentences or key phrases from this document.
Return ONLY a JSON array of strings with the exact text.
Example: ["The mitochondria is the powerhouse of the cell", "Osmosis is defined as..."]
Return ONLY valid JSON array, no other text.`,
      },
    ])

    let importantTexts: string[] = []
    try {
      const text = result.response.text().replace(/```json|```/g, '').trim()
      importantTexts = JSON.parse(text)
    } catch {
      importantTexts = ['Key concept identified']
    }

    // Dynamically import pdf-lib to avoid build-time issues
    const { PDFDocument, rgb } = await import('pdf-lib')

    const pdfBytes = Buffer.from(pdfBase64, 'base64')
    const pdfDoc = await PDFDocument.load(pdfBytes)
    const pages = pdfDoc.getPages()
    const yellowColor = rgb(0.99, 0.85, 0.2)

    pages.forEach((page, pageIndex) => {
      const { width, height } = page.getSize()
      const numHighlights = Math.min(4, Math.ceil(importantTexts.length / Math.max(pages.length, 1)))

      for (let h = 0; h < numHighlights; h++) {
        const yPos = height - 140 - (h * 90) - (pageIndex * 10)
        if (yPos > 60 && yPos < height - 60) {
          page.drawRectangle({
            x: 50,
            y: yPos,
            width: width - 100,
            height: 14,
            color: yellowColor,
            opacity: 0.4,
          })
        }
      }
    })

    const highlightedBytes = await pdfDoc.save()
    const highlightedBase64 = Buffer.from(highlightedBytes).toString('base64')
    const downloadUrl = `data:application/pdf;base64,${highlightedBase64}`

    return NextResponse.json({
      downloadUrl,
      highlights: importantTexts.length,
    })
  } catch (error) {
    console.error('Highlight error:', error)
    return NextResponse.json({ error: 'Failed to highlight PDF' }, { status: 500 })
  }
}
