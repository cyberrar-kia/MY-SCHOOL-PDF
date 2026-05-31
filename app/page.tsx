'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleFile = async (file: File) => {
    if (!file || file.type !== 'application/pdf') {
      setError('Please upload a PDF file.')
      return
    }
    if (file.size > 20 * 1024 * 1024) {
      setError('File too large. Maximum size is 20MB.')
      return
    }

    setUploading(true)
    setError('')

    try {
      // Check daily limit / payment status
      const checkRes = await fetch('/api/payment/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check' }),
      })
      const checkData = await checkRes.json()

      // Convert PDF to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          const result = reader.result as string
          resolve(result.split(',')[1])
        }
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      // Store in sessionStorage
      sessionStorage.setItem('pdfBase64', base64)
      sessionStorage.setItem('pdfName', file.name)
      sessionStorage.setItem('pdfSize', String(file.size))
      sessionStorage.setItem('requiresPayment', checkData.requiresPayment ? 'true' : 'false')

      router.push('/study')
    } catch (err) {
      setError('Something went wrong. Please try again.')
      setUploading(false)
    }
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-16">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 border border-yellow-400/20 bg-yellow-400/5 px-4 py-2 rounded-sm mb-6">
          <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse inline-block" />
          <span className="text-yellow-400 text-xs tracking-widest uppercase font-medium">AI Study Tool</span>
        </div>
        <h1 className="font-serif text-5xl md:text-7xl font-bold text-white leading-tight mb-4">
          Study <span className="text-yellow-400 italic">Smarter</span>
        </h1>
        <p className="text-gray-400 text-base md:text-lg max-w-xl mx-auto font-light leading-relaxed">
          Upload any school PDF — textbook, past question, or lecture note — and get AI summaries, practice questions, key study areas, and highlighted notes instantly.
        </p>
      </div>

      {/* Upload Box */}
      <div
        className={`w-full max-w-xl border-2 border-dashed rounded-sm p-12 text-center transition-all cursor-pointer ${
          dragging ? 'border-yellow-400 bg-yellow-400/5' : 'border-gray-700 hover:border-gray-500'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => fileRef.current?.click()}
      >
        <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />

        {uploading ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-2 border-gray-700 border-t-yellow-400 rounded-full spinner" />
            <p className="text-gray-400 text-sm">Reading your PDF...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-sm bg-gray-800 flex items-center justify-center text-3xl">📄</div>
            <div>
              <p className="text-white font-medium mb-1">Drop your PDF here</p>
              <p className="text-gray-500 text-sm">or click to browse · Max 20MB</p>
            </div>
            <div className="flex gap-2 flex-wrap justify-center">
              {['Textbooks', 'Past Questions', 'Lecture Notes', 'Research Papers'].map(t => (
                <span key={t} className="text-xs border border-gray-700 px-3 py-1 text-gray-500 rounded-sm">{t}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-red-400 text-sm mt-4">{error}</p>}

      {/* Features */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 w-full max-w-3xl">
        {[
          { icon: '📝', title: 'AI Summary', desc: 'Topic-by-topic breakdown' },
          { icon: '❓', title: 'Questions', desc: 'MCQ, theory, T/F, fill-in' },
          { icon: '🎯', title: 'Study Areas', desc: 'Key concepts to focus on' },
          { icon: '✨', title: 'Highlights', desc: 'Download annotated PDF' },
        ].map(f => (
          <div key={f.title} className="bg-gray-900/50 border border-gray-800 p-4 rounded-sm text-center">
            <div className="text-2xl mb-2">{f.icon}</div>
            <div className="text-white text-sm font-medium mb-1">{f.title}</div>
            <div className="text-gray-500 text-xs">{f.desc}</div>
          </div>
        ))}
      </div>

      {/* Pricing note */}
      <p className="text-gray-600 text-xs mt-8 text-center">
        First PDF upload free daily · ₦1,500/week for unlimited access
      </p>
    </main>
  )
}
