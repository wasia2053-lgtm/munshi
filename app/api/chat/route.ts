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

    // Get business knowledge from Supabase
    const { data: knowledgeData, error: knowledgeError } = await supabase
      .from('knowledge_base')
      .select('content')
      .eq('business_id', businessId)
      .single()

    if (knowledgeError) {
      console.error('Error fetching knowledge:', knowledgeError)
      // Continue with empty knowledge if error occurs
    }

    const knowledge = knowledgeData?.content || 'No specific business information available.'

    // System prompt with strict Roman Urdu rules
    const systemPrompt = `You are Munshi, a customer service assistant.

CRITICAL LANGUAGE RULE - MUST FOLLOW:
You MUST respond in Roman Urdu ONLY.
Roman Urdu means Urdu words written in English letters. Examples:
- 'Ji haan, bilkul!' 
- 'Aapka order 2-3 din mein aa jayega'
- 'Koi bhi sawal ho toh zaroor poochein'

STRICTLY FORBIDDEN:
- Hindi words like: suagat, uplabdh, dhanyavaad, kripya, prapt, jawab, sampark, vyapar
- Urdu script: (کوئی اردو نہیں)
- Pure English (unless customer writes in English)

ALLOWED WORDS EXAMPLES:
Ji haan, nahi, shukriya, please, order, delivery, COD, available, price, product, aapka, hamara, karo, hoga, hai, tha, chahiye, milega

Store information: ${knowledge}`

    // Send to Groq API
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
      return NextResponse.json(
        { error: 'Failed to generate response' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      response: aiResponse,
    })

  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
