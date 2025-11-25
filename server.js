import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import OpenAI from "openai";
import "dotenv/config";



const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// ===== HYBRID LONG-TERM MEMORY =====
// Stored in RAM only (cleared when server restarts)
const longTermMemory = [];

// ===== AI COUNCIL DEBATE ROUTE =====
app.post("/api/debate", async (req, res) => {
  try {
    const { prompt } = req.body;

    // Council of AIs
    const agents = [
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

    const debateLog = [];

    // Current debate context (shared between Analyst & Critic & Final)
    let conversationContext = [
      { role: "user", content: prompt }
    ];

    const ROUNDS = 2;

    // ===== ROUNDS: Analyst + Critic only (no long-term memory) =====
    for (let round = 1; round <= ROUNDS; round++) {
      for (const agent of agents.slice(0, 2)) {
        const messages = [
          { role: "system", content: agent.style },
          ...conversationContext
        ];

        const response = await client.chat.completions.create({
          model: "gpt-4.1-mini",
          messages,
          max_tokens: 200
        });

        const msg = response.choices[0].message.content || "";
        debateLog.push({
          round,
          ai: agent.name,
          message: msg
        });

        conversationContext.push({
          role: "assistant",
          content: `${agent.name}: ${msg}`
        });
      }
    }

    // ===== FINAL AI: uses long-term memory + this debate =====

    // Build a compact memory block (last 10 debates max)
    const recentMemory = longTermMemory.slice(-10);
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

    const finalMessages = [
      { role: "system", content: finalSystemContent },
      ...conversationContext
    ];

    const finalResponse = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: finalMessages,
      max_tokens: 250
    });

    const final = finalResponse.choices[0].message.content || "";

    // ===== UPDATE LONG-TERM MEMORY (Hybrid C) =====
    const analystMsgs = debateLog
      .filter(m => m.ai === "Analyst")
      .map(m => m.message)
      .join(" | ");

    const criticMsgs = debateLog
      .filter(m => m.ai === "Critic")
      .map(m => m.message)
      .join(" | ");

    longTermMemory.push({
      prompt,
      analyst: analystMsgs,
      critic: criticMsgs,
      final
    });

    // ===== RETURN TO FRONTEND =====
    res.json({
      discussion: debateLog,
      final
    });

  } catch (err) {
    console.error("DEBATE ERROR:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(3000, () => console.log("Server running on port 3000"));
