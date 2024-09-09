import os
from supabase import create_client, Client

def get_supabase_client() -> Client:
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_KEY")
    return create_client(supabase_url, supabase_key)

def save_conversation(supabase: Client, session_id: str, user_message: str, ai_response: str):
    supabase.table("conversations").insert({
        "session_id": session_id,
        "user_message": user_message,
        "ai_response": ai_response
    }).execute()

def get_conversation_history(supabase: Client, session_id: str):
    result = supabase.table("conversations").select("*").eq("session_id", session_id).execute()
    return result.data

def create_session(supabase: Client):
    result = supabase.table("sessions").insert({}).execute()
    return result.data[0]['id']
