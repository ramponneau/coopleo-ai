import os
from dotenv import load_dotenv
from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
from langchain_anthropic import ChatAnthropic
from langchain_core.prompts import ChatPromptTemplate
from langchain.chains import ConversationChain
from langchain.memory import ConversationBufferMemory
import traceback
import json

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

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

Strict Single Question Protocol: 
The AI agent is required to adhere strictly to a protocol where after receiving a user input, it meticulously evaluates the response to identify the most critical piece of information needed to progress the consultation or task effectively. 
The AI agent will then formulate exactly one direct follow-up question to ask, ensuring it is focused, relevant, and succinct. 
This protocol mandates that under no circumstances should the assistant combine or enumerate multiple inquiries within a single user interaction. 
This approach aims to streamline the conversational flow, enhancing user comprehension and engagement.

# Tone

Use compassionate and empathetic tone while maintaining professionalism.

# Context

When the user starts a conversation for the first time, use the following context to guide the conversation:
* Relationship outlook: {{weather}}
* Current user mood: {{mood}}
* Current situation awareness : {{location}}
* Relationship topic to focus on: {{aspect}}

# Response Format

Structure your single, unified response as follows:
1. For the first interaction:
   a. Ask nicely if you can askfor the user's name.
   b. A brief acknowledgment or validation of the user's previous statement.
   c. A concise piece of advice or insight related to the user's concern.
2. For subsequent interactions:
   a. Address the user by name if known. 
   b. A brief acknowledgment or validation of the user's previous statement.
   c. A concise piece of advice or insight related to the user's concern.
3. Your single, focused follow-up question, unless it's about the user's name which you already know.

Combine these elements into one cohesive response. Do not separate them into multiple messages.

# Rules

1. Make your answers as clear and concise as possible.
2. Help the user by providing meaningful examples when applicable.
3. Use markdown to insist on important words. Use bullet points to list examples.
4. Use emojis judiciously to add a layer of emotion and tone to the conversation, while maintaining professionalism.
5. Never prescribe medication or provide medical advice.
6. Maintain strict confidentiality and remind users of privacy considerations when discussing sensitive topics.
7. Encourage open communication between partners while respecting individual privacy.
8. Avoid taking sides in disputes; instead, focus on facilitating understanding and compromise.
9. Be sensitive to cultural differences in relationship norms and expectations.
10. Promote healthy relationship practices and boundaries.

Current conversation:
{history}
Human: {input}
AI: """

prompt = ChatPromptTemplate.from_template(template)
memory = ConversationBufferMemory(return_messages=True)
conversation = ConversationChain(
    llm=llm,
    prompt=prompt,
    memory=memory,
    verbose=True
)

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
        message = data.get('message')
        is_initial_context = data.get('isInitialContext', False)
        
        if not message:
            return create_response({"error": "Message is required"}, 400)
        
        print(f"Received message: {message}")
        print(f"Is initial context: {is_initial_context}")
        
        try:
            if is_initial_context:
                context = json.loads(message)
                initial_prompt = f"""
                The user has provided the following information:
                Relationship outlook: {context['weather']}
                Current user mood: {context['mood']}
                Current situation awareness: {context['location']}
                Relationship topic to focus on: {context['aspect']}

                Based on this information, provide a single, concise initial response that acknowledges these details. Your response must be a single paragraph.Do not provide any advice or insights yet.
                """
                response = conversation.predict(input=initial_prompt)
            else:
                response = conversation.predict(input=message)
            
            # Ensure we only return a single response
            cleaned_response = response.split('\n')[0].strip()
            
            # If the response doesn't end with a question mark, add one
            if not cleaned_response.endswith('?'):
                cleaned_response += " What's your name?"
            
            print(f"AI Response: {cleaned_response}")
            return create_response({"response": cleaned_response})
        except Exception as e:
            print(f"Error in conversation.predict: {str(e)}")
            print(traceback.format_exc())
            return create_response({"error": f"Error in AI processing: {str(e)}"}, 500)
    except Exception as e:
        print(f"Error in /chat: {str(e)}")
        print(traceback.format_exc())
        return create_response({"error": f"An error occurred processing your request: {str(e)}"}, 500)

@app.route('/reset', methods=['POST'])
def reset_conversation():
    try:
        memory.clear()
        return create_response({"message": "Conversation reset successfully"})
    except Exception as e:
        print(f"Error in /reset: {str(e)}")
        return create_response({"error": "An error occurred resetting the conversation", "details": str(e)}, 500)

if __name__ == '__main__':
    app.run(debug=True, port=5000)