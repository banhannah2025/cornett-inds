"use client";
import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
export function PhotoInput({
  values,
  onChange,
}: {
  values: Record<string, string>;
  onChange: Dispatch<SetStateAction<Record<string, string>>>;
}) {
  const reader = useRef<FileReader | null>(null);
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);
  useEffect(
    () => () => {
      reader.current?.abort();
    },
    [],
  );
  return (
    <fieldset className="stack">
      <legend>Identification Photo (3 × 5 Inches)</legend>
      <label>
        Add Photo
        <input
          ref={input}
          type="file"
          accept="image/jpeg,image/png"
          onChange={(e) => {
            reader.current?.abort();
            const file = e.target.files?.[0];
            if (!file) return;
            if (
              !["image/jpeg", "image/png"].includes(file.type) ||
              file.size > 8 * 1024 * 1024
            ) {
              setError("Choose a PNG or JPEG photo smaller than 8 MB.");
              return;
            }
            const next = new FileReader();
            reader.current = next;
            next.onload = () => {
              if (reader.current !== next) return;
              onChange((current) => ({
                ...current,
                photo: String(next.result),
              }));
              setError("");
            };
            next.onerror = () => setError("The photo could not be read.");
            next.readAsDataURL(file);
          }}
        />
      </label>
      {error && <p role="alert">{error}</p>}
      {values.photo && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- Private browser-only data URL must never reach an image optimizer. */}
          <img
            className="offender-photo"
            src={values.photo}
            alt="Identification photo preview"
          />
          <button
            type="button"
            className="quiet"
            onClick={() => {
              reader.current?.abort();
              onChange((current) => ({ ...current, photo: "" }));
              if (input.current) input.current.value = "";
            }}
          >
            Remove Photo
          </button>
        </>
      )}
      <p>
        The photo stays in this form until closed. Printing fits it within a
        tall 3″ × 5″ area without stretching.
      </p>
    </fieldset>
  );
}
