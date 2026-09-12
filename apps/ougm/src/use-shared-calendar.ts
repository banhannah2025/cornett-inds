"use client";
import { useEffect, useState, useCallback } from "react";
import type { CalendarEntry } from "./index";
export function useSharedCalendar(userId: string) {
  const [entries, setEntries] = useState<CalendarEntry[]>([]);
  const [baseline, setBaseline] = useState<CalendarEntry[]>([]);
  const [revision, setRevision] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const load = useCallback(async (signal?: AbortSignal) => {
    setError("");
    try {
      const response = await fetch("/api/ougm/data/calendar", {
        cache: "no-store",
        signal,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setEntries(result.data);
      setBaseline(result.data);
      setRevision(result.revision);
      setLoaded(true);
      setStatus("Saved schedule loaded.");
    } catch (e) {
      if (!signal?.aborted)
        setError(
          e instanceof Error ? e.message : "Schedule could not be loaded.",
        );
    }
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    setLoaded(false);
    setEntries([]);
    setBaseline([]);
    void load(controller.signal);
    return () => controller.abort();
  }, [userId, load]);
  const dirty = JSON.stringify(entries) !== JSON.stringify(baseline);
  async function save() {
    if (busy || !loaded) return;
    setBusy(true);
    setError("");
    const snapshot = entries;
    try {
      const response = await fetch("/api/ougm/data/calendar", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: snapshot, revision }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setRevision(result.revision);
      setBaseline(snapshot);
      setStatus("Schedule saved to Sanity.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Schedule could not be saved.");
    } finally {
      setBusy(false);
    }
  }
  function importDevice() {
    try {
      const old = JSON.parse(
        localStorage.getItem(`ougm-calendar:${userId}`) || "[]",
      );
      if (!Array.isArray(old)) throw new Error("Invalid device schedule.");
      const valid = old.filter(
        (e) =>
          e &&
          ["id", "title", "date", "time", "category", "notes"].every(
            (key) => typeof e[key] === "string",
          ),
      );
      setEntries((all) => [
        ...all,
        ...valid.filter((e) => !all.some((current) => current.id === e.id)),
      ]);
      setStatus(
        "Device entries added to the editor. Save Schedule to keep them in Sanity.",
      );
    } catch {
      setError("The old device schedule could not be imported.");
    }
  }
  return {
    entries,
    setEntries,
    loaded,
    busy,
    error,
    status,
    dirty,
    load,
    save,
    importDevice,
  };
}
