import { GoogleGenAI } from "@google/genai";
import { TEST_PROMPT } from "@/app/lib/prompts";

let client: GoogleGenAI | null = null;

export function getGemini(): GoogleGenAI {
  if (client) return client;
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("GEMINI_API_KEY is not set. Add it on the Settings page or to .env.local.");
  }
  client = new GoogleGenAI({ apiKey: key });
  return client;
}

export function geminiModel(): string {
  return process.env.GEMINI_MODEL ?? "gemini-3.6-flash";
}

export async function generateWithGemini(systemPrompt: string, userPrompt: string): Promise<string> {
  const ai = getGemini();
  const res = await ai.models.generateContent({
    model: geminiModel(),
    contents: userPrompt,
    config: {
      systemInstruction: systemPrompt,
      temperature: 0.4,
      maxOutputTokens: 4096,
    },
  });
  const text = res.text ?? res.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  if (!text) throw new Error("Gemini returned an empty response.");
  return text.trim();
}

export async function testGeminiConnection(): Promise<string> {
  const ai = getGemini();
  const res = await ai.models.generateContent({
    model: geminiModel(),
    contents: TEST_PROMPT,
  });
  return (res.text ?? "").trim();
}
