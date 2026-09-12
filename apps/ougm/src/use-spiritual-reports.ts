"use client";
import { useEffect, useState, useCallback } from "react";
export type SpiritualReport = {
  id: string;
  revision: string;
  values: Record<string, string>;
  updatedAt: string;
};
export function useSpiritualReports(userId: string) {
  const [reports, setReports] = useState<SpiritualReport[]>([]);
  const [error, setError] = useState("");
  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch("/api/ougm/data/spiritual-outcomes", {
        cache: "no-store",
        signal,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setReports(data.reports);
      setError("");
    } catch (e) {
      if (!signal?.aborted)
        setError(
          e instanceof Error ? e.message : "Reports could not be loaded.",
        );
    }
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    setReports([]);
    void load(controller.signal);
    return () => controller.abort();
  }, [userId, load]);
  async function save(
    values: Record<string, string>,
    report?: { id: string; revision: string } | null,
  ) {
    const response = await fetch("/api/ougm/data/spiritual-outcomes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: values, ...report }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    const next = {
      id: data.id,
      revision: data.revision,
      values,
      updatedAt: data.updatedAt,
    };
    setReports((all) => [next, ...all.filter((r) => r.id !== next.id)]);
    return next;
  }
  async function remove(report: SpiritualReport) {
    try {
      const response = await fetch(
        `/api/ougm/data/spiritual-outcomes?id=${encodeURIComponent(report.id)}&revision=${encodeURIComponent(report.revision)}`,
        { method: "DELETE" },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setReports((all) => all.filter((r) => r.id !== report.id));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Report could not be deleted.");
    }
  }
  return { reports, error, load, save, remove };
}
