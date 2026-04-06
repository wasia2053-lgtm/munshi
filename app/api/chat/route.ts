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

    // Fetch training data for this business
    const { data: trainingData, error: trainingError } = await supabase
      .from('knowledge_base')
      .select('id, source_type, source_url, content')
      .eq('business_id', businessId)
      .limit(5) // Limit to 5 most recent

    if (trainingError) {
      console.error('❌ Error fetching training data:', trainingError)
    }

    // Build knowledge base - COMPACT VERSION
    let knowledgeContext = ''
    
    if (trainingData && trainingData.length > 0) {
      console.log(`✅ Found ${trainingData.length} training entries`)
      
      // Limit content size to avoid token overload
      knowledgeContext = trainingData
        .map((item: any) => {
          // Limit each content to 500 chars
          const limitedContent = item.content.substring(0, 500)
          const source = item.source_type === 'pdf' ? '📄' : 
                        item.source_type === 'website' ? '🌐' : '✏️'
          return `${source} ${item.source_url}:\n${limitedContent}...`
        })
        .join('\n\n')
    } else {
      console.log('⚠️ No training data found')
      knowledgeContext = 'No business information available.'
    }

    // COMPACT system prompt
    const systemPrompt = `You are Munshi, customer service assistant. Respond in Roman Urdu only.

KNOWLEDGE BASE:
${knowledgeContext}

RULES:
1. Answer in Roman Urdu (Urdu in English letters)
2. Use: "Ji haan", "Nahi", "Shukriya", "Aapka", "Hamara"
3. Short responses (2-3 sentences)
4. If info not available: "Hamara team contact karega"
5. Be professional and friendly`

    console.log('🧠 System prompt ready')

    // Call Groq
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
      max_tokens: 256, // Reduced from 500
    })

    const aiResponse = chatCompletion.choices[0]?.message?.content

    if (!aiResponse) {
      console.error('❌ No response from Groq')
      return NextResponse.json(
        { error: 'Failed to generate response' },
        { status: 500 }
      )
    }

    console.log('✅ Response:', aiResponse.substring(0, 50))

    return NextResponse.json({
      response: aiResponse,
      trainingEntriesUsed: trainingData?.length || 0,
    })

  } catch (error: any) {
    console.error('🔥 Error:', error.message)
    return NextResponse.json(
      { error: error.message || 'Server error' },
      { status: 500 }
    )
  }
}