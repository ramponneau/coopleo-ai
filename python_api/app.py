import os
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS
from langchain_anthropic import ChatAnthropic
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.memory import ConversationBufferMemory
from langchain.chains import LLMChain
import traceback
import json
import uuid
import time
from typing import List, Dict
from werkzeug.exceptions import HTTPException
import re

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Initialize ChatAnthropic model
MAX_RETRIES = 3
RETRY_DELAY = 2  # seconds

def initialize_llm():
    for attempt in range(MAX_RETRIES):
        try:
            return ChatAnthropic(model="claude-3-sonnet-20240229")
        except Exception as e:
            if attempt < MAX_RETRIES - 1:
                print(f"Attempt {attempt + 1} failed. Retrying in {RETRY_DELAY} seconds...")
                time.sleep(RETRY_DELAY)
            else:
                print(f"Error initializing ChatAnthropic after {MAX_RETRIES} attempts: {str(e)}")
                raise

try:
    llm = initialize_llm()
except Exception as e:
    print(f"Failed to initialize ChatAnthropic: {str(e)}")
    llm = None

# Define conversation template
template = """
Your name is **Coopleo** (in bold). 
You are a couple relationship advisor created to assist users with all their relationship health, well-being, and behavioral concerns. 
When interacting with users, guide them through a structured consultation process.
The goal is to help the user to understand their relationship and to help them to improve it.
Conclude this consultation process professionally after 8-10 exchanges by providing **final recommendations**.
You only speak French and use a professional tone and language.

Strict Single Response Protocol: 
The AI agent is required to adhere strictly to a protocol where it provides a single, concise response to each user input. This response should be focused, relevant, and succinct. 
Keep responses between 2-3 sentences maximum, without using ellipsis or any form of truncation.
Prioritize asking a question to understand the user's needs better.
Do not provide detailed advice in the main response, except to end the conversation with **final recommendations**.

# Context

The user has provided the following initial context:
* Current state of the relationship: {state}
* Current user mood: {mood}
* Current situation awareness: {location}
* Relationship topic to focus on: {topic}

Keep this context in mind throughout the conversation, but allow the user to freely discuss their concerns. Pay special attention to the chosen topic {topic} that the user has chosen to focus on.

# Response Format

Structure your single, unified response as follows:
1. For the first interaction:
   a. Greet the user naturally, say you're **Coopleo**.
   b. Ask for the user's name only once and never again.
   c. Use the user's name in your response. If none is provided, don't use it.

2. For subsequent interactions:
   a. Address the user by name if known. 
   b. A 1 sentence brief acknowledgment or validation of the user's previous statement.
   c. A very short insight related to the user's concern, focusing on the chosen topic when relevant.
   d. A single, focused follow-up question to encourage further discussion about the chosen topic.

Combine these elements into one cohesive response. Do not separate them into multiple messages or paragraphs.

# End of Conversation

After approximately 8-10 exchanges, or when the conversation naturally concludes, provide your final recommendations as follows:

1. Briefly summarize the key points discussed in a short paragraph, focusing on the main topic: {topic}.

2. Highlight any progress or insights gained during the conversation.

3. Offer 3-5 actionable recommendations to improve the user's relationship, based on the conversation history. Present these as bullet points for clarity:

   • [First recommendation]
   • [Second recommendation]
   • [Third recommendation]
   • [Fourth recommendation (if applicable)]
   • [Fifth recommendation (if applicable)]

   Ensure these recommendations are specific, tailored to the user's situation, and actionable.

4. Ask the user if they would like to receive these recommendations via email.

Use the exact phrase "final recommendations" when providing the recommendations. After the user says yes, or no, kindly thank them for their time and end the conversation. 

# Rules

1. Make your answers as clear and concise as possible, limited to 1-2 sentences maximum.
2. Always end your response by asking only one question.
3. In each response, use Markdown bold syntax (text) to emphasize exactly one key phrase or sentence. Choose the most important or impactful idea to highlight.
4. Never prescribe medication or provide medical advice.
5. In all interactions and recommendations, refrain from suggesting or recommending couples counseling, therapy, or any form of professional psychological intervention. Instead, focus on providing actionable advice, communication strategies, and self-help techniques that the couple can implement independently.
6. Only use biologicial his or her pronouns.
7. Maintain strict confidentiality and remind users of privacy considerations when discussing sensitive topics.
8. Encourage open communication between partners while respecting individual privacy.
9. Avoid taking sides in disputes; instead, focus on facilitating understanding and compromise.
10. Be sensitive to cultural differences in relationship norms and expectations.
11. Promote healthy relationship practices and boundaries.
12. Never invent or assume the user's name.
13. Always steer the conversation back to the chosen topic {topic}.
14. Do not say you are an AI agent or chatbot. Say you are a relationship advisor for couples.
15. End the conversation with a very short summary of the history of the conversation and "final recommandations" tool focused on the topic {topic}.
16. Trigger the "email-prompt" tool to show the UI component.

# Language selection

1. Whenever a user interacts with you, detect the language used in their query and respond in that same language.
2. Utilize the text of the user's input to determine the language.
3. If the language is ambiguous or mixed, default to the most prominently used language in the query.
4. Ensure your responses are culturally and contextually appropriate for the language and region.

Examples:

1. If the user speaks French, respond in French.
2. If the user speaks Spanish, respond in Spanish.
3. If the query contains multiple languages, choose the one that is most used in the query for your response.

# Continuous Improvement

At the end of each session, ask the user if they would like these final recommendations sent to their email.
After the user says yes, or no, kindly thank them for thei time and end the conversation.

Current conversation:
{history}
H: {input}
AI: """

prompt = ChatPromptTemplate.from_messages([
    ("system", template),
    MessagesPlaceholder(variable_name="history"),
    ("human", "{input}")
])

conversations: Dict[str, Dict] = {}

def generate_suggestions(response: str, conversation_history: List[str]) -> List[str]:
    prompt = f"""
    Based on the following conversation history and the AI's last response, generate 3 short, natural, and relevant examples of what the user might say next.
    These should be concise and specific examples, without any introductory text or formatting instructions.
    Do not use introductory text, numbering, or ellipsis.

    Conversation history:
    {' '.join(conversation_history[-5:])}

    AI's last response:
    {response}

    Generate 3 suggestions, each between 2-10 words.
    """

    for attempt in range(MAX_RETRIES):
        try:
            suggestions_response = llm.generate([prompt])
            suggestions = suggestions_response.generations[0][0].text.strip().split('\n')
            suggestions = [s.strip() for s in suggestions if s.strip()]
            suggestions = [s for s in suggestions if 2 <= len(s.split()) <= 10 and not s.startswith('(')]
            return suggestions[:3]
        except Exception as e:
            if attempt < MAX_RETRIES - 1:
                print(f"Attempt {attempt + 1} failed. Retrying in {RETRY_DELAY} seconds...")
                time.sleep(RETRY_DELAY)
            else:
                print(f"Error generating suggestions after {MAX_RETRIES} attempts: {str(e)}")
                return []

@app.errorhandler(Exception)
def handle_exception(e):
    # Pass through HTTP errors
    if isinstance(e, HTTPException):
        return jsonify(error=str(e)), e.code
    # Now you're handling non-HTTP exceptions only
    return jsonify(error=str(e)), 500

def register_routes(app):
    @app.route('/api/chat', methods=['POST'])
    def chat():
        if llm is None:
            return jsonify({'error': 'ChatAnthropic is not initialized'}), 500

        try:
            data = request.json
            message = data.get('message')
            is_initial_context = data.get('isInitialContext', False)
            conversation_id = data.get('conversation_id')
            context = data.get('context')

            if not message:
                return jsonify({'error': 'Message is required'}), 400

            if not conversation_id or conversation_id not in conversations:
                conversation_id = str(uuid.uuid4())
                memory = ConversationBufferMemory(return_messages=True, input_key="input", memory_key="history")
                conversations[conversation_id] = {
                    'chain': LLMChain(
                        llm=llm,
                        prompt=prompt,
                        verbose=True,
                        memory=memory
                    ) if llm is not None else None,
                    'context': context or {},
                    'message_count': 0
                }

            conversation = conversations[conversation_id]
            conversation['message_count'] += 1

            if conversation['chain'] is None:
                return jsonify({'error': 'LLM chain is not initialized'}), 500

            try:
                if is_initial_context:
                    context = json.loads(message) if isinstance(message, str) else message
                    conversation['context'] = context
                    input_message = "Greet the user naturally, say you're **Coopleo** and ask for their name."
                else:
                    context = conversation['context']
                    input_message = f"The user's message: {message}\nRespond naturally without reintroducing yourself. Remember the context of the ongoing conversation."

                # Always trigger final recommendations after 10 exchanges
                if conversation['message_count'] >= 10:
                    input_message += "\nProvide final recommendations now, focusing on the topic: {topic}. Remember to summarize key points discussed, highlight progress or insights, and offer 3-5 actionable recommendations. End by asking if they want to receive these recommendations via email."

                response = conversation['chain'].predict(
                    input=input_message,
                    state=context.get('state', 'Unknown'),
                    mood=context.get('mood', 'Unknown'),
                    location=context.get('location', 'Unknown'),
                    topic=context.get('topic', 'relationships in general')
                )

                contains_recommendations = any(phrase in response.lower() for phrase in ["final recommendations", "recommandations finales"])
                asks_for_email = "email" in response.lower() and "?" in response

                print(f"Response: {response}")
                print(f"Contains recommendations: {contains_recommendations}")
                print(f"Asks for email: {asks_for_email}")

                suggestions = []
                if contains_recommendations:
                    suggestions = []  # Empty suggestions for final recommendations
                elif conversation['message_count'] > 1:
                    suggestions = generate_suggestions(response, [str(msg.content) for msg in conversation['chain'].memory.chat_memory.messages])
                    if not suggestions:
                        suggestions = ["J'aimerais mettre cela en pratique", "Cela me dérangerait personnellement", "C'est un sacré défi pour notre couple"]

                def extract_recommendations(response: str) -> str:
                    recommendations = re.findall(r'•\s*(.*?)(?:\n|$)', response)
                    return '\n'.join(f'• {rec}' for rec in recommendations)

                # In your chat route
                final_recommendations = extract_recommendations(response) if contains_recommendations else ""

                return jsonify({
                    'response': response,
                    'suggestions': suggestions,
                    'conversation_id': conversation_id,
                    'contains_recommendations': contains_recommendations,
                    'asks_for_email': asks_for_email,
                    'final_recommendations': final_recommendations  # Add this line
                })

            except Exception as e:
                print(f"Error in conversation processing: {str(e)}")
                print(traceback.format_exc())
                return jsonify({'error': f'Error in AI processing: {str(e)}'}), 500

        except Exception as e:
            print(f"Error in /chat: {str(e)}")
            print(traceback.format_exc())
            return jsonify({'error': f'An error occurred processing your request: {str(e)}'}), 500

    @app.route('/api/reset', methods=['POST'])
    def reset_conversation():
        try:
            data = request.json
            conversation_id = data.get('conversation_id')
            if conversation_id in conversations:
                del conversations[conversation_id]
            return jsonify({"message": "Conversation reset successfully"})
        except Exception as e:
            print(f"Error in /reset: {str(e)}")
            return jsonify({"error": "An error occurred resetting the conversation", "details": str(e)}), 500

# Make sure to export the app
app = app

if __name__ == '__main__':
    app.run(debug=True, port=5000)