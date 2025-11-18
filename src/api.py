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
    response = requests.post(
        "https://openrouter.ai/api/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://yourapp.com",
            "X-Title": "My AI Assistant"
        },
        json={
            "model": "cognitivecomputations/dolphin-mistral-24b-venice-edition:free",
            "messages": [
                {"role": "user", "content": data.message}
            ]
        }
    )

    result = response.json()

    # If OpenRouter returns an error
    if "error" in result:
        return {"response": f"OpenRouter Error: {result['error']['message']}"}

    # Normal response
    reply = result["choices"][0]["message"]["content"]
    return {"response": reply}


