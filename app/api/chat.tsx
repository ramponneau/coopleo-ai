import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: Request) {
  const { message, isInitialContext } = await req.json()

  try {
    let prompt = isInitialContext
      ? `Human: Initial context: ${message}\n\nAssistant: Based on this information, provide a single, concise initial response that acknowledges these details. Your response must be a single paragraph. Do not provide any advice or insights yet. End with asking for the user's name.`
      : `Human: ${message}\n\nAssistant: `

    const response = await anthropic.completions.create({
      model: "claude-2",
      max_tokens_to_sample: 300,
      prompt: prompt,
    })

    return NextResponse.json({ response: response.completion })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'An error occurred while processing your request.' }, { status: 500 })
  }
}