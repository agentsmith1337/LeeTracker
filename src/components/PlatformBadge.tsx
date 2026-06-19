import type { Platform } from "@/types/revision";

const PLATFORM_STYLES: Record<Platform, { label: string; className: string }> = {
  leetcode: {
    label: "LeetCode",
    className:
      "bg-amber-100 text-amber-800 ring-amber-300 dark:bg-amber-900 dark:text-amber-100 dark:ring-amber-700",
  },
  gfg: {
    label: "GFG",
    className:
      "bg-emerald-100 text-emerald-800 ring-emerald-300 dark:bg-emerald-900 dark:text-emerald-100 dark:ring-emerald-700",
  },
  codeforces: {
    label: "Codeforces",
    className:
      "bg-sky-100 text-sky-800 ring-sky-300 dark:bg-sky-900 dark:text-sky-100 dark:ring-sky-700",
  },
  hackerrank: {
    label: "HackerRank",
    className:
      "bg-green-100 text-green-800 ring-green-300 dark:bg-green-900 dark:text-green-100 dark:ring-green-700",
  },
  codechef: {
    label: "CodeChef",
    className:
      "bg-amber-100 text-amber-900 ring-amber-300 dark:bg-amber-900 dark:text-amber-100 dark:ring-amber-700",
  },
  cses: {
    label: "CSES",
    className:
      "bg-indigo-100 text-indigo-800 ring-indigo-300 dark:bg-indigo-900 dark:text-indigo-100 dark:ring-indigo-700",
  },
  other: {
    label: "Other",
    className:
      "bg-zinc-100 text-zinc-700 ring-zinc-300 dark:bg-zinc-800 dark:text-zinc-200 dark:ring-zinc-600",
  },
};

export function PlatformBadge({ platform }: { platform: string }) {
  const key = (platform in PLATFORM_STYLES ? platform : "other") as Platform;
  const style = PLATFORM_STYLES[key];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${style.className}`}
    >
      {style.label}
    </span>
  );
}