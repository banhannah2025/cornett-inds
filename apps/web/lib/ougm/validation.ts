import type { CalendarEntry } from "../../../ougm/src/index";
import layout from "../../../ougm/src/spiritual-outcomes-layout.json";
export function validateCalendar(data: unknown): CalendarEntry[] {
  if (!Array.isArray(data) || data.length > 2000)
    throw new Error("Select a valid schedule.");
  const ids = new Set<string>();
  return data.map((value) => {
    if (!value || typeof value !== "object")
      throw new Error("Invalid calendar entry.");
    const v = value as Record<string, unknown>;
    const required = ["id", "title", "date", "time", "category", "notes"];
    const optional = ["staff", "endDate", "endTime"];
    if (
      Object.keys(v).some(
        (key) => !required.includes(key) && !optional.includes(key),
      )
    )
      throw new Error("Unsupported calendar field.");
    for (const key of required)
      if (typeof v[key] !== "string")
        throw new Error("Invalid calendar field.");
    if (
      !/^[A-Za-z0-9_-]{1,100}$/.test(v.id as string) ||
      ids.has(v.id as string)
    )
      throw new Error("Invalid or duplicate calendar ID.");
    ids.add(v.id as string);
    for (const key of [...required, ...optional])
      if (
        v[key] !== undefined &&
        (typeof v[key] !== "string" ||
          (v[key] as string).length > (key === "notes" ? 4000 : 160))
      )
        throw new Error("Calendar field is too long.");
    if (
      !date(v.date as string) ||
      ((v.time as string) && !time(v.time as string))
    )
      throw new Error("Select a valid calendar date and time.");
    if (
      v.category === "Staff Shift" &&
      (!String(v.staff || "").trim() ||
        !date(String(v.endDate || "")) ||
        !time(String(v.time || "")) ||
        !time(String(v.endTime || "")) ||
        `${v.endDate}T${v.endTime}` <= `${v.date}T${v.time}`)
    )
      throw new Error("Check the staff shift name and start/end times.");
    return Object.fromEntries(
      [...required, ...optional]
        .filter((key) => v[key] !== undefined)
        .map((key) => [key, v[key]]),
    ) as CalendarEntry;
  });
}
export function validateSpiritual(data: unknown): Record<string, string> {
  if (!data || typeof data !== "object" || Array.isArray(data))
    throw new Error("Invalid spiritual outcomes report.");
  const allowed = new Set([
    "from",
    "to",
    ...layout.days.map((day) => `date.${day}`),
    ...layout.rows.flatMap((row) =>
      layout.days.map((day) => `${row.key}.${day}`),
    ),
    ...layout.rows
      .filter((row) => row.key.startsWith("recovery"))
      .map((row) => `${row.key}.label`),
  ]);
  const values = data as Record<string, unknown>;
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(values)) {
    if (!allowed.has(key) || typeof value !== "string")
      throw new Error("Unsupported spiritual outcomes field.");
    if (key === "from" || key === "to" || key.startsWith("date.")) {
      if (value && !date(value)) throw new Error("Select valid report dates.");
    } else if (key.endsWith(".label")) {
      if (value.length > 100)
        throw new Error(
          "Recovery meeting names must be 100 characters or fewer.",
        );
    } else if (value && !/^\d{1,5}$/.test(value))
      throw new Error("Enter whole-number counts from 0 to 99999.");
    result[key] = value;
  }
  if (!result.from || !result.to || result.to < result.from)
    throw new Error("Select report start and end dates before saving.");
  return result;
}
function date(value: string) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !isNaN(Date.parse(`${value}T12:00:00Z`)) &&
    new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) === value
  );
}
function time(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}
