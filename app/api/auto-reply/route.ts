import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { input } = await req.json();

    console.log('Received auto-reply request:', input);

    const response = await fetch('http://localhost:5000/auto-reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error from Flask server:', errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Auto-reply suggestions:', data.suggestions);

    return NextResponse.json({ suggestions: data.suggestions });
  } catch (error) {
    console.error('Error in /api/auto-reply:', error);
    return NextResponse.json({ error: 'An error occurred generating the auto-replies' }, { status: 500 });
  }
}
