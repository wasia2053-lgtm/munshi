import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const PLAN_PRICES = {
  growth: 7000,
  pro: 20000
}

const PLAN_LIMITS = {
  growth: 5000,
  pro: 50000
}

export async function POST(request: NextRequest) {
  try {
    const { action, plan, userId, paymentId } = await request.json()

    if (action === 'create') {
      return await createPayment(plan, userId)
    } else if (action === 'confirm') {
      return await confirmPayment(paymentId, userId)
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Payment API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function createPayment(plan: string, userId: string) {
  if (!plan || !userId) {
    return NextResponse.json({ error: 'Plan and userId are required' }, { status: 400 })
  }

  if (!PLAN_PRICES[plan as keyof typeof PLAN_PRICES]) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
  }

  const price = PLAN_PRICES[plan as keyof typeof PLAN_PRICES]

  // Create payment record
  const { data: payment, error } = await supabase
    .from('payments')
    .insert({
      user_id: userId,
      plan: plan,
      amount: price,
      currency: 'PKR',
      status: 'pending',
      payment_method: 'manual',
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating payment:', error)
    return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    payment: {
      id: payment.id,
      plan: plan,
      amount: price,
      currency: 'PKR',
      status: 'pending',
      expires_at: payment.expires_at,
      payment_instructions: {
        jazzcash: {
          account: '03XX XXXXXXX',
          name: 'Munshi Services',
          amount: price,
          reference: `MUNSHI-${payment.id.slice(-8).toUpperCase()}`
        },
        easypaisa: {
          account: '03XX XXXXXXX',
          name: 'Munshi Services',
          amount: price,
          reference: `MUNSHI-${payment.id.slice(-8).toUpperCase()}`
        }
      },
      note: 'After payment, please send screenshot to confirm payment'
    }
  })
}

async function confirmPayment(paymentId: string, userId: string) {
  if (!paymentId || !userId) {
    return NextResponse.json({ error: 'PaymentId and userId are required' }, { status: 400 })
  }

  // Get payment details
  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .select('*')
    .eq('id', paymentId)
    .eq('user_id', userId)
    .single()

  if (paymentError || !payment) {
    return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
  }

  if (payment.status !== 'pending') {
    return NextResponse.json({ error: 'Payment already processed' }, { status: 400 })
  }

  const plan = payment.plan as keyof typeof PLAN_LIMITS
  const messagesLimit = PLAN_LIMITS[plan]

  // Update payment status
  const { error: updateError } = await supabase
    .from('payments')
    .update({
      status: 'confirmed',
      confirmed_at: new Date().toISOString()
    })
    .eq('id', paymentId)

  if (updateError) {
    console.error('Error updating payment:', updateError)
    return NextResponse.json({ error: 'Failed to update payment' }, { status: 500 })
  }

  // Update user subscription
  const { error: subscriptionError } = await supabase
    .from('subscriptions')
    .upsert({
      user_id: userId,
      plan: plan,
      messages_limit: messagesLimit,
      messages_used: 0,
      status: 'active',
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id'
    })

  if (subscriptionError) {
    console.error('Error updating subscription:', subscriptionError)
    return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    message: 'Payment confirmed successfully',
    subscription: {
      plan: plan,
      messages_limit: messagesLimit,
      status: 'active',
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    }
  })
}
