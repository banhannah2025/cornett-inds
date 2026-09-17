"use client";

import type { Dispatch, SetStateAction } from "react";

export const initialMedicalInsideValues: Record<string, string> = {
  effectiveDate: "",
  updatedBy: "",
  authorizedBy: "",
  medical: "",
  workers: "",
  behaviorContingent: "",
  weatherDependent: "",
  staffPicks: "",
};

export function MedicalInsideListEditor({
  values,
  onChange,
}: {
  values: Record<string, string>;
  onChange: Dispatch<SetStateAction<Record<string, string>>>;
}) {
  function change(key: string, value: string) {
    onChange((current) => ({ ...current, [key]: value }));
  }

  return (
    <div className="stack medical-inside-editor">
      <p>
        Enter one person per line. Do not add, remove, or move names except as
        directed by Steve or Dawn.
      </p>
      <div className="medical-inside-meta">
        <label>
          Effective Date
          <input
            type="date"
            value={values.effectiveDate || ""}
            onChange={(event) => change("effectiveDate", event.target.value)}
          />
        </label>
        <label>
          Updated By
          <input
            maxLength={100}
            value={values.updatedBy || ""}
            onChange={(event) => change("updatedBy", event.target.value)}
          />
        </label>
        <label>
          Authorized By
          <input
            maxLength={100}
            value={values.authorizedBy || ""}
            onChange={(event) => change("authorizedBy", event.target.value)}
          />
        </label>
      </div>
      <div className="medical-inside-columns">
        <label>
          Medical
          <textarea
            rows={12}
            value={values.medical || ""}
            onChange={(event) => change("medical", event.target.value)}
          />
        </label>
        <label>
          Workers
          <textarea
            rows={12}
            value={values.workers || ""}
            onChange={(event) => change("workers", event.target.value)}
          />
        </label>
        <div className="stack">
          <label>
            Behavior Contingent
            <textarea
              rows={4}
              value={values.behaviorContingent || ""}
              onChange={(event) =>
                change("behaviorContingent", event.target.value)
              }
            />
          </label>
          <label>
            Weather Dependent
            <textarea
              rows={3}
              value={values.weatherDependent || ""}
              onChange={(event) =>
                change("weatherDependent", event.target.value)
              }
            />
          </label>
          <label>
            Other Staff Picks
            <textarea
              rows={8}
              value={values.staffPicks || ""}
              onChange={(event) => change("staffPicks", event.target.value)}
            />
          </label>
        </div>
      </div>
      <small>
        This security list remains only in the open form. Closing the modal
        clears edits; use Print form to create the updated PDF.
      </small>
    </div>
  );
}
