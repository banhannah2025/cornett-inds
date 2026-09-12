"use client";
import { useState, type Dispatch, type SetStateAction } from "react";
import type { CalendarEntry } from "./index";
export function StaffShifts({
  entries,
  onChange,
  month,
  date,
  loaded,
  editing,
  onEdit,
}: {
  entries: CalendarEntry[];
  onChange: Dispatch<SetStateAction<CalendarEntry[]>>;
  month: string;
  date: string;
  loaded: boolean;
  editing: string | null;
  onEdit: (id: string | null) => void;
}) {
  const blank = {
    staff: "",
    role: "Security",
    date,
    time: "",
    endDate: date,
    endTime: "",
    notes: "",
  };
  const [draft, setDraft] = useState(() => {
    const shift = entries.find((e) => e.id === editing);
    return shift
      ? {
          staff: shift.staff || "",
          role: shift.title,
          date: shift.date,
          time: shift.time,
          endDate: shift.endDate || shift.date,
          endTime: shift.endTime || "",
          notes: shift.notes,
        }
      : blank;
  });
  const [filter, setFilter] = useState("");
  const [error, setError] = useState("");
  const shifts = entries
    .filter(
      (e) =>
        e.category === "Staff Shift" &&
        e.date <= `${month}-31` &&
        (e.endDate || e.date) >= `${month}-01` &&
        (!filter || e.staff === filter),
    )
    .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));
  function reset() {
    onEdit(null);
    setDraft({ ...blank, date, endDate: date });
    setError("");
  }
  return (
    <section id="staff-shifts" className="panel stack">
      <h3>Staff shifts</h3>
      <p>
        Review staff coverage for this month, including overnight shifts. Shifts
        also appear on the office calendar. Saved on this device for your
        account.
      </p>
      <label>
        View Staff
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All Staff</option>
          {Array.from(
            new Set(
              entries
                .filter((e) => e.category === "Staff Shift")
                .map((e) => e.staff || ""),
            ),
          )
            .filter(Boolean)
            .sort()
            .map((name) => (
              <option key={name}>{name}</option>
            ))}
        </select>
      </label>
      <div className="shift-table-scroll">
        <table>
          <thead>
            <tr>
              <th>Staff</th>
              <th>Role</th>
              <th>Begins</th>
              <th>Ends</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {shifts.map((shift) => (
              <tr key={shift.id}>
                <td>{shift.staff}</td>
                <td>{shift.title}</td>
                <td>
                  {shift.date} {shift.time}
                </td>
                <td>
                  {shift.endDate} {shift.endTime}
                </td>
                <td>{shift.notes}</td>
                <td>
                  <button type="button" onClick={() => onEdit(shift.id)}>
                    Edit
                  </button>
                  <button
                    type="button"
                    className="quiet"
                    onClick={() => {
                      onChange((all) => all.filter((e) => e.id !== shift.id));
                      if (editing === shift.id) reset();
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!shifts.length && <p>No shifts match this month and staff selection.</p>}
      <form
        className="stack"
        onSubmit={(e) => {
          e.preventDefault();
          if (!draft.staff.trim()) {
            setError("Enter a staff name.");
            return;
          }
          if (
            `${draft.endDate}T${draft.endTime}` <= `${draft.date}T${draft.time}`
          ) {
            setError(
              "The shift must end after it begins. Choose the following date for overnight shifts.",
            );
            return;
          }
          onChange((all) => [
            ...all.filter((e) => e.id !== editing),
            {
              id: editing || crypto.randomUUID(),
              title: draft.role,
              category: "Staff Shift",
              staff: draft.staff.trim(),
              date: draft.date,
              time: draft.time,
              endDate: draft.endDate,
              endTime: draft.endTime,
              notes: draft.notes,
            },
          ]);
          reset();
        }}
      >
        <h4>{editing ? "Edit Staff Shift" : "Add Staff Shift"}</h4>
        <div className="shift-range">
          <label>
            Staff Name
            <input
              required
              maxLength={160}
              value={draft.staff}
              onChange={(e) =>
                setDraft((d) => ({ ...d, staff: e.target.value }))
              }
            />
          </label>
          <label>
            Role
            <select
              value={draft.role}
              onChange={(e) =>
                setDraft((d) => ({ ...d, role: e.target.value }))
              }
            >
              {[
                "Security",
                "Night Shelter",
                "Office",
                "Maintenance",
                "Kitchen",
                "Other",
              ].map((role) => (
                <option key={role}>{role}</option>
              ))}
            </select>
          </label>
          <label>
            Start Date
            <input
              required
              type="date"
              value={draft.date}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  date: e.target.value,
                  endDate: d.endDate === d.date ? e.target.value : d.endDate,
                }))
              }
            />
          </label>
          <label>
            Start Time
            <input
              required
              type="time"
              value={draft.time}
              onChange={(e) =>
                setDraft((d) => ({ ...d, time: e.target.value }))
              }
            />
          </label>
          <label>
            End Date
            <input
              required
              type="date"
              min={draft.date}
              value={draft.endDate}
              onChange={(e) =>
                setDraft((d) => ({ ...d, endDate: e.target.value }))
              }
            />
          </label>
          <label>
            End Time
            <input
              required
              type="time"
              value={draft.endTime}
              onChange={(e) =>
                setDraft((d) => ({ ...d, endTime: e.target.value }))
              }
            />
          </label>
        </div>
        <label>
          Notes
          <textarea
            maxLength={2000}
            value={draft.notes}
            onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
          />
        </label>
        {error && <p role="alert">{error}</p>}
        <button disabled={!loaded}>
          {editing ? "Save Shift Changes" : "Add Shift"}
        </button>
        {editing && (
          <button className="quiet" type="button" onClick={reset}>
            Cancel Edit
          </button>
        )}
      </form>
    </section>
  );
}
