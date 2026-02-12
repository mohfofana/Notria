import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config({ path: "../.env" });

export const deepseek = new OpenAI({
  baseURL: "https://api.deepseek.com",
  apiKey: process.env.DEEPSEEK_API_KEY,
});

export const DEEPSEEK_MODEL = "deepseek-chat";
