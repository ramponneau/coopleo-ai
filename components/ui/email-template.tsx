import * as React from 'react';

interface EmailTemplateProps {
  name: string;
  topic: string;
  finalRecommendations: string;
  conversationId: string;
}

export const EmailTemplate: React.FC<Readonly<EmailTemplateProps>> = ({
  name,
  topic,
  finalRecommendations,
  conversationId,
}) => {
  // Convert recommendations string to an array of bullet points
  const recommendationsList = finalRecommendations.split('\n').filter(item => item.trim().startsWith('•'));

  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Recommandations Coopleo</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
                <td>
                    <!-- Logo -->
                    <img src="${process.env.NEXT_PUBLIC_BASE_URL}/coopleo-logo.svg" alt="Coopleo Logo" style="display: block; width: 180px; margin: 0 auto 30px;" />
                    
                    <!-- Greeting -->
                    <h1 style="color: #333; text-align: center;">Bonjour ${name},</h1>
                    
                    <!-- Introductory sentence -->
                    <p style="font-size: 16px; margin-bottom: 20px;">
                        Voici les recommandations finales suite à notre échange pro-actif et centré sur <strong>${topic}</strong> :
                    </p>
                    
                    <!-- Recommendations section -->
                    <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                        <h2 style="color: #333; margin-bottom: 15px;">Recommandations finales</h2>
                        <ul style="padding-left: 20px;">
                            ${recommendationsList.map(rec => `<li style="margin-bottom: 10px;">${rec.substring(1).trim()}</li>`).join('')}
                        </ul>
                    </div>
                    
                    <!-- Closing paragraph -->
                    <p style="font-size: 16px; margin-bottom: 30px; text-align: center;">
                        Merci encore pour notre conversation. Vous pouvez me faire part de vos résultats en cliquant sur le bouton ci-dessous 👇
                    </p>
                    
                    <!-- Continue session button -->
                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                        <tr>
                            <td align="center">
                                <a href="${process.env.NEXT_PUBLIC_BASE_URL}/continue/${conversationId}" 
                                   style="display: inline-block; background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 30px; font-weight: bold; text-align: center;">
                                    Continuer votre session
                                </a>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
  `;
};