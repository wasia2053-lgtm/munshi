import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { checkRateLimit } from '../../../../lib/rate-limit'
import { createAdminClient } from '../../../../lib/supabase-server'
import { trainingCache } from '../../../../lib/trainingCache'
import * as cheerio from 'cheerio'
import dns from 'dns/promises'
import net from 'net'
import crypto from 'crypto'
import https from 'https'
import http from 'http'
import zlib from 'zlib'
import { Agent as UndiciAgent, fetch as undiciFetch } from 'undici'

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
  // IPv4-mapped IPv6 (::ffff:127.0.0.1 or ::ffff:7f00:1) — unwrap and re-check as IPv4,
  // otherwise a private IPv4 hidden inside an IPv6 literal slips past the checks above
  const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)
  if (mapped) return isPrivateIp(mapped[1])
  const mappedHex = lower.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/)
  if (mappedHex) {
    const hi = parseInt(mappedHex[1], 16), lo = parseInt(mappedHex[2], 16)
    return isPrivateIp(`${hi >> 8}.${hi & 255}.${lo >> 8}.${lo & 255}`)
  }
  if (lower === '::' || lower === '::1') return true        // unspecified + loopback
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

// ─── Resolve + validate in one step, then hand back the actual IP to connect
// to. This closes the DNS-rebinding TOCTOU gap: previously isSafeUrl() did a
// DNS lookup to validate the hostname, and THEN fetch() did its own separate
// DNS lookup to actually connect — an attacker controlling DNS for their
// domain could return a safe IP for the first lookup and a private/internal
// IP for the second, slipping past validation entirely. Resolving once here
// and connecting directly to that exact IP (see fetchPage below) means there
// is no second, unvalidated lookup for an attacker to race. ───
async function resolveValidatedIp(hostname: string): Promise<string | null> {
  try {
    const addresses = await dns.lookup(hostname, { all: true })
    if (addresses.length === 0) return null
    for (const addr of addresses) {
      if (isPrivateIp(addr.address)) return null
    }
    return addresses[0].address
  } catch {
    return null // can't resolve — don't trust it
  }
}

// ─── Fallback transport: HTTP/2 via undici, still IP-pinned. Some CDNs (Shopify's
// Cloudflare layer) reject the HTTP/1.1 handshake of Node's raw https module but
// accept a browser-like HTTP/2 connection. The custom `lookup` always returns the
// already-validated IP, so the DNS-rebinding protection is preserved. ───
async function fetchViaHttp2(url: string, ip: string): Promise<{ status: number; body: string | null; location?: string }> {
  const family = net.isIPv6(ip) ? 6 : 4
  const agent = new UndiciAgent({
    allowH2: true,
    connect: {
      lookup: (_host: string, opts: any, cb: any) => {
        if (opts && opts.all) cb(null, [{ address: ip, family }])
        else cb(null, ip, family)
      },
    },
  })
  try {
    const res = await undiciFetch(url, {
      dispatcher: agent,
      redirect: 'manual',
      signal: AbortSignal.timeout(15000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
      },
    })
    const location = res.headers.get('location') || undefined
    if (res.status < 200 || res.status >= 300) {
      let snippet = ''
      try { snippet = (await res.text()).replace(/\s+/g, ' ').slice(0, 300) } catch { }
      console.log(`❌ HTTP/2 ${res.status} | server=${res.headers.get('server') || '-'} www-authenticate=${res.headers.get('www-authenticate') || '-'} ct=${res.headers.get('content-type') || '-'} | body: ${snippet}`)
      return { status: res.status, body: null, location }
    }
    const MAX_BYTES = 5 * 1024 * 1024
    const reader = res.body?.getReader()
    if (!reader) return { status: res.status, body: await res.text() }
    const chunks: Buffer[] = []
    let received = 0
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      received += value.length
      if (received > MAX_BYTES) { await reader.cancel(); return { status: res.status, body: null } }
      chunks.push(Buffer.from(value))
    }
    return { status: res.status, body: Buffer.concat(chunks).toString('utf-8') }
  } catch (e: any) {
    console.log(`❌ HTTP/2 fallback error for ${url}: ${e.message}`)
    return { status: 0, body: null }
  } finally {
    await agent.close().catch(() => { })
  }
}

function fetchPage(url: string, redirectsLeft = 5): Promise<string | null> {
  return new Promise(async (resolvePromise) => {
    let parsed: URL
    try {
      parsed = new URL(url)
    } catch {
      return resolvePromise(null)
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return resolvePromise(null)

    const hostname = parsed.hostname.toLowerCase()
    if (hostname === 'localhost' || hostname.endsWith('.local')) return resolvePromise(null)

    const ip = await resolveValidatedIp(hostname)
    if (!ip) {
      console.log(`❌ DNS validation failed or resolved to a disallowed address: ${hostname}`)
      return resolvePromise(null)
    }

    const isHttps = parsed.protocol === 'https:'
    const lib = isHttps ? https : http

    const req = lib.request({
      host: ip, // connect to the pre-validated IP directly — not the hostname —
      // so nothing re-resolves DNS between validation and connection
      port: parsed.port || (isHttps ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method: 'GET',
      headers: {
        'Host': hostname, // preserve virtual-hosting
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'close',
      },
      servername: isHttps ? hostname : undefined, // correct TLS SNI + cert check against the real hostname, not the IP
      signal: AbortSignal.timeout(15000),
    }, (res) => {
      // Manual redirect handling — the recursive fetchPage() call re-runs the
      // full resolve+validate+pin flow for the new destination.
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400) {
        const location = res.headers.location
        res.resume()
        if (!location || redirectsLeft <= 0) {
          console.log(`❌ Redirect blocked (no location or too many hops): ${url}`)
          return resolvePromise(null)
        }
        let nextUrl: string
        try {
          nextUrl = new URL(location, url).toString()
        } catch {
          return resolvePromise(null)
        }
        return resolvePromise(fetchPage(nextUrl, redirectsLeft - 1))
      }

      console.log(`📡 Fetch ${url} → Status: ${res.statusCode}`)
      if (!res.statusCode || res.statusCode < 200 || res.statusCode >= 300) {
        // Diagnostics: which layer is blocking us? (server / cf-ray / cf-mitigated = Cloudflare)
        const errStatus = res.statusCode
        const errHeaders = `server=${res.headers['server'] || '-'} www-authenticate=${res.headers['www-authenticate'] || '-'} cf-ray=${res.headers['cf-ray'] || '-'} ct=${res.headers['content-type'] || '-'}`
        const errChunks: Buffer[] = []
        let errLen = 0
        res.on('data', (c: Buffer) => { if (errLen < 2048) { errChunks.push(c); errLen += c.length } })
        res.on('end', () => {
          let snippet = ''
          try {
            const raw = Buffer.concat(errChunks)
            const enc = res.headers['content-encoding']
            const txt = enc === 'gzip' ? zlib.gunzipSync(raw).toString() : enc === 'br' ? zlib.brotliDecompressSync(raw).toString() : raw.toString()
            snippet = txt.replace(/\s+/g, ' ').slice(0, 300)
          } catch { snippet = '(unreadable body)' }
          console.log(`❌ Failed: ${errStatus} | ${errHeaders} | body: ${snippet}`)
        })
        if (res.statusCode === 403 || res.statusCode === 429 || res.statusCode === 503) {
          console.log(`🔁 Retrying ${url} over HTTP/2 (IP-pinned)`)
          return fetchViaHttp2(url, ip).then((r) => {
            console.log(`📡 HTTP/2 retry ${url} → Status: ${r.status}`)
            if (r.status >= 300 && r.status < 400 && r.location && redirectsLeft > 0) {
              try { return fetchPage(new URL(r.location, url).toString(), redirectsLeft - 1) } catch { return null }
            }
            return r.body
          }).then(resolvePromise)
        }
        return resolvePromise(null)
      }

      // ─── Cap response size — was reading unlimited bytes into memory ───
      const MAX_BYTES = 5 * 1024 * 1024 // 5MB per page, plenty for any real webpage
      const chunks: Buffer[] = []
      let received = 0
      let aborted = false

      res.on('data', (chunk: Buffer) => {
        received += chunk.length
        if (received > MAX_BYTES) {
          console.log(`❌ Response too large (>${MAX_BYTES} bytes), aborting: ${url}`)
          aborted = true
          req.destroy()
          resolvePromise(null)
        } else {
          chunks.push(chunk)
        }
      })

      res.on('end', () => {
        if (aborted) return
        const raw = Buffer.concat(chunks)
        // fetch() used to decompress automatically — doing it ourselves now
        // since we're on the raw http/https module.
        const encoding = res.headers['content-encoding']
        try {
          let out: Buffer
          if (encoding === 'gzip') out = zlib.gunzipSync(raw)
          else if (encoding === 'br') out = zlib.brotliDecompressSync(raw)
          else if (encoding === 'deflate') out = zlib.inflateSync(raw)
          else out = raw
          resolvePromise(out.toString('utf-8'))
        } catch (e: any) {
          console.log(`❌ Decompression failed for ${url}: ${e.message}`)
          resolvePromise(null)
        }
      })
    })

    req.on('error', (e: any) => {
      console.log(`❌ Fetch error for ${url}: ${e.message}`)
      resolvePromise(null)
    })
    req.end()
  })
}

// ─── Shopify stores route ALL storefront traffic through Cloudflare's bot
// protection, which blocks non-browser/server-side requests (this is a
// Shopify platform default, not something the merchant configured). Most
// Shopify stores still leave `/products.json` publicly readable though — it's
// an official, documented public endpoint meant for exactly this kind of
// integration — and on stores without heavier (paid, enterprise) bot
// protection it often gets through even when the HTML pages don't. Try it
// first; if it's blocked too or the site isn't Shopify, we fall back to the
// normal HTML crawl below untouched. ───
async function tryShopifyProductsJson(baseUrl: string, maxPages: number): Promise<{ url: string; content: string }[] | null> {
  try {
    const origin = new URL(baseUrl).origin
    const raw = await fetchPage(`${origin}/products.json?limit=250`)
    if (!raw) return null

    let data: any
    try {
      data = JSON.parse(raw)
    } catch {
      return null // not JSON — not a Shopify store, or the endpoint returned an HTML block page
    }

    if (!data || !Array.isArray(data.products) || data.products.length === 0) return null

    const results: { url: string; content: string }[] = []
    for (const p of data.products.slice(0, maxPages)) {
      const price = p.variants?.[0]?.price ? `${p.variants[0].price}` : ''
      const description = String(p.body_html || '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 1500)
      const productUrl = `${origin}/products/${p.handle}`
      const content = `URL: ${productUrl}
Title: ${p.title}
Price: ${price}
Type: ${p.product_type || ''}
Tags: ${Array.isArray(p.tags) ? p.tags.join(', ') : p.tags || ''}
Content: ${description}`
      results.push({ url: productUrl, content })
    }
    return results
  } catch {
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

    // NOTE: `supabase` above runs as role 'authenticated' (not service_role)
    // once a real user session exists from cookies, even though it was built
    // with the service key — @supabase/ssr swaps in the user's own JWT.
    // check_rate_limit and promote_website_knowledge are locked to
    // service_role only, so both need a real admin client (below), not this one.
    const admin = createAdminClient()

    if (!(await checkRateLimit(admin, business_id, 'scrape-website', 5, 60))) {
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

    // ─── Try Shopify's public products.json first — see comment on
    // tryShopifyProductsJson above for why. ───
    let usedShopifyJson = false
    const shopifyResults = await tryShopifyProductsJson(url, MAX_PAGES)
    if (shopifyResults && shopifyResults.length > 0) {
      usedShopifyJson = true
      console.log(`🛍️ Shopify products.json worked — ${shopifyResults.length} products, skipping HTML crawl`)
      for (const r of shopifyResults) {
        visited.add(r.url)
        results.push(r)
        await supabase.from('knowledge_base').insert({
          business_id,
          source_type: 'website_pending',
          job_id: jobId,
          source_url: r.url,
          content: r.content,
          chunks_count: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      }
    }

    while (!usedShopifyJson && queue.length > 0 && visited.size < MAX_PAGES) {
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

      const links = extractLinks(html, currentUrl)
      console.log(`🔗 ${currentUrl} → html ${html.length} chars, ${links.length} same-host links found | head: ${html.replace(/\s+/g, ' ').slice(0, 150)}`)

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
    const { error: promoteError } = await admin.rpc('promote_website_knowledge', { p_business_id: business_id, p_job_id: jobId })
    if (promoteError) {
      console.error('❌ Promotion failed:', promoteError.message)
      return NextResponse.json({ error: 'Could not save the crawled data. Old training data was kept as-is.' }, { status: 500 })
    }

    console.log(`✅ Crawl complete! ${results.length} pages saved`)
    trainingCache.invalidate(business_id)
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