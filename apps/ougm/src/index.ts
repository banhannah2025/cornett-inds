export type CalendarEntry = {
  id: string;
  title: string;
  date: string;
  time: string;
  category: string;
  notes: string;
  staff?: string;
  endDate?: string;
  endTime?: string;
};
export function calendarEntryOnDay(entry: CalendarEntry, day: string): boolean {
  if (entry.category !== "Staff Shift") return entry.date === day;
  const end = entry.endDate || entry.date;
  return (
    entry.date <= day &&
    end >= day &&
    !(end === day && entry.endTime === "00:00" && end !== entry.date)
  );
}
export type SecurityTemplate = {
  id: string;
  title: string;
  description: string;
  fields: {
    key: string;
    label: string;
    multiline?: boolean;
    type?:
      | "date"
      | "time"
      | "datetime-local"
      | "checkbox"
      | "select"
      | "multiselect";
    options?: string[];
  }[];
  pdfUrl?: string;
};
export const securityTemplates: SecurityTemplate[] = [
  {
    id: "spiritual-outcomes",
    title: "Weekly Spiritual Outcomes Report",
    description:
      "Monday–Sunday activities, attendance, and calculated weekly totals.",
    pdfUrl: "/ougm/forms/spiritual-outcomes-fillable.pdf",
    fields: [],
  },
  {
    id: "shelter-log",
    title: "Security: Shelter Sign-In Log",
    description:
      "Male and female sign-in slots, dates, and quarantine names and locations.",
    pdfUrl: "/ougm/forms/shelter-log-fillable.pdf",
    fields: [],
  },
  {
    id: "shift-notes",
    title: "Security: Shift Notes / Security Log",
    description:
      "Shift beginning and end, with dated entries for time, initials, and notes.",
    pdfUrl: "/ougm/forms/shift-notes-fillable.pdf",
    fields: [],
  },
  {
    id: "incident-report",
    title: "Security: Incident Report",
    description:
      "Mission incident report for staff, guests, outcomes, and a detailed summary.",
    pdfUrl: "/ougm/forms/incident-report-fillable.pdf",
    fields: [
      { key: "dateFiled", label: "Date filed", type: "date" },
      { key: "receivedBy", label: "Received by (initial)" },
      { key: "staff", label: "Staff / volunteers involved", multiline: true },
      {
        key: "location",
        label: "Location(s) of incident",
        type: "multiselect",
        options: [
          "Foyer",
          "Outside Entry Way",
          "Day Room South",
          "Day Room North",
          "Tiny Home Village",
          "Back Lot",
          "Front Lot",
          "Gazebo",
          "Sitting Bench",
          "Sleeping Bench",
          "Receiving",
          "Clothing Closet Entry",
          "Clothing Closet",
          "Front Office",
          "Kitchen Front",
          "Kitchen Back",
          "Bathrooms Day Room",
          "Bathrooms Staff",
        ],
      },
      { key: "incidentDate", label: "Date of incident", type: "date" },
      { key: "incidentTime", label: "Time of incident", type: "time" },
      { key: "guests", label: "Guests / visitors involved", multiline: true },
      { key: "outcomes", label: "Outcomes of incident", multiline: true },
      ...["OPD", "CRU", "OFD", "EMT", "COR"].map((key) => ({
        key,
        label: key,
        type: "checkbox" as const,
      })),
      { key: "ban", label: "Banned until", type: "date" },
      { key: "trespass", label: "Trespassed until", type: "date" },
      {
        key: "override",
        label: "Override?",
        type: "select",
        options: ["Yes", "No"],
      },
      {
        key: "summary",
        label: "Detailed summary of incident",
        multiline: true,
      },
    ],
  },
  {
    id: "general",
    title: "General security log",
    description: "General-purpose log for observations and staff handoffs.",
    fields: [
      { key: "date", label: "Date and time", type: "datetime-local" },
      { key: "officer", label: "Staff member" },
      { key: "location", label: "Location" },
      { key: "summary", label: "Observations", multiline: true },
      { key: "action", label: "Actions taken", multiline: true },
      { key: "followup", label: "Follow-up / handoff", multiline: true },
    ],
  },
];
export const devotionalFields = [
  "title",
  "excerpt",
  "scriptureReference",
  "scriptureText",
  "bodyText",
  "prayer",
] as const;
export type DevotionalDraft = Record<(typeof devotionalFields)[number], string>;
