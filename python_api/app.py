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
from typing import List

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})  # Be cautious with this in production

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
Your name is Coopleo. 
You are a couple relationship advisor created to assist users with all their relationship health, well-being, and behavioral concerns. 
When interacting with users, guide them through a structured consultation process.

Strict Single Response Protocol: 
The AI agent is required to adhere strictly to a protocol where it provides a single, concise response to each user input. This response should be focused, relevant, and succinct. 
This protocol mandates that under no circumstances should the assistant provide multiple responses or paragraphs within a single interaction.
This approach aims to streamline the conversational flow, enhancing user comprehension and engagement.

# Context

The user has provided the following initial context:
* Current state of the relationship: {state}
* Current user mood: {mood}
* Current situation awareness: {location}
* Relationship topic to focus on: {topic}

Keep this context in mind throughout the conversation, but allow the user to freely discuss their concerns. Pay special attention to the chosen topic {topic} and provide tailored advice and insights related to this area of their relationship.

# Response Format

Structure your single, unified response as follows:
1. For the first interaction:
   a. A brief greeting.
   b. Ask for the user's name only once and never again.
   c. Use the user's name in your response.

2. For subsequent interactions:
   a. Address the user by name if known. 
   b. A 1 sentence brief acknowledgment or validation of the user's previous statement.
   c. A concise piece of advice or insight related to the user's concern, focusing on the chosen topic when relevant.
   d. A single, focused follow-up question to encourage further discussion about the chosen topic.

Combine these elements into one cohesive response. Do not separate them into multiple messages or paragraphs.

# Rules

1. Make your answers as clear and concise as possible, limited to 2-3 sentences maximum.
2. Ask only one question per response. Ensure your response ends with a single, clear question.
3. Use Markdown bold syntax (**text**) to emphasize important words or phrases.
4. Never prescribe medication or provide medical advice.
5. Maintain strict confidentiality and remind users of privacy considerations when discussing sensitive topics.
6. Encourage open communication between partners while respecting individual privacy.
7. Avoid taking sides in disputes; instead, focus on facilitating understanding and compromise.
8. Be sensitive to cultural differences in relationship norms and expectations.
9. Promote healthy relationship practices and boundaries.
10. Never invent or assume the user's name.
11. Always steer the conversation back to the chosen topic {topic}.
12. Provide solutions related to this specific area of the relationship.
13. Do not say you are an AI agent or chatbot. Say you are a relationship advisor for couples.
14. After nurturing the conversation, for not too long, you can nicely end it with solutions focused on the topic {topic} and conversation history. List 5 of them maximum as bullet points.
15. Finish the conversation with a nice closing, synthetizing the conversation in one sentence, and a CTA to keep the conversation going.

Current conversation:
{history}
Human: {input}
AI: """

prompt = ChatPromptTemplate.from_messages([
    ("system", template),
    MessagesPlaceholder(variable_name="history"),
    ("human", "{input}")
])

conversations = {}

def generate_suggestions(response: str, conversation_history: List[str]) -> List[str]:
    # Don't generate suggestions if the AI is asking for the user's name
    if "may i know your name?" in response.lower() or "what's your name?" in response.lower():
        return []

    prompt = f"""
    Based on the following conversation history and the AI's last response, generate 3 short, relevant suggestions for how the user might respond. These suggestions should be from the user's perspective and help to further the conversation or address the relationship issue at hand.

    Conversation history:
    {' '.join(conversation_history[-5:])}  # Use the last 5 exchanges for context

    AI's last response:
    {response}

    Generate 3 suggestions, each no longer than 10 words. The suggestions should be diverse and cover different aspects or approaches to the conversation. Format your response as a numbered list:
    1.
    2.
    3.
    """

    for attempt in range(MAX_RETRIES):
        try:
            suggestions_response = llm.generate([prompt])
            suggestions = suggestions_response.generations[0][0].text.strip().split('\n')
            # Clean up suggestions (remove numbering, trim whitespace)
            suggestions = [s.split('.', 1)[-1].strip() for s in suggestions if s]
            return suggestions[:3]  # Ensure we return at most 3 suggestions
        except Exception as e:
            if attempt < MAX_RETRIES - 1:
                print(f"Attempt {attempt + 1} failed. Retrying in {RETRY_DELAY} seconds...")
                time.sleep(RETRY_DELAY)
            else:
                print(f"Error generating suggestions after {MAX_RETRIES} attempts: {str(e)}")
                return []  # Return an empty list instead of default suggestions

@app.route('/chat', methods=['POST'])
def chat():
    if llm is None:
        return jsonify({'error': 'ChatAnthropic is not initialized'}), 500

    try:
        data = request.json
        message = data.get('message')
        is_initial_context = data.get('isInitialContext', False)
        conversation_id = data.get('conversation_id')
        
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
                'name_provided': False,
                'context': None
            }
        
        conversation = conversations[conversation_id]
        
        if conversation['chain'] is None:
            return jsonify({'error': 'LLM chain is not initialized'}), 500
        
        try:
            if is_initial_context:
                context = json.loads(message)
                conversation['context'] = context
                initial_prompt = f"""
                Hi there! I'm Coopleo, your dedicated relationship advisor. I'm here to chat about your couple's well-being and offer support where I can. I already have some background information about your situation, which is great. Let's start with something simple – **what's your name?**
                """
                response = initial_prompt
                conversation['chain'].memory.save_context({"input": json.dumps(context)}, {"output": response})
                return jsonify({'response': response, 'suggestions': [], 'conversation_id': conversation_id})
            else:
                if not conversation['name_provided']:
                    user_name = message.strip()
                    context = conversation['context']
                    response = f"""
                    Nice to meet you, {user_name}! Thanks for sharing a bit about your relationship. I understand you'd like to focus on {context['topic']}. Could you tell me more about what's on your mind regarding this?
                    """
                    conversation['name_provided'] = True
                    conversation['chain'].memory.save_context({"input": user_name}, {"output": response})
                else:
                    context = conversation['context']
                    response = conversation['chain'].predict(
                        input=message,
                        state=context['state'],
                        mood=context['mood'],
                        location=context['location'],
                        topic=context['topic']
                    )
            
            contains_bullet_points = any(line.strip().startswith(('•', '-', '*')) for line in response.split('\n'))
            
            suggestions = []
            if not contains_bullet_points and conversation['name_provided']:
                suggestions = generate_suggestions(response, [str(msg.content) for msg in conversation['chain'].memory.chat_memory.messages])
            
            print(f"Response: {response}")
            print(f"Suggestions: {suggestions}")
            
            return jsonify({'response': response, 'suggestions': suggestions, 'conversation_id': conversation_id})
        except Exception as e:
            print(f"Error in conversation processing: {str(e)}")
            print(traceback.format_exc())
            return jsonify({'error': f'Error in AI processing: {str(e)}'}), 500
    except Exception as e:
        print(f"Error in /chat: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': f'An error occurred processing your request: {str(e)}'}), 500

@app.route('/reset', methods=['POST'])
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

if __name__ == '__main__':
    app.run(debug=True, port=5000)