import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    console.log('Received POST request to /api/chat');
    const body = await req.json();
    console.log('Request body:', body);

    let payload = { 
      message: body.message, 
      isInitialContext: body.isInitialContext || false 
    };

    console.log('Sending payload to Flask server:', payload);

    const response = await fetch('http://localhost:5000/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data = await response.json();
    console.log('Received response from Flask server:', data);

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error in POST /api/chat:', error);
    return NextResponse.json({ error: error.message || 'An error occurred processing your request' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const response = await fetch('http://localhost:5000/reset', { method: 'POST' });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in DELETE /api/chat:', error);
    return NextResponse.json({ error: 'An error occurred resetting the conversation' }, { status: 500 });
  }
}
