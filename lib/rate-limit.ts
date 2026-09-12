import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Returns true if the request is allowed, false if the caller has exceeded
 * the limit for this route in the current time window.
 * Backed by a Postgres function (check_rate_limit) — no external service needed.
 *
 * @param failOpen - what to do if the limiter itself errors (DB hiccup etc).
 *   true  = allow the request through (use for low-risk/internal routes where
 *           blocking real users during a transient blip is worse than the risk).
 *   false = block the request (use for expensive/abusable routes like scraping
 *           or LLM calls, where "fail safe" means erring on the side of caution).
 */
export async function checkRateLimit(
    supabase: SupabaseClient,
    businessId: string,
    route: string,
    maxRequests: number,
    windowSeconds: number,
    failOpen: boolean = false
): Promise<boolean> {
    const { data, error } = await supabase.rpc('check_rate_limit', {
        p_business_id: businessId,
        p_route: route,
        p_max_requests: maxRequests,
        p_window_seconds: windowSeconds,
    })
    if (error) {
        console.error('Rate limit check failed:', error.message)
        return failOpen
    }
    return data === true
}