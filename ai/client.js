require("dotenv").config();
require('dotenv').config();
const OpenAI = require('openai');
// ...sisa file sama

const nvidia = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY,
  baseURL: 'https://integrate.api.nvidia.com/v1',
});

const PROVIDERS = [
  {
    id: 'glm47',
    model: 'z-ai/glm4.7',
    extra: {
      chat_template_kwargs: { enable_thinking: false },
      temperature: 0.88,
      top_p: 1,
      max_tokens: 1024,
    },
  },
  {
    id: 'minimax',
    model: 'minimaxai/minimax-m2.7',
    extra: {
      temperature: 0.88,
      top_p: 0.95,
      max_tokens: 1024,
    },
  },
];

function stripThink(text) {
  return text
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
    .trim();
}

async function callRyn(messages) {
  for (const p of PROVIDERS) {
    try {
      const res = await nvidia.chat.completions.create({
        model: p.model,
        messages,
        ...p.extra,
      });

      const raw   = res.choices[0]?.message?.content || '';
      const clean = stripThink(raw);
      if (clean) return clean;

    } catch (err) {
      console.error(`[AI:${p.id}] ${err.message}`);
    }
  }

  return 'maaf riz, aku lagi nggak bisa nyambung. coba lagi bentar ya.';
}

module.exports = { callRyn };
