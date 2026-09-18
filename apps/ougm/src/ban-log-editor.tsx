"use client";

import type { ComponentType, Dispatch, SetStateAction } from "react";

export function BanLogEditor({
  values,
  onChange,
  Dictation,
}: {
  values: Record<string, string>;
  onChange: Dispatch<SetStateAction<Record<string, string>>>;
  Dictation: ComponentType<{ onText: (text: string) => void }>;
}) {
  function change(key: string, value: string) {
    onChange((current) => ({ ...current, [key]: value }));
  }

  return (
    <div className="stack ban-log-editor">
      <p>
        Complete an incident report for every ban or trespass lasting more than
        24 hours. Enter unknown male or unknown female in pencil on a printed
        copy only.
      </p>
      {[1, 2].map((side) => (
        <details key={side} open={side === 1}>
          <summary>Side {side} - rows {(side - 1) * 22 + 1} through {side * 22}</summary>
          <div className="stack">
            {Array.from({ length: 22 }, (_, index) => {
              const row = (side - 1) * 22 + index + 1;
              const prefix = `ban.${row}`;
              const endDate = values[`${prefix}.endDate`] || "";
              const trespass = values[`${prefix}.trespass`] || "";
              const priority = endDate === "TFN" || trespass === "Yes";
              return (
                <fieldset
                  className={`shift-entry stack${priority ? " ban-priority" : ""}`}
                  key={row}
                >
                  <legend>Ban / trespass row {row}</legend>
                  <div className="ban-log-row">
                    <label>
                      Name
                      <input
                        maxLength={300}
                        value={values[`${prefix}.name`] || ""}
                        onChange={(event) =>
                          change(`${prefix}.name`, event.target.value)
                        }
                      />
                    </label>
                    <label>
                      Start Date
                      <input
                        type="date"
                        value={values[`${prefix}.startDate`] || ""}
                        onChange={(event) =>
                          change(`${prefix}.startDate`, event.target.value)
                        }
                      />
                    </label>
                    <label>
                      End
                      <select
                        className={endDate === "TFN" ? "ban-alert" : undefined}
                        value={endDate === "TFN" ? "TFN" : "date"}
                        onChange={(event) =>
                          change(
                            `${prefix}.endDate`,
                            event.target.value === "TFN" ? "TFN" : "",
                          )
                        }
                      >
                        <option value="date">Use End Date</option>
                        <option value="TFN">TFN - Till Further Notice</option>
                      </select>
                    </label>
                    {endDate !== "TFN" && (
                      <label>
                        End Date
                        <input
                          type="date"
                          min={values[`${prefix}.startDate`] || undefined}
                          value={endDate}
                          onChange={(event) =>
                            change(`${prefix}.endDate`, event.target.value)
                          }
                        />
                      </label>
                    )}
                    <label>
                      Trespass?
                      <select
                        className={trespass === "Yes" ? "ban-alert" : undefined}
                        value={trespass}
                        onChange={(event) =>
                          change(`${prefix}.trespass`, event.target.value)
                        }
                      >
                        <option value="">Not Specified</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </label>
                  </div>
                  <label>
                    Reason / Notes
                    <textarea
                      rows={2}
                      maxLength={4000}
                      value={values[`${prefix}.reason`] || ""}
                      onChange={(event) =>
                        change(`${prefix}.reason`, event.target.value)
                      }
                    />
                  </label>
                  <Dictation
                    onText={(text) =>
                      onChange((current) => ({
                        ...current,
                        [`${prefix}.reason`]:
                          `${current[`${prefix}.reason`] || ""} ${text}`.trim(),
                      }))
                    }
                  />
                </fieldset>
              );
            })}
          </div>
        </details>
      ))}
    </div>
  );
}
