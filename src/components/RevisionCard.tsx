"use client";

import { useState } from "react";
import { CategoryBadge } from "@/components/CategoryBadge";
import { PlatformBadge } from "@/components/PlatformBadge";
import { CATEGORY_META } from "@/lib/categories";
import {
  addMonths,
  addWeeks,
  daysUntil,
  formatDisplayDate,
  isOverdue,
  todayString,
} from "@/lib/dates";
import type { Revision } from "@/types/revision";

interface RevisionCardProps {
  revision: Revision;
  variant?: "default" | "due";
  onDelete: (id: string) => void;
  onReschedule: (id: string, revisionDate: string) => void;
}

const REMIND_BUTTON_CLASS =
  "rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 dark:bg-emerald-700 dark:hover:bg-emerald-600";

export function RevisionCard({
  revision,
  variant = "default",
  onDelete,
  onReschedule,
}: RevisionCardProps) {
  const [showReschedule, setShowReschedule] = useState(false);
  const [newDate, setNewDate] = useState(revision.revisionDate);
  const overdue = isOverdue(revision.revisionDate);
  const dueIn = daysUntil(revision.revisionDate);
  const categoryStyle = CATEGORY_META[revision.category];

  const handleReschedule = () => {
    if (newDate) {
      onReschedule(revision.id, newDate);
      setShowReschedule(false);
    }
  };

  const handleQuickRemind = (revisionDate: string) => {
    onReschedule(revision.id, revisionDate);
    setShowReschedule(false);
  };

  return (
    <article
      className={`group rounded-xl border p-4 transition-shadow hover:shadow-md ${
        variant === "due"
          ? overdue
            ? "border-rose-300 bg-rose-50 dark:border-rose-800 dark:bg-rose-950"
            : categoryStyle.card
          : "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <CategoryBadge category={revision.category} />
            {revision.platform && (
              <PlatformBadge platform={revision.platform} />
            )}
            {variant === "due" && overdue && (
              <span className="text-xs font-semibold text-rose-700 dark:text-rose-300">
                Overdue
              </span>
            )}
            {variant === "default" && dueIn > 0 && (
              <span className="text-xs text-zinc-600 dark:text-zinc-300">
                in {dueIn} days
              </span>
            )}
          </div>
          <h3 className="truncate text-base font-semibold text-zinc-900 dark:text-zinc-50">
            {revision.url ? (
              <a
                href={revision.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                {revision.title}
              </a>
            ) : (
              revision.title
            )}
          </h3>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
            Revision: {formatDisplayDate(revision.revisionDate)}
          </p>
        </div>
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={() => setShowReschedule((value) => !value)}
            className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Reschedule
          </button>
          <button
            type="button"
            onClick={() => onDelete(revision.id)}
            className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-zinc-500 transition-colors hover:bg-rose-100 hover:text-rose-700 dark:text-zinc-400 dark:hover:bg-rose-950 dark:hover:text-rose-300"
          >
            Delete
          </button>
        </div>
      </div>

      {variant === "due" && (
        <div className="mt-3 flex flex-wrap gap-2 border-t border-zinc-200 pt-3 dark:border-zinc-700">
          <button
            type="button"
            onClick={() => handleQuickRemind(addWeeks(1))}
            className={REMIND_BUTTON_CLASS}
          >
            +1 week
          </button>
          <button
            type="button"
            onClick={() => handleQuickRemind(addMonths(1))}
            className={REMIND_BUTTON_CLASS}
          >
            +1 month
          </button>
          <button
            type="button"
            onClick={() => handleQuickRemind(addMonths(3))}
            className={REMIND_BUTTON_CLASS}
          >
            +3 months
          </button>
        </div>
      )}

      {showReschedule && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-zinc-200 pt-3 dark:border-zinc-700">
          <input
            type="date"
            value={newDate}
            min={todayString()}
            onChange={(event) => setNewDate(event.target.value)}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          />
          <button
            type="button"
            onClick={handleReschedule}
            className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Save
          </button>
        </div>
      )}
    </article>
  );
}