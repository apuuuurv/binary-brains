"""
farmer_chat.py  — Groq-powered Chatbot API for Farmer Scheme Assistant
Registered in main.py as:  app.include_router(farmer_chat.router, prefix="/api")
Exposed at: POST /api/farmer-chat

Uses Groq's API via the OpenAI-compatible SDK.
"""

import os
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from app.core.security import get_current_user

router = APIRouter(prefix="/farmer-chat", tags=["Farmer Chat"])

# ──────────────────────────────────────────────
# System Instruction for the AI
# ──────────────────────────────────────────────
SYSTEM_INSTRUCTION = """You are an AI assistant for Indian farmers called "AgriSense Assistant". 
Your job is to help farmers understand government agricultural schemes, subsidies, crop insurance 
programs, PM-Kisan benefits, irrigation schemes, soil health schemes, and other agriculture-related 
policies. Provide simple, clear, step-by-step explanations in easy language.

Guidelines:
- If eligibility depends on landholding, state, or crop type, ask clarifying questions.
- Avoid giving legal advice.
- If information is uncertain, say so clearly and suggest the farmer contact their local Krishi Vigyan Kendra or district agriculture office.
- Keep answers structured with headings and bullet points when needed.
- Focus ONLY on agriculture and Indian farmer welfare topics. Politely decline unrelated questions.
- Be warm, respectful, and supportive in tone.
- When listing schemes, include: Scheme Name, Eligibility, Benefit Amount, and How to Apply.
"""


class ChatRequest(BaseModel):
    message: str
    history: list = []  # list of {"role": "user"|"model", "parts": [{"text": "..."}]}


class ChatResponse(BaseModel):
    reply: str


def _get_groq_client():
    """Create and return an OpenAI client configured for Groq's API."""
    try:
        from openai import OpenAI
    except ImportError:
        raise HTTPException(
            status_code=500,
            detail="openai package is not installed. Run: pip install openai"
        )

    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=503,
            detail="GROQ_API_KEY is not configured. Please set it in the backend .env file."
        )

    client = OpenAI(
        api_key=api_key,
        base_url="https://api.groq.com/openai/v1",
    )
    return client


def _convert_history_to_openai(history: list) -> list:
    """
    Convert the Gemini-style history format to OpenAI-compatible messages.
    
    Gemini format:  [{"role": "user"|"model", "parts": [{"text": "..."}]}]
    OpenAI format:  [{"role": "user"|"assistant", "content": "..."}]
    """
    messages = []
    for item in history:
        role = item.get("role", "user")
        # Map Gemini's "model" role to OpenAI's "assistant"
        if role == "model":
            role = "assistant"
        
        parts = item.get("parts", [])
        content = ""
        if parts:
            if isinstance(parts[0], dict):
                content = parts[0].get("text", "")
            elif isinstance(parts[0], str):
                content = parts[0]
        
        if content:
            messages.append({"role": role, "content": content})
    
    return messages


@router.post("", response_model=ChatResponse)
async def farmer_chat(
    request: ChatRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Send a message to Groq and get a farming-focused response.
    Accepts previous history for multi-turn conversations.
    """
    # Validate input
    message = request.message.strip()
    if not message:
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    if len(message) > 2000:
        raise HTTPException(status_code=400, detail="Message too long (max 2000 characters).")

    try:
        client = _get_groq_client()

        # Build messages list: system prompt + conversation history + new message
        messages = [
            {"role": "system", "content": SYSTEM_INSTRUCTION}
        ]

        # Convert and append conversation history
        if request.history:
            messages.extend(_convert_history_to_openai(request.history))

        # Append the current user message
        messages.append({"role": "user", "content": message})

        # Call Groq API (using a fast Llama 3 model)
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
        )

        reply = completion.choices[0].message.content.strip()
        if not reply:
            reply = "I'm sorry, I couldn't generate a response. Please try rephrasing your question."

        return {"reply": reply}

    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e)
        # Handle rate limit errors
        if "429" in error_msg or "quota" in error_msg.lower() or "rate" in error_msg.lower():
            raise HTTPException(
                status_code=429,
                detail="Groq API rate limit reached. Please wait a moment and try again."
            )
        if "API_KEY" in error_msg.upper() or "authentication" in error_msg.lower() or "401" in error_msg:
            raise HTTPException(
                status_code=503,
                detail="Groq API authentication failed. Please check the GROQ_API_KEY."
            )
        raise HTTPException(
            status_code=500,
            detail=f"Chat service error: {error_msg}"
        )
