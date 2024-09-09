import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log('Received request body:', body)

    const response = await fetch(`http://localhost:5000/chat?t=${Date.now()}`, {  // Add timestamp to URL
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Error response from Python API:', errorData)
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error}`)
    }

    const data = await response.json()
    console.log('Received response from Python API:', data)
    
    return new NextResponse(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error) {
    console.error('Error in chat API:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Error communicating with AI service', details: (error as Error).message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}