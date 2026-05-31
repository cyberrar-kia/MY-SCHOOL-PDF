import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'StudyAI — AI-Powered Study Tool',
  description: 'Upload any school PDF and get AI summaries, practice questions, study areas, and highlighted notes.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-dark min-h-screen">{children}</body>
    </html>
  )
}
