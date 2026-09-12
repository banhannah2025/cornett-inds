"use client";
import type { ComponentType, Dispatch, SetStateAction } from "react";
import {
  spiritualLayout as layout,
  spiritualTotals,
} from "./spiritual-outcomes";
export function SpiritualOutcomesEditor({
  values,
  onChange,
  Dictation,
}: {
  values: Record<string, string>;
  onChange: Dispatch<SetStateAction<Record<string, string>>>;
  Dictation: ComponentType<{ onText: (text: string) => void }>;
}) {
  const totals = spiritualTotals(values);
  function change(key: string, value: string) {
    onChange((current) => ({ ...current, [key]: value }));
  }
  return (
    <div className="stack">
      <div className="shift-range">
        <label>
          Report From
          <input
            type="date"
            value={values.from || ""}
            onChange={(e) => change("from", e.target.value)}
          />
        </label>
        <label>
          Report To
          <input
            type="date"
            min={values.from || undefined}
            value={values.to || ""}
            onChange={(e) => change("to", e.target.value)}
          />
        </label>
      </div>
      <p>
        Enter whole-number counts for each day. Blank counts remain blank;
        weekly totals calculate automatically.
      </p>
      <div className="outcomes-scroll">
        <table>
          <thead>
            <tr>
              <th>Activity</th>
              {layout.days.map((day) => (
                <th key={day}>
                  {day}
                  <input
                    aria-label={`${day} date`}
                    type="date"
                    value={values[`date.${day}`] || ""}
                    onChange={(e) => change(`date.${day}`, e.target.value)}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {layout.rows.map((row) => (
              <tr key={row.key}>
                <th scope="row">
                  {row.label}
                  {row.key.startsWith("recovery") && (
                    <>
                      <input
                        aria-label={`${row.label} name`}
                        maxLength={100}
                        value={values[`${row.key}.label`] || ""}
                        onChange={(e) =>
                          change(`${row.key}.label`, e.target.value)
                        }
                      />
                      <Dictation
                        onText={(text) =>
                          onChange((current) => ({
                            ...current,
                            [`${row.key}.label`]:
                              `${current[`${row.key}.label`] || ""} ${text}`.trim(),
                          }))
                        }
                      />
                    </>
                  )}
                </th>
                {layout.days.map((day) => (
                  <td key={day}>
                    <input
                      type="number"
                      min={0}
                      max={99999}
                      step={1}
                      aria-label={`${row.label} ${day} count`}
                      value={values[`${row.key}.${day}`] || ""}
                      onChange={(e) =>
                        change(`${row.key}.${day}`, e.target.value)
                      }
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="shift-range">
        {layout.totals.map((total) => (
          <p key={total.key}>
            <strong>Total {total.label}: </strong>
            <output>{totals[total.key] || "—"}</output>
          </p>
        ))}
      </div>
    </div>
  );
}
