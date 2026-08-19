export function buildSummaryPrompt(content: string, levelLabel: string, extraInstructions: string): string {
  return `You are a study assistant helping a learner capture what they learned.
The learner is writing a summary for a ${levelLabel || "learning item"}.

Summarize the provided content in markdown with these sections:
- ## Key Concepts — the most important ideas, in bullet points.
- ## Details & Examples — concrete details, examples, and definitions worth remembering.
- ## Actionable Takeaways — what the learner should remember or practice.

Rules:
- Keep the original language of the content.
- Preserve code blocks verbatim where relevant.
- Be concise but complete; do not invent facts not present in the content.
- If the content is a video transcript, ignore repeated/verbal filler and focus on substance.

Content to summarize:

"""${content}"""

${extraInstructions ? `Additional instruction from the learner: ${extraInstructions}` : ""}

Write the summary in markdown now.`;
}

export const SUMMARIZE_SYSTEM_PROMPT =
  "You are a concise, structured study assistant. Output only valid markdown.";

export const TEST_PROMPT =
  "Reply with exactly: OK. Gemini connection works.";
