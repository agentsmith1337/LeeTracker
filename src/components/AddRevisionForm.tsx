"use client";

import { FormEvent, useState } from "react";
import { CATEGORY_META } from "@/lib/categories";
import { todayString } from "@/lib/dates";
import {
  detectPlatform,
  extractProblemName,
} from "@/lib/extractProblemName";
import type { RevisionCategory } from "@/types/revision";

const CATEGORIES: RevisionCategory[] = ["CODING", "RIDDLE", "QUANT"];

interface AddRevisionFormProps {
  onAdd: (payload: {
    category: RevisionCategory;
    title: string;
    url?: string;
    platform?: string;
    revisionDate: string;
  }) => Promise<void>;
}

export function AddRevisionForm({ onAdd }: AddRevisionFormProps) {
  const [category, setCategory] = useState<RevisionCategory>("CODING");
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [revisionDate, setRevisionDate] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const previewName =
    category === "CODING" && url.trim()
      ? title.trim() || extractProblemName(url.trim())
      : "";

  const resetForm = () => {
    setUrl("");
    setTitle("");
    setRevisionDate("");
    setError("");
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      if (!revisionDate) {
        throw new Error("Please pick a revision date.");
      }

      if (category === "CODING") {
        const trimmedUrl = url.trim();
        if (!trimmedUrl) throw new Error("Please enter a problem URL.");
        try {
          new URL(trimmedUrl);
        } catch {
          throw new Error("Please enter a valid URL.");
        }

        await onAdd({
          category,
          title: title.trim() || extractProblemName(trimmedUrl),
          url: trimmedUrl,
          platform: detectPlatform(trimmedUrl),
          revisionDate,
        });
      } else {
        const trimmedTitle = title.trim();
        if (!trimmedTitle) throw new Error("Please enter a title.");

        const trimmedUrl = url.trim();
        if (trimmedUrl) {
          try {
            new URL(trimmedUrl);
          } catch {
            throw new Error("Please enter a valid URL.");
          }
        }

        await onAdd({
          category,
          title: trimmedTitle,
          url: trimmedUrl || undefined,
          revisionDate,
        });
      }

      resetForm();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to add revision.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        Add Revision
      </h2>

      <div className="mb-4 flex gap-1 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800">
        {CATEGORIES.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => {
              setCategory(item);
              setError("");
            }}
            className={`flex-1 rounded-lg px-2 py-2 text-xs font-semibold transition-colors sm:text-sm ${
              category === item
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-100"
                : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            {CATEGORY_META[item].label}
          </button>
        ))}
      </div>

      <p className="mb-4 text-sm text-zinc-500">
        {CATEGORY_META[category].formTitle}
      </p>

      <div className="space-y-4">
        {category === "CODING" ? (
          <>
            <div>
              <label
                htmlFor="url"
                className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Problem URL
              </label>
              <input
                id="url"
                type="url"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="LeetCode, GFG, Codeforces, HackerRank, CodeChef, CSES..."
                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none placeholder:text-zinc-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
            {previewName && (
              <p className="text-sm text-zinc-500">
                Detected name:{" "}
                <span className="font-medium text-zinc-800">{previewName}</span>
              </p>
            )}
            <div>
              <label
                htmlFor="coding-title"
                className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Name override{" "}
                <span className="font-normal text-zinc-400">(optional)</span>
              </label>
              <input
                id="coding-title"
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
          </>
        ) : (
          <>
            <div>
              <label
                htmlFor="title"
                className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Title
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder={
                  category === "RIDDLE"
                    ? "e.g. River crossing puzzle"
                    : "e.g. Probability — Bayes theorem"
                }
                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
            <div>
              <label
                htmlFor="optional-url"
                className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Link{" "}
                <span className="font-normal text-zinc-400">(optional)</span>
              </label>
              <input
                id="optional-url"
                type="url"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="Reference link, if any"
                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
          </>
        )}

        <div>
          <label
            htmlFor="revisionDate"
            className="mb-1.5 block text-sm font-medium text-zinc-700"
          >
            Revision date
          </label>
          <input
            id="revisionDate"
            type="date"
            value={revisionDate}
            min={todayString()}
            onChange={(event) => setRevisionDate(event.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>

        {error && <p className="text-sm text-rose-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-amber-600 disabled:opacity-60"
        >
          {submitting ? "Adding..." : "Add to tracker"}
        </button>
      </div>
    </form>
  );
}