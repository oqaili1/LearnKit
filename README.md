# LearnKit — Learning Summary Manager

A local-first web app to organize everything you learn — your own way.

Create a **learning path** (e.g. "Python for Data Science") and choose its structure:
Course → Module → Lesson, Book → Chapter → Section, free-form, or your own custom levels.
Every child level is generated automatically from the path's hierarchy.

For any item you can:

- Write your own markdown notes and track progress (not started / in progress / completed)
- Attach a source URL
- Generate an **AI summary** with Google Gemini (free tier):
  - paste text from a book/article/lesson
  - paste a video transcript
  - paste a YouTube URL (captions are fetched automatically)
- Keep a history of generated summaries, copy one into your notes, or delete it

## Tech

- Next.js 16 (App Router, TypeScript), Tailwind CSS 4
- SQLite via Prisma 7 (driver adapter `better-sqlite3`)
- Google Gemini via `@google/genai`
- `youtube-transcript` for YouTube captions

## Getting started

```bash
npm install        # runs prisma generate automatically (postinstall)

# free API key at https://aistudio.google.com/apikey
# either add it to .env.local, or after starting the app use Settings → save key
echo 'GEMINI_API_KEY="YOUR_KEY"' > .env.local

npm run dev
```

Open http://localhost:3000. The first time, set your Gemini key in **Settings** (the app
writes it to `.env.local`; restart the server afterwards).

> **Note:** the SQLite database (`dev.db`) is local and gitignored — each clone starts
> empty. `npm run dev` runs `prisma migrate deploy` automatically (`predev`), so the
> database is created with the correct schema on first run.

## Scripts

- `npm run dev` — dev server
- `npm run build && npm start` — production
- `npm run lint` — ESLint

## Notes

- `.env*` is gitignored so your API key is never committed.
- YouTube caption fetching can occasionally break if YouTube changes its internals;
  pasting a transcript manually is the reliable fallback.
