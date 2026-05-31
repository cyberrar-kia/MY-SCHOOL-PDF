import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { amount, currency } = await req.json()
    const ip = req.headers.get('x-forwarded-for') || 'unknown'

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amount || 150000, // ₦1,500 in kobo
        currency: currency || 'NGN',
        email: `study_${ip.replace(/[.:]/g, '_')}@studyai.app`,
        metadata: {
          ip_address: ip,
          product: 'studyai_weekly_access',
          custom_fields: [
            { display_name: 'Product', variable_name: 'product', value: 'StudyAI Weekly Access' },
          ],
        },
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/verify`,
      }),
    })

    const data = await response.json()

    if (!data.status) {
      throw new Error(data.message || 'Paystack initialization failed')
    }

    return NextResponse.json({
      authorization_url: data.data.authorization_url,
      access_code: data.data.access_code,
      reference: data.data.reference,
    })
  } catch (error) {
    console.error('Paystack init error:', error)
    return NextResponse.json({ error: 'Payment initialization failed' }, { status: 500 })
  }
}
