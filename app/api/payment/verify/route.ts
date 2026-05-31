import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const reference = searchParams.get('reference')

    if (!reference) {
      return NextResponse.redirect(new URL('/study?payment=failed', req.url))
    }

    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
    })

    const data = await response.json()

    if (data.status && data.data.status === 'success') {
      const redirectUrl = new URL('/study?payment=success', req.url)
      const res = NextResponse.redirect(redirectUrl)

      // Set 7-day payment cookie
      res.cookies.set('paid_access', 'true', {
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
        sameSite: 'lax',
        httpOnly: true,
      })

      return res
    }

    return NextResponse.redirect(new URL('/study?payment=failed', req.url))
  } catch (error) {
    console.error('Payment verify error:', error)
    return NextResponse.redirect(new URL('/study?payment=failed', req.url))
  }
}
