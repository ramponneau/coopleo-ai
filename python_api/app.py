import os
from dotenv import load_dotenv
from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
from langchain_anthropic import ChatAnthropic
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.memory import ConversationBufferMemory
from langchain.chains import LLMChain
import traceback
import json
import uuid

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})  # Be cautious with this in production

# Initialize ChatAnthropic model
try:
    llm = ChatAnthropic(model="claude-3-sonnet-20240229")
except Exception as e:
    print(f"Error initializing ChatAnthropic: {str(e)}")
    raise

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

Keep this context in mind throughout the conversation, but allow the user to freely discuss their concerns. Pay special attention to the chosen topic ({topic}) and provide tailored advice and insights related to this area of their relationship.

# Response Format

Structure your single, unified response as follows:
1. For the first interaction:
   a. A brief acknowledgment of the initial context (1-2 sentences).
   b. Ask for the user's name.

2. For subsequent interactions:
   a. Address the user by name if known. 
   b. A brief acknowledgment or validation of the user's previous statement.
   c. A concise piece of advice or insight related to the user's concern, focusing on the chosen topic when relevant.
   d. A single, focused follow-up question to encourage further discussion about the chosen topic.

Combine these elements into one cohesive response. Do not separate them into multiple messages or paragraphs.

# Rules

1. Make your answers as clear and concise as possible, limited to 3-4 sentences maximum.
2. Use Markdown bold syntax (**text**) to emphasize important words or phrases. Do not use asterisks (*) for emphasis.
3. When providing lists or step-by-step instructions, use proper Markdown formatting:
   - For numbered lists, use "1. ", "2. ", etc., each on a new line.
   - For bullet points, use "- " or "• ", each on a new line.
4. Never prescribe medication or provide medical advice.
5. Maintain strict confidentiality and remind users of privacy considerations when discussing sensitive topics.
6. Encourage open communication between partners while respecting individual privacy.
7. Avoid taking sides in disputes; instead, focus on facilitating understanding and compromise.
8. Be sensitive to cultural differences in relationship norms and expectations.
9. Promote healthy relationship practices and boundaries.
10. Never invent or assume the user's name. Always ask for it if unknown.
12. Always steer the conversation back to the chosen topic ({topic}) and provide solutions related to this specific area of the relationship.
13. Do not say you are an AI agent or chatbot. Say you are a relationship advisor for couples.
14. Ask only one question per response. Ensure your response ends with a single, clear question.

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

def create_response(content, status_code=200):
    resp = make_response(jsonify(content), status_code)
    resp.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    resp.headers['Pragma'] = 'no-cache'
    resp.headers['Expires'] = '0'
    return resp

@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        print("Received data:", data)
        
        message = data.get('message')
        is_initial_context = data.get('isInitialContext', False)
        conversation_id = data.get('conversation_id')
        
        if not message:
            return create_response({"error": "Message is required"}, 400)
        
        print(f"Received message: {message}")
        print(f"Is initial context: {is_initial_context}")
        print(f"Conversation ID: {conversation_id}")
        
        try:
            if is_initial_context or not conversation_id:
                conversation_id = str(uuid.uuid4())
                print(f"Creating new conversation with ID: {conversation_id}")
                memory = ConversationBufferMemory(return_messages=True, input_key="input", memory_key="history")
                conversations[conversation_id] = LLMChain(
                    llm=llm,
                    prompt=prompt,
                    verbose=True,
                    memory=memory
                )
            elif conversation_id not in conversations:
                return create_response({"error": "Invalid conversation ID"}, 400)
            
            conversation = conversations[conversation_id]
            
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
            
            # Ensure we only return a single response
            cleaned_response = ' '.join(str(response).split())
            
            print(f"AI Response: {cleaned_response}")
            return create_response({"response": cleaned_response, "conversation_id": conversation_id})
        except Exception as e:
            print(f"Error in conversation.predict: {str(e)}")
            print(traceback.format_exc())
            return create_response({"error": f"Error in AI processing: {str(e)}", "traceback": traceback.format_exc()}, 500)
    except Exception as e:
        print(f"Error in /chat: {str(e)}")
        print(traceback.format_exc())
        return create_response({"error": f"An error occurred processing your request: {str(e)}", "traceback": traceback.format_exc()}, 500)

@app.route('/reset', methods=['POST'])
def reset_conversation():
    try:
        data = request.json
        conversation_id = data.get('conversation_id')
        if conversation_id in conversations:
            del conversations[conversation_id]
        return create_response({"message": "Conversation reset successfully"})
    except Exception as e:
        print(f"Error in /reset: {str(e)}")
        return create_response({"error": "An error occurred resetting the conversation", "details": str(e)}, 500)

if __name__ == '__main__':
    app.run(debug=True, port=5000)