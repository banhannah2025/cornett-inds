"use client";
import type { ComponentType, Dispatch, SetStateAction } from "react";
import { parseShiftEntries, type ShiftEntry } from "./shift-entries";
export function ShiftNotesEditor({
  values,
  onChange,
  Dictation,
}: {
  values: Record<string, string>;
  onChange: Dispatch<SetStateAction<Record<string, string>>>;
  Dictation: ComponentType<{ onText: (text: string) => void }>;
}) {
  const entries = parseShiftEntries(values.entries);
  function save(next: ShiftEntry[]) {
    onChange((current) => ({ ...current, entries: JSON.stringify(next) }));
  }
  function edit(
    id: string,
    key: keyof Omit<ShiftEntry, "id">,
    value: string | ((previous: string) => string),
  ) {
    onChange((current) => ({
      ...current,
      entries: JSON.stringify(
        parseShiftEntries(current.entries).map((entry) =>
          entry.id === id
            ? {
                ...entry,
                [key]: typeof value === "function" ? value(entry[key]) : value,
              }
            : entry,
        ),
      ),
    }));
  }
  return (
    <div className="stack">
      <div className="shift-range">
        <label>
          Shift begins
          <input
            type="datetime-local"
            value={values.begin || ""}
            onChange={(e) =>
              onChange((current) => ({ ...current, begin: e.target.value }))
            }
          />
        </label>
        <label>
          Shift ends
          <input
            type="datetime-local"
            value={values.end || ""}
            onChange={(e) =>
              onChange((current) => ({ ...current, end: e.target.value }))
            }
          />
        </label>
      </div>
      <p>
        Enter each observation separately. Long notes continue into additional
        rows and pages when printed. Choose two-sided printing in your printer
        settings.
      </p>
      {entries.map((entry, index) => (
        <fieldset className="shift-entry stack" key={entry.id}>
          <legend>Entry {index + 1}</legend>
          <div className="shift-entry-meta">
            <label>
              Date
              <input
                type="date"
                value={entry.date}
                onChange={(e) => edit(entry.id, "date", e.target.value)}
              />
            </label>
            <label>
              Time
              <input
                type="time"
                value={entry.time}
                onChange={(e) => edit(entry.id, "time", e.target.value)}
              />
            </label>
            <label>
              Initials
              <input
                maxLength={50}
                value={entry.initials}
                onChange={(e) => edit(entry.id, "initials", e.target.value)}
              />
            </label>
          </div>
          <label>
            Notes
            <textarea
              rows={4}
              maxLength={20000}
              value={entry.notes}
              onChange={(e) => edit(entry.id, "notes", e.target.value)}
            />
          </label>
          <Dictation
            onText={(text) =>
              edit(entry.id, "notes", (previous) =>
                `${previous} ${text}`.trim(),
              )
            }
          />
          <button
            type="button"
            className="quiet"
            onClick={() => save(entries.filter((item) => item.id !== entry.id))}
          >
            Remove entry {index + 1}
          </button>
        </fieldset>
      ))}
      <button
        type="button"
        onClick={() =>
          save([
            ...entries,
            {
              id: crypto.randomUUID(),
              date: entries.at(-1)?.date || "",
              time: "",
              initials: entries.at(-1)?.initials || "",
              notes: "",
            },
          ])
        }
      >
        Add entry
      </button>
    </div>
  );
}
