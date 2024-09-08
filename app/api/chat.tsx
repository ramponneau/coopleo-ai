import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: Request) {
  const { message } = await req.json()

  try {
    const response = await anthropic.completions.create({
      model: "claude-2",
      max_tokens_to_sample: 300,
      prompt: `Human: ${message}\n\nAssistant: `,
    })

    return NextResponse.json({ response: response.completion })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'An error occurred while processing your request.' }, { status: 500 })
  }
}