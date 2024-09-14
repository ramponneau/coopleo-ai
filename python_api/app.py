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

# Tone

Use compassionate and empathetic tone while maintaining professionalism.

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
   a. A brief acknowledgment of the initial context (1-2 sentences).
   b. Ask for the user's name.
   c. Use the user's name in the conversation.

2. For subsequent interactions:
   a. Address the user by name if known. 
   b. A brief acknowledgment or validation of the user's previous statement.
   c. A concise piece of advice or insight related to the user's concern, focusing on the chosen topic when relevant.
   d. A single, focused follow-up question to encourage further discussion about the chosen topic.

Combine these elements into one cohesive response. Do not separate them into multiple messages or paragraphs.

# Rules

1. Make your answers as clear and concise as possible, limited to 2-3 sentences maximum.
2. Use Markdown bold syntax (**text**) to emphasize important words or phrases. Do not use asterisks (*) for emphasis.
3. Never prescribe medication or provide medical advice.
4. Maintain strict confidentiality and remind users of privacy considerations when discussing sensitive topics.
5. Encourage open communication between partners while respecting individual privacy.
6. Avoid taking sides in disputes; instead, focus on facilitating understanding and compromise.
7. Be sensitive to cultural differences in relationship norms and expectations.
8. Promote healthy relationship practices and boundaries.
9. Never invent or assume the user's name. Always ask for it if unknown.
10. Always steer the conversation back to the chosen topic {topic}.
11. Provide solutions related to this specific area of the relationship.
12. Do not say you are an AI agent or chatbot. Say you are a relationship advisor for couples.
13. Ask only one question per response. Ensure your response ends with a single, clear question.

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
                return ["Could you clarify that?", "How does that make you feel?", "What do you think we should do?"]

@app.route('/chat', methods=['POST'])
def chat():
    if llm is None:
        return jsonify({'error': 'ChatAnthropic is not initialized'}), 500

    try:
        data = request.json
        print("Received data:", data)
        
        message = data.get('message')
        is_initial_context = data.get('isInitialContext', False)
        conversation_id = data.get('conversation_id')
        
        if not message:
            return jsonify({'error': 'Message is required'}), 400
        
        print(f"Received message: {message}")
        print(f"Is initial context: {is_initial_context}")
        print(f"Conversation ID: {conversation_id}")
        
        if not conversation_id or conversation_id not in conversations:
            conversation_id = str(uuid.uuid4())
            print(f"Creating new conversation with ID: {conversation_id}")
            memory = ConversationBufferMemory(return_messages=True, input_key="input", memory_key="history")
            conversations[conversation_id] = LLMChain(
                llm=llm,
                prompt=prompt,
                verbose=True,
                memory=memory
            )
        
        conversation = conversations[conversation_id]
        
        for attempt in range(MAX_RETRIES):
            try:
                if is_initial_context:
                    context = json.loads(message)
                    initial_prompt = f"""
                    The user has provided the following information:
                    Current state of the relationship: {context['state']}
                    Current user mood: {context['mood']}
                    Current situation awareness: {context['location']}
                    Relationship topic to focus on: {context['topic']}

                    Based on this information, provide a single, concise initial response that acknowledges these details. Your response must be a single paragraph of 3-4 sentences maximum. Do not invent or assume any names. You need to respect the protocol and provide solutions focused on the chosen topic ({context['topic']}). End your response with a single question asking for the user's name.
                    """
                    response = conversation.predict(input=initial_prompt, state=context['state'], mood=context['mood'], location=context['location'], topic=context['topic'])
                else:
                    response = conversation.predict(input=message, state="", mood="", location="", topic="")
                
                # Get the conversation history
                conversation_history = [msg.content for msg in conversation.memory.chat_memory.messages]
                
                suggestions = generate_suggestions(response, conversation_history)
                
                print(f"AI Response: {response}")
                print(f"Suggestions: {suggestions}")
                
                return jsonify({'response': response, 'suggestions': suggestions, 'conversation_id': conversation_id})
            except Exception as e:
                if attempt < MAX_RETRIES - 1:
                    print(f"Attempt {attempt + 1} failed. Retrying in {RETRY_DELAY} seconds...")
                    time.sleep(RETRY_DELAY)
                else:
                    print(f"Error in conversation.predict after {MAX_RETRIES} attempts: {str(e)}")
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