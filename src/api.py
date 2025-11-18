from fastapi import FastAPI
from pydantic import BaseModel
import os
import requests

app = FastAPI()

OPENROUTER_API_KEY = os.getenv("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")

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

