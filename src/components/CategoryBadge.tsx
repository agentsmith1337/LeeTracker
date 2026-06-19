import { CATEGORY_META } from "@/lib/categories";
import type { RevisionCategory } from "@/types/revision";

export function CategoryBadge({ category }: { category: RevisionCategory }) {
  const meta = CATEGORY_META[category];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${meta.badge}`}
    >
      {meta.label}
    </span>
  );
}