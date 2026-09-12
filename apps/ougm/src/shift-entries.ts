export type ShiftEntry = {
  id: string;
  date: string;
  time: string;
  initials: string;
  notes: string;
};
export function parseShiftEntries(value: string | undefined): ShiftEntry[] {
  if (!value)
    return [{ id: "first-entry", date: "", time: "", initials: "", notes: "" }];
  try {
    const entries: unknown = JSON.parse(value);
    if (!Array.isArray(entries)) return [];
    return entries.filter(
      (entry): entry is ShiftEntry =>
        Boolean(entry) &&
        ["id", "date", "time", "initials", "notes"].every(
          (key) => typeof entry[key] === "string",
        ),
    );
  } catch {
    return [];
  }
}
