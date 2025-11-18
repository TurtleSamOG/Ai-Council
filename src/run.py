from basic_assistant import BasicAssistant

# Create the assistant object
bot = BasicAssistant()

print("AI assistant ready. Type 'exit' to quit.")

while True:
    msg = input("You: ")
    if msg.lower() == "exit":
        break

    # Generate and print model reply
    reply = bot.chat(msg)
    print("Bot:", reply)


