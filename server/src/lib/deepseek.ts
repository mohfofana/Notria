import OpenAI from "openai";
import "./load-env.js";

const apiKey = process.env.DEEPSEEK_API_KEY;

if (!apiKey) {
  console.warn("DEEPSEEK_API_KEY not found in environment variables");
}

export const deepseek = new OpenAI({
  baseURL: "https://api.deepseek.com",
  apiKey: apiKey || "dummy-key", // Use dummy key if not set
});

export const DEEPSEEK_MODEL = "deepseek-chat";
