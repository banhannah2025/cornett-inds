"use client";
import type { ComponentType, Dispatch, SetStateAction } from "react";
export function ShelterLogEditor({
  values,
  onChange,
  Dictation,
}: {
  values: Record<string, string>;
  onChange: Dispatch<SetStateAction<Record<string, string>>>;
  Dictation: ComponentType<{ onText: (text: string) => void }>;
}) {
  function field(key: string, label: string, date = false) {
    return (
      <div className="stack" key={key}>
        <label>
          {label}
          <input
            type={date ? "date" : "text"}
            value={values[key] || ""}
            maxLength={date ? undefined : 500}
            onChange={(e) =>
              onChange((current) => ({ ...current, [key]: e.target.value }))
            }
          />
        </label>
        {!date && (
          <Dictation
            onText={(text) =>
              onChange((current) => ({
                ...current,
                [key]: `${current[key] || ""} ${text}`.trim(),
              }))
            }
          />
        )}
      </div>
    );
  }
  return (
    <div className="stack">
      <p>
        Enter names in the numbered slots on each side. Choose two-sided
        printing in your printer settings.
      </p>
      {(
        [
          ["male", "Male side", 50],
          ["female", "Female side", 38],
        ] as const
      ).map(([side, label, count]) => (
        <details key={side} open={side === "male"}>
          <summary>{label}</summary>
          <div className="stack">
            {field(`${side}.date`, `${label} date`, true)}
            <div className="shift-range">
              {Array.from({ length: count }, (_, i) =>
                field(`${side}.${i + 1}`, `${label} — slot ${i + 1} name`),
              )}
            </div>
          </div>
        </details>
      ))}
      <details>
        <summary>Quarantine</summary>
        <div className="stack">
          {Array.from({ length: 5 }, (_, i) => (
            <fieldset className="shift-entry stack" key={i}>
              <legend>Quarantine row {i + 1}</legend>
              {field(`quarantine.${i + 1}.name`, "Name")}
              {field(`quarantine.${i + 1}.location`, "Location")}
            </fieldset>
          ))}
        </div>
      </details>
    </div>
  );
}
