import requests

def main():
    while True:
        msg = input("You: ")
        if not msg.strip():
            continue

        res = requests.post(
            "http://localhost:8000/chat",
            json={"message": msg}
        )

        try:
            data = res.json()
        except Exception:
            print("Invalid response:", res.text)
            continue

        print("AI:", data.get("response"))

if __name__ == "__main__":
    main()
