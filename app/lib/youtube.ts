import { YoutubeTranscript } from "youtube-transcript";

export function extractVideoId(url: string): string | null {
  const trimmed = url.trim();
  const patterns = [
    /(?:youtube\.com\/watch\?(?:.*&)?v=)([\w-]{11})/,
    /(?:youtu\.be\/)([\w-]{11})/,
    /(?:youtube\.com\/embed\/)([\w-]{11})/,
    /(?:youtube\.com\/shorts\/)([\w-]{11})/,
  ];
  for (const p of patterns) {
    const m = trimmed.match(p);
    if (m) return m[1];
  }
  return null;
}

export async function fetchYoutubeTranscript(url: string): Promise<string> {
  const videoId = extractVideoId(url);
  if (!videoId) {
    throw new Error("Could not find a valid YouTube video ID in that URL.");
  }

  let transcript: { text: string }[];
  try {
    transcript = await YoutubeTranscript.fetchTranscript(videoId, { lang: "en" });
  } catch {
    transcript = await YoutubeTranscript.fetchTranscript(videoId);
  }
  if (!transcript || transcript.length === 0) {
    throw new Error("No transcript available for this video (no captions, or captions are disabled).");
  }
  return transcript.map((seg) => seg.text).join(" ");
}
