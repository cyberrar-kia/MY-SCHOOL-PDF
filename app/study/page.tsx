'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type Tab = 'summary' | 'questions' | 'studyareas' | 'highlight'
type QuestionType = 'multiple_choice' | 'theory' | 'true_false' | 'fill_blanks'

export default function StudyPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('summary')
  const [pdfName, setPdfName] = useState('')
  const [pdfBase64, setPdfBase64] = useState('')
  const [requiresPayment, setRequiresPayment] = useState(false)
  const [paymentDone, setPaymentDone] = useState(false)

  // Tab states
  const [summary, setSummary] = useState('')
  const [summaryLoading, setSummaryLoading] = useState(false)

  const [questions, setQuestions] = useState('')
  const [questionsLoading, setQuestionsLoading] = useState(false)
  const [questionType, setQuestionType] = useState<QuestionType>('multiple_choice')

  const [studyAreas, setStudyAreas] = useState<string[]>([])
  const [studyLoading, setStudyLoading] = useState(false)

  const [highlightUrl, setHighlightUrl] = useState('')
  const [highlightLoading, setHighlightLoading] = useState(false)

  const [error, setError] = useState('')

  useEffect(() => {
    const base64 = sessionStorage.getItem('pdfBase64')
    const name = sessionStorage.getItem('pdfName')
    const reqPayment = sessionStorage.getItem('requiresPayment')
    if (!base64) { router.push('/'); return }
    setPdfBase64(base64)
    setPdfName(name || 'Document.pdf')
    setRequiresPayment(reqPayment === 'true')
  }, [router])

  const payAndContinue = async () => {
    try {
      const res = await fetch('/api/payment/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 150000, currency: 'NGN' }), // ₦1500 in kobo
      })
      const data = await res.json()
      if (data.authorization_url) {
        window.location.href = data.authorization_url
      }
    } catch {
      setError('Payment initialization failed. Please try again.')
    }
  }

  const callAPI = async (endpoint: string, body: object) => {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pdfBase64, ...body }),
    })
    if (!res.ok) throw new Error('API call failed')
    return res.json()
  }

  const generateSummary = async () => {
    setSummaryLoading(true); setError(''); setSummary('')
    try {
      const data = await callAPI('/api/analyze', {})
      setSummary(data.summary)
    } catch { setError('Failed to generate summary. Try again.') }
    setSummaryLoading(false)
  }

  const generateQuestions = async () => {
    setQuestionsLoading(true); setError(''); setQuestions('')
    try {
      const data = await callAPI('/api/questions', { questionType })
      setQuestions(data.questions)
    } catch { setError('Failed to generate questions. Try again.') }
    setQuestionsLoading(false)
  }

  const generateStudyAreas = async () => {
    setStudyLoading(true); setError(''); setStudyAreas([])
    try {
      const data = await callAPI('/api/study-areas', {})
      setStudyAreas(data.areas)
    } catch { setError('Failed to generate study areas. Try again.') }
    setStudyLoading(false)
  }

  const generateHighlight = async () => {
    setHighlightLoading(true); setError(''); setHighlightUrl('')
    try {
      const data = await callAPI('/api/highlight', {})
      setHighlightUrl(data.downloadUrl)
    } catch { setError('Failed to process PDF. Try again.') }
    setHighlightLoading(false)
  }

  const PaymentGate = () => (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="text-4xl mb-4">🔒</div>
      <h3 className="font-serif text-xl text-white mb-2">Weekly Access Required</h3>
      <p className="text-gray-400 text-sm max-w-xs mb-6">
        You've used your free daily upload. Get unlimited access for the week for just ₦1,500.
      </p>
      <button onClick={payAndContinue} className="bg-yellow-400 text-black font-semibold px-8 py-3 text-sm uppercase tracking-wider hover:bg-yellow-300 transition-colors">
        Pay ₦1,500 — Weekly Access
      </button>
      <p className="text-gray-600 text-xs mt-4">Secure payment via Paystack</p>
    </div>
  )

  const Loader = ({ text }: { text: string }) => (
    <div className="flex flex-col items-center gap-3 py-12">
      <div className="w-8 h-8 border-2 border-gray-700 border-t-yellow-400 rounded-full spinner" />
      <p className="text-gray-500 text-sm">{text}</p>
    </div>
  )

  const tabs = [
    { id: 'summary', label: '📝 Summary' },
    { id: 'questions', label: '❓ Questions' },
    { id: 'studyareas', label: '🎯 Study Areas' },
    { id: 'highlight', label: '✨ Highlights' },
  ]

  if (!pdfBase64) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-gray-700 border-t-yellow-400 rounded-full spinner" />
    </div>
  )

  return (
    <main className="min-h-screen max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <div>
          <button onClick={() => router.push('/')} className="text-gray-500 text-sm hover:text-white transition-colors mb-2 flex items-center gap-1">
            ← Upload new PDF
          </button>
          <h2 className="font-serif text-white text-xl font-semibold truncate max-w-xs md:max-w-md">{pdfName}</h2>
        </div>
        <div className="text-xs text-gray-600 border border-gray-800 px-3 py-1">
          {requiresPayment && !paymentDone ? '🔒 Free limit reached' : '✓ Ready to study'}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800 mb-8 overflow-x-auto">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id as Tab)}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${tab === t.id ? 'tab-active' : 'tab-inactive hover:text-gray-300'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {error && <div className="bg-red-900/20 border border-red-800 text-red-400 text-sm px-4 py-3 rounded-sm mb-6">{error}</div>}

      {/* SUMMARY TAB */}
      {tab === 'summary' && (
        <div className="fade-in">
          {requiresPayment && !paymentDone ? <PaymentGate /> : (
            <>
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-serif text-lg text-white">AI Summary</h3>
                <button onClick={generateSummary} disabled={summaryLoading}
                  className="bg-yellow-400 text-black text-xs font-semibold uppercase tracking-wider px-5 py-2 hover:bg-yellow-300 transition-colors disabled:opacity-50">
                  {summaryLoading ? 'Generating...' : 'Generate Summary'}
                </button>
              </div>
              {summaryLoading && <Loader text="Gemini is reading your PDF..." />}
              {summary && (
                <div className="prose prose-invert max-w-none">
                  <div className="bg-gray-900/50 border border-gray-800 rounded-sm p-6 text-gray-300 text-sm leading-relaxed whitespace-pre-wrap fade-in">
                    {summary}
                  </div>
                </div>
              )}
              {!summary && !summaryLoading && (
                <div className="text-center py-16 text-gray-600">
                  <p className="text-4xl mb-3">📝</p>
                  <p>Click Generate Summary to get a topic-by-topic breakdown of your document</p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* QUESTIONS TAB */}
      {tab === 'questions' && (
        <div className="fade-in">
          {requiresPayment && !paymentDone ? <PaymentGate /> : (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h3 className="font-serif text-lg text-white">Practice Questions</h3>
                <div className="flex items-center gap-3 flex-wrap">
                  <select value={questionType} onChange={e => setQuestionType(e.target.value as QuestionType)}
                    className="bg-gray-900 border border-gray-700 text-white text-sm px-3 py-2 rounded-sm outline-none focus:border-yellow-400">
                    <option value="multiple_choice">Multiple Choice</option>
                    <option value="theory">Theory Questions</option>
                    <option value="true_false">True / False</option>
                    <option value="fill_blanks">Fill in the Blanks</option>
                  </select>
                  <button onClick={generateQuestions} disabled={questionsLoading}
                    className="bg-yellow-400 text-black text-xs font-semibold uppercase tracking-wider px-5 py-2 hover:bg-yellow-300 transition-colors disabled:opacity-50">
                    {questionsLoading ? 'Generating...' : 'Generate'}
                  </button>
                </div>
              </div>
              {questionsLoading && <Loader text="Creating practice questions from your document..." />}
              {questions && (
                <div className="bg-gray-900/50 border border-gray-800 rounded-sm p-6 text-gray-300 text-sm leading-relaxed whitespace-pre-wrap fade-in">
                  {questions}
                </div>
              )}
              {!questions && !questionsLoading && (
                <div className="text-center py-16 text-gray-600">
                  <p className="text-4xl mb-3">❓</p>
                  <p>Select a question type and click Generate</p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* STUDY AREAS TAB */}
      {tab === 'studyareas' && (
        <div className="fade-in">
          {requiresPayment && !paymentDone ? <PaymentGate /> : (
            <>
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-serif text-lg text-white">Key Study Areas</h3>
                <button onClick={generateStudyAreas} disabled={studyLoading}
                  className="bg-yellow-400 text-black text-xs font-semibold uppercase tracking-wider px-5 py-2 hover:bg-yellow-300 transition-colors disabled:opacity-50">
                  {studyLoading ? 'Identifying...' : 'Identify Areas'}
                </button>
              </div>
              {studyLoading && <Loader text="Finding the most important topics to study..." />}
              {studyAreas.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 fade-in">
                  {studyAreas.map((area, i) => (
                    <div key={i} className="bg-gray-900/50 border border-gray-800 p-4 rounded-sm flex gap-3 items-start">
                      <span className="text-yellow-400 text-xs font-mono mt-0.5 flex-shrink-0">{String(i + 1).padStart(2, '0')}</span>
                      <span className="text-gray-300 text-sm leading-relaxed">{area}</span>
                    </div>
                  ))}
                </div>
              )}
              {studyAreas.length === 0 && !studyLoading && (
                <div className="text-center py-16 text-gray-600">
                  <p className="text-4xl mb-3">🎯</p>
                  <p>Click Identify Areas to find the most important topics to study</p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* HIGHLIGHT TAB */}
      {tab === 'highlight' && (
        <div className="fade-in">
          {requiresPayment && !paymentDone ? <PaymentGate /> : (
            <>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-serif text-lg text-white">Highlighted PDF</h3>
                  <p className="text-gray-500 text-xs mt-1">AI identifies key sentences — we annotate and return your PDF</p>
                </div>
                <button onClick={generateHighlight} disabled={highlightLoading}
                  className="bg-yellow-400 text-black text-xs font-semibold uppercase tracking-wider px-5 py-2 hover:bg-yellow-300 transition-colors disabled:opacity-50">
                  {highlightLoading ? 'Processing...' : 'Process PDF'}
                </button>
              </div>
              {highlightLoading && <Loader text="Identifying key sentences and annotating your PDF..." />}
              {highlightUrl && (
                <div className="bg-gray-900/50 border border-yellow-400/20 rounded-sm p-8 text-center fade-in">
                  <p className="text-4xl mb-4">✅</p>
                  <h4 className="font-serif text-white text-lg mb-2">Your highlighted PDF is ready</h4>
                  <p className="text-gray-500 text-sm mb-6">Key sentences and important paragraphs have been annotated in yellow</p>
                  <a href={highlightUrl} download="highlighted.pdf"
                    className="inline-block bg-yellow-400 text-black font-semibold text-sm uppercase tracking-wider px-8 py-3 hover:bg-yellow-300 transition-colors">
                    ⬇ Download Highlighted PDF
                  </a>
                </div>
              )}
              {!highlightUrl && !highlightLoading && (
                <div className="text-center py-16 text-gray-600">
                  <p className="text-4xl mb-3">✨</p>
                  <p>Click Process PDF to get your annotated, highlighted document</p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </main>
  )
}
