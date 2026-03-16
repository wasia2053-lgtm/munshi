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

    // System prompt with Roman Urdu emphasis
    const systemPrompt = `Tu Munshi hai - ek helpful aur friendly customer service assistant jo is store ki taraf se baat karta hai.

LANGUAGE RULES - BOHAT ZAROORI:
- HAMESHA Roman Urdu mein jawab do (jaise: 'Ji haan', 'Bilkul', 'Aap ka shukriya')
- Sirf tab English use karo jab customer khud pure English mein likhe
- Hindi BILKUL mat use karo
- Urdu script (اردو) mat use karo
- Roman Urdu hi use karo har waqt

TONE RULES:
- Hamesha 'Aap' use karo, kabhi 'tu/tum' nahi
- Friendly aur warm raho
- Chota aur clear jawab do
- Kabhi mat batao ke tum AI ho

Store ki information: ${knowledge}`

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
