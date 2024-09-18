import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

console.log('RESEND_API_KEY:', process.env.RESEND_API_KEY);

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { email, conversationId, finalRecommendations } = await req.json();

    console.log('Attempting to send email to:', email);
    console.log('Final Recommendations:', finalRecommendations);

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: 'Coopleo IA <bonjour@ramponneau.com>',
      to: email,
      subject: 'Votre parcours personnalisé Coopleo',
      html: `
        <p>Sur la base de notre précédente session, voici les recommandations pour votre couple :</p>
        <h2>Recommandations Finales</h2>
        <div>${finalRecommendations}</div>
        <p>
          <a href="${process.env.NEXT_PUBLIC_BASE_URL}/continue/${conversationId}">
            Continuer Votre Session
          </a>
        </p>
      `,
    });

    if (error) {
      console.error('Resend API Error:', error);
      return NextResponse.json({ error: 'Failed to send email', details: error }, { status: 500 });
    }

    console.log('Email sent successfully:', data);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error in /api/send-transcript:', error);
    return NextResponse.json({ error: 'An error occurred sending the recommendations', details: error }, { status: 500 });
  }
}

// Fetch conversation function
async function fetchConversation(conversationId: string) {
  // TODO: Implement this function to fetch the actual conversation
  console.log('Fetching conversation for ID:', conversationId);
  return [
    { role: 'user', content: 'Hello, I need help with my relationship.' },
    { role: 'assistant', content: 'Of course, I\'d be happy to help. Can you tell me more about what\'s going on?' },
  ];
}

// Generate transcript function
function generateTranscript(conversation: Array<{ role: string, content: string }>) {
  return conversation.map(msg => `${msg.role}: ${msg.content}`).join('\n\n');
}
