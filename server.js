import express from "express"; //web server framework
import cors from "cors"; //allows cross-origin requests
import bodyParser from "body-parser"; //parson JSON request bodies
import OpenAI from "openai"; //OpenAI API client
import "dotenv/config"; //Loads environment variables from .env



const app = express(); //Create Express application instance
app.use(cors()); //Allow requests from any origin
app.use(bodyParser.json()); //Parse JSON bodies into req.body
app.use(express.static("public")); //Server frontend files in /public folder

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY //Retrieve API key from environment
});

// ===== HYBRID LONG-TERM MEMORY =====
// Stored in RAM only (cleared when server restarts)
// Only the FINAL AI uses this memory for decision making
const longTermMemory = [];

// ===== AI COUNCIL DEBATE ROUTE =====
app.post("/api/debate", async (req, res) => { //POST /api/debate
  try {
    const { prompt } = req.body; //Extract user input from the POST body

    // Council of AIs
    const agents = [  //AI characteristics
      {
        name: "Analyst",
        style: `
          ROLE: The Analyst.
          BEHAVIOR:
          - Break the user's message into logical parts.
          - Explain assumptions, context, and structure.
          - Identify important details the user might miss.
          - Keep messages short and analytical.
          PERSONALITY:
          - Calm, clear, methodical, factual.
          - finish your sentance before 40 words reached
        `
      },
      {
        name: "Critic",
        style: `
          ROLE: The Critic.
          BEHAVIOR:
          - Play devil's advocate against the user and the Analyst.
          - Point out flaws, risks, contradictions, and issues.
          - Always challenge the previous reasoning.
          - Keep messages short, sharp, and skeptical.
          PERSONALITY:
          - Direct, confrontational, analytical aggression.
          - finish your sentance before 40 words reached
        `
      },
      {
        name: "Final",
        style: `
          ROLE: The Synthesizer (Final Decision Maker).
          BEHAVIOR:
          - Evaluate both the Analyst and the Critic.
          - Identify the strongest reasoning from each.
          - Choose a side OR produce a blended conclusion.
          - Give NEW reasoning that neither AI has stated yet.
          - Keep messages short, logical, and decisive.
          PERSONALITY:
          - Neutral, fair, diplomatic, authoritative.
          - finish your sentance before 40 words reached
        `
      }
    ];

    const debateLog = []; //stores current debate messages for the frontend

    // Current debate context (shared between Analyst & Critic & Final)
    let conversationContext = [
      { role: "user", content: prompt } //Start with user message
    ];

    const ROUNDS = 2; //discussion rounds

    // ===== ROUNDS: Analyst + Critic only (no long-term memory) =====
    for (let round = 1; round <= ROUNDS; round++) {
      for (const agent of agents.slice(0, 2)) { //Only Analyst + Critic
        const messages = [
          { role: "system", content: agent.style }, //AI role + personality
          ...conversationContext  //Entire debate so far
        ];

        const response = await client.chat.completions.create({ //Query OpenAI for the agent's response
          model: "gpt-4.1-mini",
          messages,
          max_tokens: 200 //Allow detailed responses
        });

        const msg = response.choices[0].message.content || ""; //Extract the model's message text

        debateLog.push({  //Save message o debate log for frontend
          round,
          ai: agent.name,
          message: msg
        });

        conversationContext.push({  //Add message to context so future AIs see it
          role: "assistant",
          content: `${agent.name}: ${msg}`
        });
      }
    }

    // ===== FINAL AI: uses long-term memory + this debate =====

    // Build a compact memory block (last 10 debates max)
    const recentMemory = longTermMemory.slice(-10); //limit size
    const memoryBlock = recentMemory
      .map((entry, i) => {
        return `Memory #${i + 1}
Topic: ${entry.prompt}
Analyst: ${entry.analyst}
Critic: ${entry.critic}
FinalDecision: ${entry.final}`;
      })
      .join("\n\n");

    const finalSystemContent = `
${agents[2].style}

You have access to your long-term memory of previous debates.

LONG-TERM MEMORY:
${memoryBlock || "No prior debates yet."}

Use this memory to improve your judgement and avoid repeating old reasoning word-for-word.
    `;

    const finalMessages = [ //Construct messages Final AI sees
      { role: "system", content: finalSystemContent },  //Its role + memory
      ...conversationContext //All debate rounds
    ];

    const finalResponse = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: finalMessages,
      max_tokens: 250
    });

    const final = finalResponse.choices[0].message.content || ""; //Extract Final AI message

    // ===== UPDATE LONG-TERM MEMORY (Hybrid) =====
    const analystMsgs = debateLog
      .filter(m => m.ai === "Analyst")
      .map(m => m.message)
      .join(" | ");

    const criticMsgs = debateLog
      .filter(m => m.ai === "Critic")
      .map(m => m.message)
      .join(" | ");

    longTermMemory.push({
      prompt, //Original user prompt
      analyst: analystMsgs,
      critic: criticMsgs,
      final //Final AI decision
    });

    // ===== RETURN TO FRONTEND =====
    res.json({
      discussion: debateLog,  //All analysis/Crytic responses
      final //Final AI decision
    });

  } catch (err) { //if anything fail an error will be returned
    console.error("DEBATE ERROR:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(3000, () => console.log("Server running on port 3000"));
