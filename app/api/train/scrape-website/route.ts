import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { checkRateLimit } from '../../../../lib/rate-limit'
import * as cheerio from 'cheerio'
import dns from 'dns/promises'
import net from 'net'
import crypto from 'crypto'

export const maxDuration = 60 // 60 second timeout
export const dynamic = 'force-dynamic'

const PLAN_PAGE_LIMITS: Record<string, number> = {
  starter: 5,
  basic: 10,
  growth: 20,
  pro: 25,
}
const DEFAULT_PAGE_LIMIT = 5 // safest default if no subscription row found

// ─── SSRF guard: block scraping localhost / internal / cloud-metadata addresses ───
function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const p = ip.split('.').map(Number)
    if (p[0] === 10) return true                          // private
    if (p[0] === 127) return true                          // loopback
    if (p[0] === 0) return true                            // "this network"
    if (p[0] === 169 && p[1] === 254) return true          // link-local + cloud metadata (169.254.169.254)
    if (p[0] === 172 && p[1] >= 16 && p[1] <= 31) return true // private
    if (p[0] === 192 && p[1] === 168) return true          // private
    return false
  }
  const lower = ip.toLowerCase()
  if (lower === '::1') return true                          // loopback
  if (lower.startsWith('fe80:')) return true                // link-local
  if (lower.startsWith('fc') || lower.startsWith('fd')) return true // unique local
  return false
}

async function isSafeUrl(urlString: string): Promise<boolean> {
  let parsed: URL
  try {
    parsed = new URL(urlString)
  } catch {
    return false
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false

  const hostname = parsed.hostname.toLowerCase()
  if (hostname === 'localhost' || hostname.endsWith('.local')) return false

  try {
    const addresses = await dns.lookup(hostname, { all: true })
    for (const addr of addresses) {
      if (isPrivateIp(addr.address)) return false
    }
  } catch {
    return false // can't resolve — don't trust it
  }

  return true
}

async function fetchPage(url: string, redirectsLeft = 5): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
      },
      redirect: 'manual', // don't blindly follow — a redirect could point at an internal address
      signal: AbortSignal.timeout(15000)
    })

    // Manual redirect: re-validate the destination before following it (SSRF guard)
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get('location')
      if (!location || redirectsLeft <= 0) {
        console.log(`❌ Redirect blocked (no location or too many hops): ${url}`)
        return null
      }
      const nextUrl = new URL(location, url).toString()
      if (!(await isSafeUrl(nextUrl))) {
        console.log(`❌ Redirect blocked — destination not allowed: ${nextUrl}`)
        return null
      }
      return fetchPage(nextUrl, redirectsLeft - 1)
    }

    console.log(`📡 Fetch ${url} → Status: ${res.status}`)
    if (!res.ok) {
      console.log(`❌ Failed: ${res.status} ${res.statusText}`)
      return null
    }

    // ─── Cap response size — was reading unlimited bytes into memory ───
    const MAX_BYTES = 5 * 1024 * 1024 // 5MB per page, plenty for any real webpage
    const reader = res.body?.getReader()
    if (!reader) return await res.text()

    const chunks: Uint8Array[] = []
    let received = 0
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      received += value.length
      if (received > MAX_BYTES) {
        console.log(`❌ Response too large (>${MAX_BYTES} bytes), aborting: ${url}`)
        reader.cancel()
        return null
      }
      chunks.push(value)
    }
    return Buffer.concat(chunks.map(c => Buffer.from(c))).toString('utf-8')
  } catch (e: any) {
    console.log(`❌ Fetch error for ${url}: ${e.message}`)
    return null
  }
}

function extractLinks(html: string, baseUrl: string): string[] {
  const $ = cheerio.load(html)
  const links: string[] = []
  const base = new URL(baseUrl)

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href')
    if (!href) return
    try {
      const url = new URL(href, baseUrl)
      if (url.hostname === base.hostname &&
        !url.pathname.includes('#') &&
        !url.pathname.match(/\.(jpg|jpeg|png|gif|pdf|zip|svg|css|js)$/i)) {
        links.push(url.href.split('#')[0].split('?')[0])
      }
    } catch { }
  })

  return [...new Set(links)]
}

function extractContent(html: string, url: string): string {
  const $ = cheerio.load(html)

  $('script, style, nav, footer, header, .cookie-banner, iframe').remove()

  const title = $('title').text().trim()
  const h1 = $('h1').map((_, el) => $(el).text().trim()).get().join(' | ')
  const h2 = $('h2').map((_, el) => $(el).text().trim()).get().join(' | ')

  // Product specific
  const prices = $('[class*="price"], [class*="Price"]')
    .map((_, el) => $(el).text().trim()).get().join(' | ')

  const bodyText = $('main, article, .content, .product, body')
    .text()
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 2000)

  return `URL: ${url}
Title: ${title}
Headings: ${h1} ${h2}
Prices: ${prices}
Content: ${bodyText}`
}

export async function POST(request: NextRequest) {
  let jobId: string | undefined
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const business_id = user.id

    if (!(await checkRateLimit(supabase, business_id, 'scrape-website', 5, 60))) {
      return NextResponse.json({ error: 'Too many training requests — please wait a minute and try again.' }, { status: 429 })
    }

    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: 'URL required' }, { status: 400 })
    }

    if (!(await isSafeUrl(url))) {
      return NextResponse.json({ error: 'This URL is not allowed' }, { status: 400 })
    }

    console.log(`🕷️ Starting crawl: ${url}`)

    // ─── Page limit depends on plan — was hardcoded 20 for everyone before ───
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('plan')
      .eq('user_id', business_id)
      .single()
    const MAX_PAGES = PLAN_PAGE_LIMITS[sub?.plan || ''] || DEFAULT_PAGE_LIMIT
    console.log(`📊 Plan: ${sub?.plan || 'unknown'} — page limit: ${MAX_PAGES}`)

    const visited = new Set<string>()
    const queue = [url]
    const results: { url: string; content: string }[] = []
    jobId = crypto.randomUUID() // isolates this crawl's staging rows from any other concurrent crawl

    // Clean up only STALE orphaned pending rows (from a crawl that crashed
    // a while ago) — not any other crawl that might legitimately be running
    // right now for this same business.
    const staleCutoff = new Date(Date.now() - 10 * 60 * 1000).toISOString()
    await supabase
      .from('knowledge_base')
      .delete()
      .eq('business_id', business_id)
      .eq('source_type', 'website_pending')
      .lt('created_at', staleCutoff)

    let totalBytes = 0
    const MAX_TOTAL_BYTES = 25 * 1024 * 1024 // 25MB across the whole crawl

    while (queue.length > 0 && visited.size < MAX_PAGES) {
      const currentUrl = queue.shift()!

      if (visited.has(currentUrl)) continue
      visited.add(currentUrl)

      console.log(`📄 Crawling (${visited.size}/${MAX_PAGES}): ${currentUrl}`)

      const html = await fetchPage(currentUrl)
      if (!html) continue

      totalBytes += Buffer.byteLength(html, 'utf-8')
      if (totalBytes > MAX_TOTAL_BYTES) {
        console.log(`❌ Total crawl size exceeded ${MAX_TOTAL_BYTES} bytes — stopping crawl early`)
        break
      }

      const content = extractContent(html, currentUrl)
      results.push({ url: currentUrl, content })

      // Save into a PENDING bucket tagged with this crawl's job_id — old
      // "website" knowledge is untouched until the whole crawl finishes
      // successfully (atomic replace below), and other concurrent crawls
      // for this business (different job_id) can't collide with this data.
      await supabase.from('knowledge_base').insert({
        business_id,
        source_type: 'website_pending',
        job_id: jobId,
        source_url: currentUrl,
        content: content,
        chunks_count: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

      // Add new links to queue
      const links = extractLinks(html, url)
      for (const link of links) {
        if (!visited.has(link)) queue.push(link)
      }

      // Small delay to not overload server
      await new Promise(r => setTimeout(r, 500))
    }

    if (results.length === 0) {
      // Nothing was crawled successfully — leave old knowledge exactly as it was
      await supabase.from('knowledge_base').delete().eq('business_id', business_id).eq('source_type', 'website_pending').eq('job_id', jobId)
      return NextResponse.json({ error: 'Could not crawl this website. Old training data was kept as-is.' }, { status: 400 })
    }

    // Truly atomic swap — one DB function call, one transaction. If it fails
    // partway, Postgres rolls the whole thing back: old knowledge stays intact.
    const { error: promoteError } = await supabase.rpc('promote_website_knowledge', { p_business_id: business_id, p_job_id: jobId })
    if (promoteError) {
      console.error('❌ Promotion failed:', promoteError.message)
      return NextResponse.json({ error: 'Could not save the crawled data. Old training data was kept as-is.' }, { status: 500 })
    }

    console.log(`✅ Crawl complete! ${results.length} pages saved`)
    // Training complete notification
    await supabase
      .from('notifications')
      .insert({
        business_id,
        type: 'training_complete',
        title: 'Website Training Complete! 🎓',
        message: `Website training complete ho gayi. ${results.length} pages se knowledge base update hua.`,
        is_read: false
      })
    return NextResponse.json({
      success: true,
      pages_crawled: results.length,
      urls: results.map(r => r.url)
    })

  } catch (error: any) {
    console.error('❌ Scraper error:', error.message)
    try {
      const cookieStore = await cookies()
      const cleanupClient = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { cookies: { getAll: () => cookieStore.getAll() } }
      )
      const { data: { user } } = await cleanupClient.auth.getUser()
      if (user && jobId) {
        await cleanupClient.from('knowledge_base').delete().eq('business_id', user.id).eq('source_type', 'website_pending').eq('job_id', jobId)
      }
    } catch {
      // best-effort cleanup only
    }
    return NextResponse.json({ error: 'Something went wrong while training. Please try again.' }, { status: 500 })
  }
}