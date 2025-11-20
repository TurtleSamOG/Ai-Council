import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import OpenAI from "openai";
import "dotenv/config";

const app = express();
app.use(cors());
app.use(bodyParser.json());

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/* ===== MULTI-ROUND 3-AI DEBATE ROUTE ===== */

app.post("/api/debate", async (req, res) => {
  try {
    const { prompt } = req.body;

    const agents = [
      { name: "Analyst",      style: "You are the Analyst. Short logical analysis." },
      { name: "Critic",       style: "You are the Critic. Challenge or correct others." },
      { name: "Synthesizer",  style: "You are the Synthesizer. Combine ideas coherently into final answers." }
    ];

    let debateLog = [];

    let conversationContext = [
      { role: "user", content: prompt }
    ];

    const ROUNDS = 3;

    for (let round = 1; round <= ROUNDS; round++) {
      for (const agent of agents) {
        const messages = [
          { role: "system", content: agent.style },
          ...conversationContext
        ];

        const response = await client.chat.completions.create({
          model: "gpt-4.1-mini",
          messages,
          max_tokens: 60
        });

        const msg = response.choices[0].message.content;

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

    const final = debateLog
      .filter(x => x.ai === "Synthesizer")
      .slice(-1)[0].message;

    res.json({
      discussion: debateLog,
      final
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal error" });
  }
});

/* ===== START SERVER ===== */

app.listen(3000, () => console.log("Server running on port 3000"));
