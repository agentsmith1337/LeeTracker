import { RevisionCard } from "@/components/RevisionCard";
import { CATEGORY_META } from "@/lib/categories";
import { formatDisplayDate, isDueToday, todayString } from "@/lib/dates";
import type { Revision, RevisionCategory } from "@/types/revision";

const CATEGORIES: RevisionCategory[] = ["CODING", "RIDDLE", "QUANT"];

interface RevisionTodayPanelProps {
  revisions: Revision[];
  onDelete: (id: string) => void;
  onReschedule: (id: string, revisionDate: string) => void;
}

export function RevisionTodayPanel({
  revisions,
  onDelete,
  onReschedule,
}: RevisionTodayPanelProps) {
  const dueToday = revisions.filter((revision) =>
    isDueToday(revision.revisionDate),
  );
  const grouped = CATEGORIES.map((category) => ({
    category,
    items: dueToday
      .filter((revision) => revision.category === category)
      .sort((a, b) => a.revisionDate.localeCompare(b.revisionDate)),
  }));

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Revision Today
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            {formatDisplayDate(todayString())}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-sm font-semibold ${
            dueToday.length > 0
              ? "bg-amber-100 text-amber-900 dark:bg-amber-900 dark:text-amber-100"
              : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
          }`}
        >
          {dueToday.length} due
        </span>
      </div>

      {dueToday.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-100 px-6 py-12 text-center dark:border-zinc-700 dark:bg-zinc-900">
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
            Nothing due today
          </p>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Add revisions below and they will appear here on their due date.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {grouped.map(({ category, items }) => {
            const meta = CATEGORY_META[category];
            return (
              <div
                key={category}
                className={`rounded-2xl border p-4 ${meta.section}`}
              >
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    {meta.label}
                  </h3>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${meta.badge}`}
                  >
                    {items.length}
                  </span>
                </div>
                {items.length === 0 ? (
                  <p className="text-sm text-zinc-600 dark:text-zinc-300">
                    No {meta.label.toLowerCase()} revisions due today.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {items.map((revision) => (
                      <RevisionCard
                        key={revision.id}
                        revision={revision}
                        variant="due"
                        onDelete={onDelete}
                        onReschedule={onReschedule}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}