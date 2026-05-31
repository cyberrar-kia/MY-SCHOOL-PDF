import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    // Check cookie for upload count today
    const uploadCookie = req.cookies.get('upload_count')
    const uploadDate = req.cookies.get('upload_date')
    const paidCookie = req.cookies.get('paid_access')

    const today = new Date().toISOString().split('T')[0]
    const isToday = uploadDate?.value === today
    const uploadCount = isToday ? parseInt(uploadCookie?.value || '0') : 0

    // Check active payment (cookie set after Paystack success)
    const hasActivePayment = paidCookie?.value === 'true'

    const requiresPayment = uploadCount >= 1 && !hasActivePayment

    const res = NextResponse.json({ requiresPayment, uploadCount })

    if (!requiresPayment) {
      const newCount = isToday ? uploadCount + 1 : 1
      res.cookies.set('upload_count', String(newCount), {
        maxAge: 86400, // 24 hours
        path: '/',
        sameSite: 'lax',
      })
      res.cookies.set('upload_date', today, {
        maxAge: 86400,
        path: '/',
        sameSite: 'lax',
      })
    }

    return res
  } catch (error) {
    console.error('Payment check error:', error)
    return NextResponse.json({ requiresPayment: false })
  }
}
