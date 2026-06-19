"use client";

import { useCallback, useEffect, useState } from "react";
import type { Revision, RevisionCategory } from "@/types/revision";

export function useRevisions() {
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRevisions = useCallback(async () => {
    const response = await fetch("/api/revisions");
    if (response.ok) {
      const data = (await response.json()) as Revision[];
      setRevisions(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRevisions();
  }, [fetchRevisions]);

  const addRevision = useCallback(
    async (payload: {
      category: RevisionCategory;
      title: string;
      url?: string;
      platform?: string;
      revisionDate: string;
    }) => {
      const response = await fetch("/api/revisions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? "Failed to add revision.");
      }

      const revision = (await response.json()) as Revision;
      setRevisions((current) =>
        [...current, revision].sort((a, b) =>
          a.revisionDate.localeCompare(b.revisionDate),
        ),
      );
    },
    [],
  );

  const deleteRevision = useCallback(async (id: string) => {
    const response = await fetch(`/api/revisions/${id}`, { method: "DELETE" });
    if (response.ok) {
      setRevisions((current) => current.filter((item) => item.id !== id));
    }
  }, []);

  const rescheduleRevision = useCallback(
    async (id: string, revisionDate: string) => {
      const response = await fetch(`/api/revisions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ revisionDate }),
      });

      if (response.ok) {
        const updated = (await response.json()) as Revision;
        setRevisions((current) =>
          current
            .map((item) => (item.id === id ? updated : item))
            .sort((a, b) => a.revisionDate.localeCompare(b.revisionDate)),
        );
      }
    },
    [],
  );

  return {
    revisions,
    loading,
    addRevision,
    deleteRevision,
    rescheduleRevision,
    refresh: fetchRevisions,
  };
}