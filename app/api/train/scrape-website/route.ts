import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import * as cheerio from 'cheerio'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const BUSINESS_ID = '00000000-0000-0000-0000-000000000001'
const MAX_PAGES = 20

async function fetchPage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(10000)
    })
    if (!res.ok) return null
    return await res.text()
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
    } catch {}
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
  try {
    const { url } = await request.json()
    
    if (!url) {
      return NextResponse.json({ error: 'URL required' }, { status: 400 })
    }

    console.log(`🕷️ Starting crawl: ${url}`)
    
    const visited = new Set<string>()
    const queue = [url]
    const results: { url: string; content: string }[] = []

    // Delete old data for this website
    await supabase
      .from('knowledge_base')
      .delete()
      .eq('business_id', BUSINESS_ID)
      .eq('source_type', 'website')

    while (queue.length > 0 && visited.size < MAX_PAGES) {
      const currentUrl = queue.shift()!
      
      if (visited.has(currentUrl)) continue
      visited.add(currentUrl)

      console.log(`📄 Crawling (${visited.size}/${MAX_PAGES}): ${currentUrl}`)

      const html = await fetchPage(currentUrl)
      if (!html) continue

      const content = extractContent(html, currentUrl)
      results.push({ url: currentUrl, content })

      // Save to Supabase
      await supabase.from('knowledge_base').insert({
        business_id: BUSINESS_ID,
        source_type: 'website',
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

    console.log(`✅ Crawl complete! ${results.length} pages saved`)
    
    return NextResponse.json({ 
      success: true,
      pages_crawled: results.length,
      urls: results.map(r => r.url)
    })

  } catch (error: any) {
    console.error('❌ Scraper error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}