import { NextRequest, NextResponse } from 'next/server'

function getSupabase() {
  const { createClient } = require('@supabase/supabase-js')
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )
}

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
      const ip = data.data.metadata?.ip_address || 'unknown'
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7)

      if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
        const supabase = getSupabase()
        await supabase.from('payments').insert({
          ip_address: ip,
          reference,
          amount: data.data.amount,
          status: 'success',
          expires_at: expiresAt.toISOString(),
          created_at: new Date().toISOString(),
        })
      }

      return NextResponse.redirect(new URL('/study?payment=success', req.url))
    }

    return NextResponse.redirect(new URL('/study?payment=failed', req.url))
  } catch (error) {
    console.error('Payment verify error:', error)
    return NextResponse.redirect(new URL('/study?payment=failed', req.url))
  }
}
