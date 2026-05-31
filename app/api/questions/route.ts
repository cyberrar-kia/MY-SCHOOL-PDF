import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

const prompts: Record<string, string> = {
  multiple_choice: `Generate 15 multiple choice questions from this PDF document.

Format each question exactly like this:
Q1. [Question text]
A) [Option A]
B) [Option B]
C) [Option C]
D) [Option D]
Answer: [Correct letter]
Explanation: [Brief explanation]

---

Make questions varied in difficulty (easy, medium, hard). Cover different topics from the document.`,

  theory: `Generate 10 theory/essay questions from this PDF document.

Format each question like this:
Q1. [Question text]
[Mark allocation if applicable, e.g. (10 marks)]
Hint: [Key points to include in a good answer]

---

Include both short-answer (3-5 marks) and long-answer (10-15 marks) questions. Cover the main topics.`,

  true_false: `Generate 20 true/false questions from this PDF document.

Format each question exactly like this:
Q1. [Statement]
Answer: True / False
Explanation: [Why it is true or false]

---

Make statements clear and unambiguous. Include both true and false answers mixed throughout.`,

  fill_blanks: `Generate 15 fill-in-the-blank questions from this PDF document.

Format each question exactly like this:
Q1. [Sentence with _______ for the blank]
Answer: [Word or phrase that fills the blank]
Context: [Brief context from the document]

---

Use important terms, definitions, and key concepts from the document. Make the blanks meaningful.`,
}

export async function POST(req: NextRequest) {
  try {
    const { pdfBase64, questionType } = await req.json()
    if (!pdfBase64) return NextResponse.json({ error: 'No PDF provided' }, { status: 400 })

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    const prompt = prompts[questionType] || prompts.multiple_choice

    const result = await model.generateContent([
      { inlineData: { mimeType: 'application/pdf', data: pdfBase64 } },
      { text: prompt },
    ])

    const questions = result.response.text()
    return NextResponse.json({ questions })
  } catch (error) {
    console.error('Questions API error:', error)
    return NextResponse.json({ error: 'Failed to generate questions' }, { status: 500 })
  }
}
