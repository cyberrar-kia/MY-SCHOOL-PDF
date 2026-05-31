import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    const today = new Date().toISOString().split('T')[0]

    // Check how many uploads this IP has done today
    const { data: uploads, error } = await supabase
      .from('uploads')
      .select('id')
      .eq('ip_address', ip)
      .gte('created_at', `${today}T00:00:00.000Z`)

    if (error) {
      // If Supabase not set up, allow first upload
      return NextResponse.json({ requiresPayment: false })
    }

    // Check if user has active weekly payment
    const { data: payment } = await supabase
      .from('payments')
      .select('expires_at')
      .eq('ip_address', ip)
      .eq('status', 'success')
      .gte('expires_at', new Date().toISOString())
      .limit(1)

    const hasActivePayment = payment && payment.length > 0
    const uploadCount = uploads?.length || 0

    // First upload of the day is free
    const requiresPayment = uploadCount >= 1 && !hasActivePayment

    // Log this upload attempt
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
