import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabaseAdmin
        .from('subscriptions')
        .select('plan, messages_used, messages_limit, valid_until')
        .eq('user_id', user.id)
        .single()

    if (error || !data) {
        // Return starter defaults if no subscription row
        return NextResponse.json({
            plan: 'starter',
            messages_used: 0,
            messages_limit: 50,
            valid_until: null,
        })
    }

    return NextResponse.json(data)
}