import { NextResponse } from 'next/server'
import { createAdminClient } from '../../../../lib/supabase-server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const REMINDER_WINDOW_DAYS = 3

export async function GET(request: Request) {
    // Vercel sets this automatically on real cron invocations — but ONLY once
    // the CRON_SECRET env var is actually added in the Vercel project settings.
    // Without it, anyone hitting this URL could trigger the job.
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createAdminClient()
    const now = new Date()
    const windowEnd = new Date(now.getTime() + REMINDER_WINDOW_DAYS * 24 * 60 * 60 * 1000)

    // Starter is free — nothing to renew, so no reminder needed for it.
    const { data: dueSubs, error } = await admin
        .from('subscriptions')
        .select('user_id, plan, valid_until, expiry_reminder_for')
        .neq('plan', 'starter')
        .eq('status', 'active')
        .not('valid_until', 'is', null)
        .lte('valid_until', windowEnd.toISOString())
        .gte('valid_until', now.toISOString())

    if (error) {
        console.error('[Expiry Reminder Cron] Query failed:', error.message)
        return NextResponse.json({ error: 'query failed' }, { status: 500 })
    }

    const toRemind = (dueSubs || []).filter(
        (s) => s.expiry_reminder_for !== s.valid_until
    )

    let sent = 0
    for (const sub of toRemind) {
        const expiryDate = new Date(sub.valid_until).toLocaleDateString('en-GB', {
            day: 'numeric', month: 'short', year: 'numeric',
        })

        // In-app notification — business_id IS the user_id throughout this app.
        await admin.from('notifications').insert({
            business_id: sub.user_id,
            type: 'billing',
            title: 'Plan expiring soon',
            message: `Your ${sub.plan} plan renews/expires on ${expiryDate}. Make sure your payment method is up to date to avoid any interruption.`,
            is_read: false,
        })

        // Best-effort email — a failure here shouldn't stop the in-app notification
        // or block marking this subscription as reminded for this cycle.
        try {
            const { data: authUser } = await admin.auth.admin.getUserById(sub.user_id)
            const email = authUser?.user?.email
            if (email) {
                await resend.emails.send({
                    from: 'Munshi Alerts <onboarding@resend.dev>',
                    to: email,
                    subject: 'Your Munshi plan is expiring soon',
                    html: `<p>Your <strong>${sub.plan}</strong> plan renews/expires on <strong>${expiryDate}</strong>.</p>
                 <p>Make sure your payment method is up to date to avoid any interruption to your WhatsApp bot.</p>`,
                })
            }
        } catch (emailError: any) {
            console.error(`[Expiry Reminder Cron] Email failed for ${sub.user_id}:`, emailError?.message)
        }

        const { error: markError } = await admin
            .from('subscriptions')
            .update({ expiry_reminder_for: sub.valid_until })
            .eq('user_id', sub.user_id)

        if (markError) {
            console.error(`[Expiry Reminder Cron] Failed to mark reminder for ${sub.user_id}:`, markError.message)
            continue
        }
        sent++
    }

    console.log(`[Expiry Reminder Cron] Checked ${dueSubs?.length || 0} due subscriptions, sent ${sent} reminders`)
    return NextResponse.json({ checked: dueSubs?.length || 0, sent })
}