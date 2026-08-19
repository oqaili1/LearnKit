"use client";

import { useEffect, useState } from "react";
import { KeyRound, LoaderCircle, RefreshCw } from "lucide-react";
import { Button, Input } from "@/app/components/ui";

export default function SettingsPage() {
  const [configured, setConfigured] = useState(false);
  const [model, setModel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [modelInput, setModelInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        setConfigured(d.configured);
        setModel(d.model);
        setModelInput(d.model);
        setLoaded(true);
      });
  }, []);

  async function save() {
    setSaving(true);
    setMessage(null);
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey, model: modelInput }),
    });
    setSaving(false);
    const data = await res.json();
    if (!res.ok) {
      setMessage({ type: "err", text: data.error ?? "Could not save settings." });
      return;
    }
    setConfigured(data.configured);
    setModel(data.model);
    setModelInput(data.model);
    setApiKey("");
    setMessage({ type: "ok", text: "Saved to .env.local. Restart the dev server for the key to take effect." });
  }

  async function test() {
    setTesting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/test-gemini");
      const data = await res.json();
      setMessage(res.ok ? { type: "ok", text: data.message } : { type: "err", text: data.error });
    } catch {
      setMessage({ type: "err", text: "Could not reach the API." });
    } finally {
      setTesting(false);
    }
  }

  if (!loaded) {
    return <p className="text-sm text-zinc-500">Loading...</p>;
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Settings</h1>
      <p className="mt-1 text-sm text-zinc-500">
        LearnKit uses Google Gemini for AI summaries. The free tier is generous and plenty for
        summarizing learning content.
      </p>

      <div className="mt-6 space-y-5 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <div>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-800 dark:text-zinc-100">
            <KeyRound size={16} className="text-indigo-600 dark:text-indigo-400" /> Gemini API
          </h2>
          <div className={`mb-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
            configured
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
              : "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${configured ? "bg-emerald-500" : "bg-amber-500"}`} />
            {configured ? "API key configured" : "No API key set"}
          </div>
          {configured && (
            <p className="mb-3 text-xs text-zinc-500">
              Current key: <code className="rounded bg-zinc-100 px-1 py-0.5 dark:bg-zinc-800">GEMINI_API_KEY</code> in .env.local.{" "}
              <span className="inline-flex items-center gap-0.5"><RefreshCw size={11} /> Restart the server after changing it.</span>
            </p>
          )}
          <label className="mb-1 block text-xs font-medium text-zinc-500">
            {configured ? "Replace API key (optional)" : "API key *"}
          </label>
          <Input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="AIza... — get one free at aistudio.google.com"
          />
          <p className="mt-2 text-xs text-zinc-400">
            Get a free key at{" "}
            <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline dark:text-indigo-400">
              aistudio.google.com/apikey
            </a>
          </p>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500">Model</label>
          <Input
            value={modelInput}
            onChange={(e) => setModelInput(e.target.value)}
            placeholder="gemini-3.6-flash"
          />
          <p className="mt-1 text-xs text-zinc-400">
            Default: <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">{model}</code> (free tier).
          </p>
        </div>

        {message && (
          <p className={`text-sm ${message.type === "ok" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
            {message.text}
          </p>
        )}

        <div className="flex gap-2">
          <Button onClick={save} loading={saving} disabled={!apiKey && !modelInput}>Save</Button>
          <Button variant="secondary" onClick={test} loading={testing} disabled={!configured}>
            {testing ? <LoaderCircle size={14} className="animate-spin" /> : null}
            Test connection
          </Button>
        </div>
      </div>
    </div>
  );
}