import { NextRequest, NextResponse } from 'next/server';

let conversationId: string | null = null;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('Request body:', body);

    let payload = { 
      message: body.message, 
      isInitialContext: body.isInitialContext || false,
      conversation_id: body.conversation_id,
      context: body.context
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
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Received response from Flask server:', data);

    return NextResponse.json({
      response: data.response,
      suggestions: data.suggestions,
      conversation_id: data.conversation_id,
      contains_recommendations: data.contains_recommendations,
      asks_for_email: data.asks_for_email
    });
  } catch (error: any) {
    console.error('Error in POST /api/chat:', error);
    return NextResponse.json({ 
      error: error.message || 'An error occurred processing your request',
      stack: error.stack
    }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const response = await fetch('http://localhost:5000/reset', { 
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ conversation_id: conversationId }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    conversationId = null; // Reset the conversation ID
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in DELETE /api/chat:', error);
    return NextResponse.json({ error: 'An error occurred resetting the conversation' }, { status: 500 });
  }
}

