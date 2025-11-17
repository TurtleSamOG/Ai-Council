from fastapi import FastAPI
from pydantic import BaseModel
from src.basic_assistant import BasicAssistant

app = FastAPI()

# ---- FIX: Define UserMessage BEFORE using it ----
class UserMessage(BaseModel):
    message: str

# Lazy-loaded model (important for Railway)
bot = None

@app.post("/chat")
def chat_endpoint(data: UserMessage):
    global bot
    if bot is None:
        bot = BasicAssistant()  # Load model only on first request
    reply = bot.chat(data.message)
    return {"response": reply}

