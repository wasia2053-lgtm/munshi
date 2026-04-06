import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Groq from 'groq-sdk'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { message, businessId } = await request.json()

    if (!message || !businessId) {
      return NextResponse.json(
        { error: 'Message and businessId are required' },
        { status: 400 }
      )
    }

    console.log('📨 Chat request:', { message: message.substring(0, 50), businessId })

    // Fetch ALL training data for this business
    const { data: trainingData, error: trainingError } = await supabase
      .from('knowledge_base')
      .select('id, source_type, source_url, content, created_at')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })

    if (trainingError) {
      console.error('❌ Error fetching training data:', trainingError)
    }

    // Build knowledge base context from all training entries
    let knowledgeContext = ''
    
    if (trainingData && trainingData.length > 0) {
      console.log(`✅ Found ${trainingData.length} training entries`)
      
      knowledgeContext = trainingData
        .map((item: any, index: number) => {
          const source = item.source_type === 'pdf' ? '📄 PDF' : 
                        item.source_type === 'website' ? '🌐 Website' : '✏️ Text'
          return `[${source}: ${item.source_url}]\n${item.content}`
        })
        .join('\n\n---\n\n')
    } else {
      console.log('⚠️ No training data found for this business')
      knowledgeContext = 'No specific business information available yet.'
    }

    // System prompt with comprehensive context
    const systemPrompt = `You are Munshi, a professional customer service assistant for a Pakistani business.

═══════════════════════════════════════════════════════════
📚 BUSINESS KNOWLEDGE BASE
═══════════════════════════════════════════════════════════

${knowledgeContext}

═══════════════════════════════════════════════════════════
🗣️ LANGUAGE RULES - ROMAN URDU ONLY
═══════════════════════════════════════════════════════════

MUST respond in Roman Urdu (Urdu written in English letters).

✅ CORRECT Examples:
- "Ji haan, bilkul shukriya!"
- "Aapka order 2-3 din mein aa jayega"
- "Aap kaunsa product chahte ho?"
- "Hamara team aapka phone karke contact karega"

❌ FORBIDDEN:
- Hindi words (suagat, dhanyavaad, uplabdh, kripya, sampark, vyapar)
- Urdu script (اردو لکھنا)
- Pure English (unless customer asks in English)

═══════════════════════════════════════════════════════════
💼 BEHAVIOR GUIDELINES
═══════════════════════════════════════════════════════════

1. Always be helpful and professional
2. Answer based on KNOWLEDGE BASE information above
3. If info not available, say: "Yeh maloomaat hamara paas nahi hai, lekin hamara team aapko contact karega"
4. Keep responses SHORT (2-3 sentences max)
5. Use emoji where appropriate (🎁 🚚 ✅ ❌ 📞)
6. Ask follow-up questions if needed
7. Be warm and friendly like Pakistani customer service

═══════════════════════════════════════════════════════════`

    console.log('🧠 System prompt ready with', trainingData?.length || 0, 'knowledge entries')

    // Call Groq with training data context
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
      max_tokens: 500,
    })

    const aiResponse = chatCompletion.choices[0]?.message?.content

    if (!aiResponse) {
      console.error('❌ No response from Groq')
      return NextResponse.json(
        { error: 'Failed to generate response' },
        { status: 500 }
      )
    }

    console.log('✅ Response generated:', aiResponse.substring(0, 50))

    return NextResponse.json({
      response: aiResponse,
      trainingEntriesUsed: trainingData?.length || 0,
    })

  } catch (error: any) {
    console.error('🔥 Chat API error:', error)
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    )
  }
}