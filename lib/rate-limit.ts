import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Returns true if the request is allowed, false if the caller has exceeded
 * the limit for this route in the current time window.
 * Backed by a Postgres function (check_rate_limit) — no external service needed.
 */
export async function checkRateLimit(
    supabase: SupabaseClient,
    businessId: string,
    route: string,
    maxRequests: number,
    windowSeconds: number
): Promise<boolean> {
    const { data, error } = await supabase.rpc('check_rate_limit', {
        p_business_id: businessId,
        p_route: route,
        p_max_requests: maxRequests,
        p_window_seconds: windowSeconds,
    })
    if (error) {
        console.error('Rate limit check failed:', error.message)
        return true // fail open — don't block real users if the limiter itself breaks
    }
    return data === true
}