from fastapi import FastAPI
from pydantic import BaseModel
from src.basic_assistant import BasicAssistant

app = FastAPI()
bot = None

@app.post("/chat")
def chat_endpoint(data: UserMessage):
    global bot
    if bot is None:
        bot = BasicAssistant()  # load model only when needed
    reply = bot.chat(data.message)
    return {"response": reply}
