import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import OpenAI from "openai";
import "dotenv/config";

const app = express();
app.use(cors());
app.use(bodyParser.json());

// OpenAI client
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/* ==========================================
      MULTI-ROUND DEBATE ROUTE
   ========================================== */

app.post("/api/debate", async (req, res) => {
  try {
    const { prompt } = req.body;

    // All 3 AIs are hostile critics
    const agents = [
      {
        name: "Analyst",
        style:
          "You are a hostile critic. Respond aggressively, challenge everyone, mock weak logic, and be confrontational."
      },
      {
        name: "Critic",
        style:
          "You are an extremely aggressive critic. Attack bad arguments directly, be sharp, sarcastic, and confront everything said."
      },
      {
        name: "Synthesizer",
        style:
          "You are a ruthless critic. Challenge every previous idea viciously. Do not summarize—argue hard."
      }
    ];

    // This will store: round, ai, message
    let debateLog = [];

    // Shared conversation context for all AIs
    let conversationContext = [
      { role: "user", content: prompt }
    ];

    const ROUNDS = 3; // You can change to 4 if you want

    // === Debate rounds ===
    for (let round = 1; round <= ROUNDS; round++) {
      for (const agent of agents) {

        const messages = [
          { role: "system", content: agent.style },
          ...conversationContext
        ];

        const response = await client.chat.completions.create({
          model: "gpt-4.1-mini",
          messages,
          max_tokens: 80
        });

        const msg = response.choices[0].message.content;

        debateLog.push({
          round,
          ai: agent.name,
          message: msg
        });

        // Add to context so next AI reacts to it
        conversationContext.push({
          role: "assistant",
          content: `${agent.name}: ${msg}`
        });
      }
    }

    // Final = last Synthesizer message
    const final = debateLog
      .filter(m => m.ai === "Synthesizer")
      .slice(-1)[0].message;

    res.json({
      discussion: debateLog,
      final
    });

  } catch (err) {
    console.error("DEBATE ERROR:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ==========================================
      START SERVER
   ========================================== */

app.listen(3000, () => console.log("Server running on port 3000"));
