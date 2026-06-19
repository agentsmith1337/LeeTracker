"use client";

import { useMemo } from "react";
import { AddRevisionForm } from "@/components/AddRevisionForm";
import { RevisionCard } from "@/components/RevisionCard";
import { RevisionTodayPanel } from "@/components/RevisionTodayPanel";
import { CATEGORY_META } from "@/lib/categories";
import { isDueToday } from "@/lib/dates";
import { useRevisions } from "@/hooks/useRevisions";
import type { RevisionCategory } from "@/types/revision";

const CATEGORIES: RevisionCategory[] = ["CODING", "RIDDLE", "QUANT"];

export function RevisionsPage() {
  const {
    revisions,
    loading,
    addRevision,
    deleteRevision,
    rescheduleRevision,
  } = useRevisions();

  const upcomingByCategory = useMemo(() => {
    const upcoming = revisions.filter(
      (revision) => !isDueToday(revision.revisionDate),
    );
    return CATEGORIES.map((category) => ({
      category,
      items: upcoming
        .filter((revision) => revision.category === category)
        .sort((a, b) => a.revisionDate.localeCompare(b.revisionDate)),
    }));
  }, [revisions]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Loading your revisions...
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Revision Tracker
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Coding problems, riddles, and quant — all in one place
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-8">
          <RevisionTodayPanel
            revisions={revisions}
            onDelete={deleteRevision}
            onReschedule={rescheduleRevision}
          />

          <section className="space-y-5">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Upcoming
            </h2>
            {upcomingByCategory.every((group) => group.items.length === 0) ? (
              <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-100 px-6 py-8 text-center dark:border-zinc-700 dark:bg-zinc-900">
                <p className="text-sm text-zinc-400">No upcoming revisions yet.</p>
              </div>
            ) : (
              upcomingByCategory.map(({ category, items }) => {
                if (items.length === 0) return null;
                const meta = CATEGORY_META[category];
                return (
                  <div key={category}>
                    <div className="mb-3 flex items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${meta.badge}`}
                      >
                        {meta.label}
                      </span>
                      <span className="text-sm text-zinc-500 dark:text-zinc-400">
                        {items.length} scheduled
                      </span>
                    </div>
                    <div className="space-y-3">
                      {items.map((revision) => (
                        <RevisionCard
                          key={revision.id}
                          revision={revision}
                          onDelete={deleteRevision}
                          onReschedule={rescheduleRevision}
                        />
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </section>
        </div>

        <aside className="lg:sticky lg:top-8 lg:self-start">
          <AddRevisionForm onAdd={addRevision} />
        </aside>
      </div>
    </div>
  );
}