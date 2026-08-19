"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import PathForm from "./PathForm";

export default function NewPathButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
      >
        <Plus size={16} /> New path
      </button>
      <PathForm open={open} onClose={() => setOpen(false)} />
    </>
  );
}