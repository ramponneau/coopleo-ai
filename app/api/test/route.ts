import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const test = searchParams.get('test');

  if (test === 'send-transcript') {
    const testData = {
      email: 'test@example.com',
      conversationId: 'test-conversation-id',
      finalRecommendations: '• Recommendation 1\n• Recommendation 2\n• Recommendation 3'
    };

    try {
      const response = await fetch(`${req.nextUrl.origin}/api/send-transcript`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      });

      const result = await response.json();

      if (response.ok) {
        return NextResponse.json({
          success: true,
          message: 'Send transcript test successful',
          result
        });
      } else {
        return NextResponse.json({ success: false, message: 'Send transcript test failed', error: result.error }, { status: 500 });
      }
    } catch (error) {
      console.error('Error in send transcript test:', error);
      return NextResponse.json({ error: 'An error occurred during the send transcript test' }, { status: 500 });
    }
  } else if (test === 'test-route') {
    try {
      const response = await fetch(`${req.nextUrl.origin}/api/test-route`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ testData: 'This is a test' }),
      });

      if (response.ok) {
        const result = await response.json();
        return NextResponse.json({
          success: true,
          message: 'Test route is working',
          result
        });
      } else {
        return NextResponse.json({ success: false, message: 'Test route failed', error: await response.text() }, { status: response.status });
      }
    } catch (error) {
      console.error('Error in test route:', error);
      return NextResponse.json({ error: 'An error occurred during the test route test' }, { status: 500 });
    }
  } else {
    // New simple test route
    return NextResponse.json({ message: 'Test route is working' });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { test } = await req.json();

    if (test === 'send-transcript') {
      const testData = {
        email: 'test@example.com',
        conversationId: 'test-conversation-id',
        finalRecommendations: '• Recommendation 1\n• Recommendation 2\n• Recommendation 3'
      };

      console.log('Sending test data to /api/send-transcript:', testData);

      const response = await fetch(`${req.nextUrl.origin}/api/send-transcript`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      });

      const result = await response.json();

      console.log('Received response from /api/send-transcript:', result);

      if (response.ok) {
        return NextResponse.json({
          success: true,
          message: 'Send transcript test successful',
          result
        });
      } else {
        return NextResponse.json({ success: false, message: 'Send transcript test failed', error: result.error }, { status: response.status });
      }
    } else {
      // New simple POST handler
      return NextResponse.json({ message: 'Received POST request', data: req.body });
    }

    return NextResponse.json({ error: 'Invalid test parameter' }, { status: 400 });
  } catch (error) {
    console.error('Error in test route:', error);
    return NextResponse.json({ error: 'An error occurred during the test', details: error }, { status: 500 });
  }
}