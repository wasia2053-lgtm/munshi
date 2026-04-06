import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Groq from 'groq-sdk'
import { trainingCache } from '../../../lib/trainingCache'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const { message, businessId, customerPhone } = await request.json()

    if (!message || !businessId) {
      return NextResponse.json(
        { error: 'Message and businessId required' },
        { status: 400 }
      )
    }

    console.log(`\n📨 [CHAT] New request: "${message.substring(0, 30)}..."`)
    console.log(`   BusinessId: ${businessId}`)
    console.log(`   Customer: ${customerPhone || 'unknown'}`)

    // Fetch training data (with cache)
    console.log('\n🧠 [TRAINING] Fetching data...')
    let trainingData = trainingCache.get(businessId)
    
    if (!trainingData) {
      const { data, error } = await supabase
        .from('knowledge_base')
        .select('id, source_type, source_url, content')
        .eq('business_id', businessId)
        .limit(5)

      if (error) {
        console.error('   ❌ Error:', error.message)
      } else {
        console.log(`   ✅ Fetched ${data?.length || 0} entries`)
        trainingData = data || []
        trainingCache.set(businessId, trainingData)
      }
    }

    // Build knowledge base
    let knowledgeContext = ''
    if (trainingData && trainingData.length > 0) {
      knowledgeContext = trainingData
        .map((item: any) => {
          const limitedContent = item.content.substring(0, 500)
          const source = item.source_type === 'pdf' ? '📄' : 
                        item.source_type === 'website' ? '🌐' : '✏️'
          return `${source} ${item.source_url}:\n${limitedContent}...`
        })
        .join('\n\n')
    }

    // Fetch conversation history (last 5 messages)
    console.log('\n💬 [MEMORY] Fetching conversation history...')
    let conversationContext = ''
    
    if (customerPhone) {
      const { data: messages, error } = await supabase
        .from('messages')
        .select('message_text, message_type')
        .eq('business_id', businessId)
        .eq('customer_phone', customerPhone)
        .order('created_at', { ascending: false })
        .limit(5)

      if (!error && messages && messages.length > 0) {
        console.log(`   ✅ Found ${messages.length} previous messages`)
        conversationContext = messages
          .reverse()
          .map((m: any) => `${m.message_type === 'bot' ? 'Bot' : 'Customer'}: ${m.message_text}`)
          .join('\n')
      } else {
        console.log('   ℹ️  No previous messages')
      }
    }

    // Build system prompt
    const systemPrompt = `You are Munshi, customer service assistant. Respond in Roman Urdu.

PREVIOUS CONVERSATION:
${conversationContext || 'No previous conversation'}

KNOWLEDGE BASE:
${knowledgeContext || 'No knowledge available'}

RULES:
1. Answer in Roman Urdu (Urdu in English letters)
2. Short responses (2-3 sentences max)
3. Remember previous context from conversation above
4. Be professional and friendly
5. If info not available: "Hamara team contact karega"`

    console.log('\n🚀 [GROQ] Sending to LLM...')
    const groqStart = Date.now()

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: message,
        },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 256,
      top_p: 0.9,
    })

    const groqElapsed = Date.now() - groqStart
    console.log(`   ✅ Response ready in ${groqElapsed}ms`)

    const aiResponse = chatCompletion.choices[0]?.message?.content

    if (!aiResponse) {
      console.error('   ❌ No response from Groq')
      return NextResponse.json(
        { error: 'Failed to generate response' },
        { status: 500 }
      )
    }

    console.log(`   Response: "${aiResponse.substring(0, 40)}..."`)

    const totalTime = Date.now() - startTime
    console.log(`\n⏱️  Total time: ${totalTime}ms`)
    console.log(`═══════════════════════════════════════════\n`)

    return NextResponse.json({
      response: aiResponse,
      trainingEntriesUsed: trainingData?.length || 0,
      memoryUsed: conversationContext ? true : false,
      responseTime: totalTime
    })

  } catch (error: any) {
    console.error('🔥 [CHAT] Error:', error.message)
    return NextResponse.json(
      { error: error.message || 'Server error' },
      { status: 500 }
    )
  }
}