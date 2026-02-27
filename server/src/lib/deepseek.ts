import OpenAI from "openai";
import "./load-env.js";

export const deepseek = new OpenAI({
  baseURL: "https://api.deepseek.com",
  apiKey: process.env.DEEPSEEK_API_KEY,
});

export const DEEPSEEK_MODEL = "deepseek-chat";
