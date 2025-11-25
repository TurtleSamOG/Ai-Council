async function sendMessage() {
  const prompt = document.getElementById("prompt").value;

  appendMessage(prompt, "user");

  const res = await fetch("http://localhost:3000/api/debate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt })
  });

  const data = await res.json();

  let currentRound = 0;

  // SHOW DEBATE WITH ROUND HEADERS
  data.discussion.forEach(d => {

    if (d.round !== currentRound) {
      currentRound = d.round;

      appendMessage(`Round ${currentRound}`, "round-header");
    }

    appendMessage(
      d.message,
      "ai",
      d.ai,
      getAvatarForAI(d.ai)
    );
  });

  // FINAL ANSWER
  appendMessage(
    data.final,
    "ai",
    "Final",
    getAvatarForAI("Final")
  );
}

function appendMessage(text, sender, name = "", avatarUrl = "") {
  const chat = document.getElementById("chat");
  const wrapper = document.createElement("div");
  wrapper.className = "message " + sender + (name ? " ai-" + name : "");

  // avatar
  const avatar = document.createElement("div");
  avatar.className = "avatar";
  if (avatarUrl) {
    avatar.style.backgroundImage = `url(${avatarUrl})`;
    avatar.style.backgroundSize = "cover";
  }

  const content = document.createElement("div");
  content.className = "content";

  const nameEl = document.createElement("div");
  nameEl.className = "name";
  nameEl.textContent = name || "";

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = text;

  content.appendChild(nameEl);
  content.appendChild(bubble);

  wrapper.appendChild(avatar);
  wrapper.appendChild(content);
  chat.appendChild(wrapper);

  chat.scrollTop = chat.scrollHeight;
}

// Avatar per AI
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
