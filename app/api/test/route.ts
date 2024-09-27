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
      const response = await fetch(`${req.nextUrl.origin}/api/sendtranscript`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      return NextResponse.json({
        success: true,
        message: 'Send transcript test successful',
        result
      });
    } catch (error) {
      console.error('Error in send transcript test:', error);
      return NextResponse.json({ error: 'An error occurred during the send transcript test' }, { status: 500 });
    }
  } else {
    // Default response for other test cases or no test parameter
    return NextResponse.json({ message: 'Test route is working' });
  }
}

// Keep the POST method as is
export async function POST(req: NextRequest) {
  // ... (keep the existing POST logic)
}