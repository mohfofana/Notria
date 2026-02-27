import OpenAI from "openai";
import "./load-env.js";

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.warn("OPENAI_API_KEY not found in environment variables");
}

export const openai = new OpenAI({
  apiKey: apiKey || "dummy-key",
});

export const CHAT_MODEL = "gpt-4o-mini";
