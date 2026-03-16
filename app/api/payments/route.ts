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
  const referenceNumber = `MUNSHI-${userId.slice(0,8).toUpperCase()}`

  // Create payment record with basic columns only
  const { data: payment, error } = await supabase
    .from('payments')
    .insert({
      user_id: userId,
      plan: plan,
      amount: price,
      status: 'pending',
      reference_number: referenceNumber
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating payment:', {
      error: error,
      details: error.details,
      hint: error.hint,
      code: error.code,
      message: error.message
    })
    return NextResponse.json({ error: 'Failed to create payment', details: error.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    payment: {
      id: payment.id,
      plan: plan,
      amount: price,
      currency: 'PKR',
      status: 'pending',
      reference_number: referenceNumber,
      payment_instructions: {
        jazzcash: {
          account: '0328-2847607',
          name: 'Munshi Services',
          amount: price,
          reference: referenceNumber
        },
        easypaisa: {
          account: '0328-2847607',
          name: 'Munshi Services',
          amount: price,
          reference: referenceNumber
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
      status: 'confirmed'
    })
    .eq('id', paymentId)

  if (updateError) {
    console.error('Error updating payment:', {
      error: updateError,
      details: updateError.details,
      hint: updateError.hint,
      code: updateError.code,
      message: updateError.message
    })
    return NextResponse.json({ error: 'Failed to update payment', details: updateError.message }, { status: 500 })
  }

  // Update user subscription
  const { error: subscriptionError } = await supabase
    .from('subscriptions')
    .upsert({
      user_id: userId,
      plan: plan,
      messages_limit: messagesLimit,
      status: 'active'
    }, {
      onConflict: 'user_id'
    })

  if (subscriptionError) {
    console.error('Error updating subscription:', {
      error: subscriptionError,
      details: subscriptionError.details,
      hint: subscriptionError.hint,
      code: subscriptionError.code,
      message: subscriptionError.message
    })
    return NextResponse.json({ error: 'Failed to update subscription', details: subscriptionError.message }, { status: 500 })
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
