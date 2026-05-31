import { NextRequest, NextResponse } from 'next/server'

function getSupabase() {
  const { createClient } = require('@supabase/supabase-js')
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    const today = new Date().toISOString().split('T')[0]

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json({ requiresPayment: false })
    }

    const supabase = getSupabase()

    const { data: uploads, error } = await supabase
      .from('uploads')
      .select('id')
      .eq('ip_address', ip)
      .gte('created_at', `${today}T00:00:00.000Z`)

    if (error) {
      return NextResponse.json({ requiresPayment: false })
    }

    const { data: payment } = await supabase
      .from('payments')
      .select('expires_at')
      .eq('ip_address', ip)
      .eq('status', 'success')
      .gte('expires_at', new Date().toISOString())
      .limit(1)

    const hasActivePayment = payment && payment.length > 0
    const uploadCount = uploads?.length || 0
    const requiresPayment = uploadCount >= 1 && !hasActivePayment

    if (!requiresPayment) {
      await supabase.from('uploads').insert({
        ip_address: ip,
        created_at: new Date().toISOString(),
      })
    }

    return NextResponse.json({ requiresPayment, uploadCount })
  } catch (error) {
    console.error('Payment check error:', error)
    return NextResponse.json({ requiresPayment: false })
  }
}
