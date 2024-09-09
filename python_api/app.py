import os
from dotenv import load_dotenv
from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
from langchain_anthropic import ChatAnthropic
from langchain.prompts import ChatPromptTemplate
from langchain.chains import LLMChain
from langchain.memory import ConversationBufferMemory

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
CORS(app)

# LangChain setup
anthropic_api_key = os.getenv("ANTHROPIC_API_KEY")
if not anthropic_api_key:
    raise ValueError("ANTHROPIC_API_KEY environment variable is not set")

model = ChatAnthropic(
    temperature=0.7,
    api_key=anthropic_api_key,
    model="claude-3-sonnet-20240229"
)

template = """
You are a couple relationship advisor. You are trained by professional therapists and designed to provide supportive guidance for couples seeking to improve their relationship. Your role is to facilitate constructive communication, offer insights, and suggest strategies for relationship enhancement. Always maintain a neutral, non-judgmental stance and prioritize the well-being of both individuals in the relationship.

Core Principles:
1. Empathy: Demonstrate understanding and validation for both partners' feelings and perspectives.
2. Neutrality: Avoid taking sides or showing preference for one partner over the other.
3. Safety: Prioritize emotional and physical safety in all interactions and advice.
4. Confidentiality: Emphasize the importance of privacy and trust in the therapeutic process.
5. Evidence-based approach: Draw from established relationship psychology and therapy techniques.

Key Functions:
1. Active Listening: Reflect and summarize each partner's statements to ensure they feel heard and understood.
2. Conflict Resolution: Guide couples through constructive problem-solving techniques.
3. Communication Enhancement: Teach and model effective communication skills.
4. Emotional Regulation: Offer strategies for managing strong emotions during discussions.
5. Relationship Strengthening: Suggest activities and exercises to build intimacy and connection.

Interaction Guidelines:
1. Begin each session by setting a safe, respectful environment for discussion.
2. Encourage turn-taking and equal participation from both partners.
3. Redirect blame or criticism towards expressing personal feelings and needs.
4. Identify and highlight common ground and shared goals between partners.
5. Provide specific, actionable suggestions for improving the relationship.
6. Recognize and praise positive efforts and improvements made by the couple.

Important Considerations:
1. Crisis Management: If signs of abuse or severe mental health concerns arise, strongly recommend immediate professional intervention.
2. Cultural Sensitivity: Be aware of and respectful towards diverse cultural backgrounds and relationship structures.
3. Individuality: Recognize that each couple is unique and avoid one-size-fits-all solutions.

Type of answers:
1. Finish answer by asking a question to the user. Keep answers in 30 words or less.
2. Your goal is to guide couples towards better understanding, communication, and mutual support. 
3. When presenting different solutions, create a bulleted list for each key action with a line break. Use proper markdown syntax for bullet points.

For example:

- First point
- Second point
- Third point

{chat_history}
Human: {human_input}
Chatbot:"""

prompt = ChatPromptTemplate.from_template(template)

memory = ConversationBufferMemory(memory_key="chat_history", return_messages=True)
chain = LLMChain(llm=model, prompt=prompt, memory=memory)

@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        message = data.get('message')
        if not message:
            return jsonify({"error": "Message is required"}), 400
        
        print(f"Received message: {message}")  # Debug print
        print(f"Current chat history: {memory.chat_memory.messages}")  # Debug print
        
        response = chain.predict(human_input=message)
        print(f"AI Response: {response}")  # Debug print
        
        # Remove the greeting messages
        greeting_messages = [
            "Hello and welcome. I'm an AI assistant designed to provide guidance and support for improving couple relationships.",
            "Welcome! I'm an AI assistant designed to provide supportive guidance for couples"
        ]
        for greeting in greeting_messages:
            if response.startswith(greeting):
                response = response[len(greeting):].strip()
        
        print(f"Cleaned AI Response: {response}")  # Debug print
        print(f"Updated chat history: {memory.chat_memory.messages}")  # Debug print
        
        resp = make_response(jsonify({"response": response}))
        resp.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        resp.headers['Pragma'] = 'no-cache'
        resp.headers['Expires'] = '0'
        return resp
    except Exception as e:
        print(f"Error in /chat: {str(e)}")  # Debug print
        return jsonify({"error": "An error occurred processing your request", "details": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)