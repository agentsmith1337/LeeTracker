import type { RevisionCategory } from "@/types/revision";

export const CATEGORY_META: Record<
  RevisionCategory,
  {
    label: string;
    badge: string;
    section: string;
    card: string;
    formTitle: string;
  }
> = {
  CODING: {
    label: "Coding",
    badge:
      "bg-amber-100 text-amber-900 ring-amber-300 dark:bg-amber-900 dark:text-amber-100 dark:ring-amber-700",
    section:
      "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950",
    card:
      "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950",
    formTitle: "Add Coding Problem",
  },
  RIDDLE: {
    label: "Riddle",
    badge:
      "bg-violet-100 text-violet-900 ring-violet-300 dark:bg-violet-900 dark:text-violet-100 dark:ring-violet-700",
    section:
      "border-violet-200 bg-violet-50 dark:border-violet-800 dark:bg-violet-950",
    card:
      "border-violet-200 bg-violet-50 dark:border-violet-800 dark:bg-violet-950",
    formTitle: "Add Riddle Revision",
  },
  QUANT: {
    label: "Quant",
    badge:
      "bg-sky-100 text-sky-900 ring-sky-300 dark:bg-sky-900 dark:text-sky-100 dark:ring-sky-700",
    section:
      "border-sky-200 bg-sky-50 dark:border-sky-800 dark:bg-sky-950",
    card: "border-sky-200 bg-sky-50 dark:border-sky-800 dark:bg-sky-950",
    formTitle: "Add Quant Revision",
  },
};