from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from ai_setup import llm_chain, generate_summary
from supabase import create_client, Client
from typing import List
import os

app = FastAPI()

# Initialize Supabase client
supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(supabase_url, supabase_key)

class ChatInput(BaseModel):
    message: str
    session_id: str

class ChatResponse(BaseModel):
    response: str

class ConversationSummary(BaseModel):
    session_id: str
    summary: str

@app.post("/chat", response_model=ChatResponse)
async def chat(input: ChatInput):
    try:
        # Get the AI response
        response = llm_chain.predict(human_input=input.message)
        
        # Save the conversation to Supabase
        supabase.table("conversations").insert({
            "session_id": input.session_id,
            "user_message": input.message,
            "ai_response": response
        }).execute()
        
        return ChatResponse(response=response)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/summary/{session_id}", response_model=ConversationSummary)
async def get_summary(session_id: str):
    try:
        # Fetch the conversation history from Supabase
        result = supabase.table("conversations").select("user_message", "ai_response").eq("session_id", session_id).execute()
        
        # Combine the messages into a single string
        conversation_history = "\n".join([f"User: {msg['user_message']}\nAI: {msg['ai_response']}" for msg in result.data])
        
        # Generate a summary
        summary = generate_summary(conversation_history)
        
        return ConversationSummary(session_id=session_id, summary=summary)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/conversations/{session_id}", response_model=List[dict])
async def get_conversations(session_id: str):
    try:
        result = supabase.table("conversations").select("*").eq("session_id", session_id).execute()
        return result.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
