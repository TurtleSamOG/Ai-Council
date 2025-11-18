from fastapi import FastAPI
from pydantic import BaseModel
import os
import requests

app = FastAPI()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

class UserMessage(BaseModel):
    message: str

@app.post("/chat")
def chat_endpoint(data: UserMessage):
    # Send message to OpenRouter
    response = requests.post(
        "https://openrouter.ai/api/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "HTTP-Referer": "yourdomain.com",  # optional but recommended
            "X-Title": "My AI Assistant",
            "Content-Type": "application/json"
        },
        json={
            "model": "cognitivecomputations/dolphin-mistral-24b-venice-edition:free",
            "messages": [
                {"role": "user", "content": data.message}
            ]
        }
    )

    result = response.json()
    reply = result["choices"][0]["message"]["content"]
    return {"response": reply}

