import type { RevisionCategory } from "@/lib/types";

export const CATEGORY_META: Record<
  RevisionCategory,
  { label: string; color: string; background: string; formTitle: string }
> = {
  CODING: {
    label: "Coding",
    color: "#92400e",
    background: "#fef3c7",
    formTitle: "Add a coding problem URL",
  },
  RIDDLE: {
    label: "Riddle",
    color: "#5b21b6",
    background: "#ede9fe",
    formTitle: "Add a riddle or puzzle",
  },
  QUANT: {
    label: "Quant",
    color: "#075985",
    background: "#e0f2fe",
    formTitle: "Add a quant topic",
  },
};

export const PLATFORM_LABELS: Record<string, string> = {
  leetcode: "LeetCode",
  gfg: "GFG",
  codeforces: "Codeforces",
  hackerrank: "HackerRank",
  codechef: "CodeChef",
  cses: "CSES",
  other: "Other",
};