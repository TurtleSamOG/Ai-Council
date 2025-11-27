async function sendMessage() {
  const promptInput = document.getElementById("prompt");
  const prompt = promptInput.value;

  // Clear input immediately
  promptInput.value = "";

  // USER MESSAGE
  appendMessage(prompt, "user");

  const res = await fetch("/api/debate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt })
  });

  const data = await res.json();

  // SEQUENTIAL AI MESSAGE DISPLAY
  for (let i = 0; i < data.discussion.length; i++) {
    const msg = data.discussion[i];

    await showTyping(msg.ai);
    appendMessage(msg.message, "ai", msg.ai, getAvatarForAI(msg.ai));
  }

  // FINAL ANSWER
  await showTyping("Final");
  appendMessage(data.final, "ai", "Final", getAvatarForAI("Final"));
}

/* typing indicator */
function showTyping(aiName) {
  return new Promise(resolve => {
    const chat = document.getElementById("chat");

    const wrap = document.createElement("div");
    wrap.className = "message ai typing";

    wrap.textContent = aiName + " is typing...";

    chat.appendChild(wrap);
    chat.scrollTop = chat.scrollHeight;

    setTimeout(() => {
      wrap.remove();
      resolve();
    }, 1400); // delay per message
  });
}

function appendMessage(text, sender, name = "", avatarUrl = "") {
  const chat = document.getElementById("chat");

  const wrapper = document.createElement("div");
  wrapper.className = "message " + sender + (name ? " " + name.toLowerCase() : "");

  let avatar = null;
  if (sender === "ai") {
    avatar = document.createElement("div");
    avatar.className = "avatar";
    avatar.style.backgroundImage = `url(${avatarUrl})`;
  }

  const content = document.createElement("div");
  content.className = "content";

  if (name) {
    const nameEl = document.createElement("div");
    nameEl.className = "name";
    nameEl.textContent = name;
    content.appendChild(nameEl);
  }

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = text;

  content.appendChild(bubble);

  if (sender === "ai") wrapper.appendChild(avatar);
  wrapper.appendChild(content);

  chat.appendChild(wrapper);
  chat.scrollTop = chat.scrollHeight;
}

function getAvatarForAI(name) {
  switch (name) {
    case "Analyst":
      return "https://api.dicebear.com/7.x/shapes/svg?seed=analyst";
    case "Critic":
      return "https://api.dicebear.com/7.x/shapes/svg?seed=critic";
    case "Synthesizer":
      return "https://api.dicebear.com/7.x/shapes/svg?seed=synth";
    case "Final":
      return "https://api.dicebear.com/7.x/shapes/svg?seed=final";
    default:
      return "";
  }
}

function handleKey(e) {
  if (e.key === "Enter") {
    sendMessage();
  }
}
