from fastapi import FastAPI
from pydantic import BaseModel
from src.basic_assistant import BasicAssistant

app = FastAPI()
bot = BasicAssistant()

class UserMessage(BaseModel):
    message: str

@app.post("/chat")
def chat_endpoint(data: UserMessage):
    reply = bot.chat(data.message)
    return {"response": reply}
