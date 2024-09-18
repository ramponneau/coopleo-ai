import { Resend } from 'resend';

console.log('RESEND_API_KEY:', process.env.RESEND_API_KEY);

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { email, emailContent, finalRecommendations, conversationId } = await req.json();

    console.log('Attempting to send email to:', email);
    console.log('Final Recommendations:', finalRecommendations);
    console.log('Email Content:', emailContent);

    if (!emailContent) {
      throw new Error('Email content is missing');
    }

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: 'Coopleo IA <bonjour@ramponneau.com>',
      to: email,
      subject: 'Votre parcours personnalisé Coopleo',
      html: emailContent,
    });

    if (error) {
      console.error('Resend API Error:', error);
      return new Response(JSON.stringify({ error: 'Failed to send email', details: error }), { status: 500 });
    }

    console.log('Email sent successfully:', data);
    return new Response(JSON.stringify({ success: true, data }));
  } catch (error) {
    console.error('Error in /api/send-transcript:', error);
    return new Response(JSON.stringify({ error: 'An error occurred sending the recommendations', details: error }), { status: 500 });
  }
}

function generateEmailContent(finalRecommendations: string, conversationId: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <img src="${process.env.NEXT_PUBLIC_BASE_URL}/coopleo-logo.svg" alt="Coopleo Logo" style="display: block; width: 180px; margin: 0 auto 30px;" />
      
      <h1 style="text-align: center; color: #333; margin-bottom: 20px;">Vos recommandations personnalisées</h1>
      
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
        <h2 style="color: #333; margin-bottom: 15px;">Recommandations finales</h2>
        <div style="white-space: pre-wrap; line-height: 1.5;">${finalRecommendations}</div>
      </div>
      
      <a href="${process.env.NEXT_PUBLIC_BASE_URL}/continue/${conversationId}" 
         style="display: inline-block; background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 30px; font-weight: bold; text-align: center;">
        Continuer votre session
      </a>
    </div>
  `;
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
