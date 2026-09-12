export type CalendarEntry = {
  id: string;
  title: string;
  date: string;
  time: string;
  category: string;
  notes: string;
};
export type SecurityTemplate = {
  id: string;
  title: string;
  description: string;
  fields: { key: string; label: string; multiline?: boolean }[];
};
export const securityTemplates: SecurityTemplate[] = [
  {
    id: "general",
    title: "General security log",
    description:
      "Starter log. Official Mission forms will be added from the supplied PDFs.",
    fields: [
      { key: "date", label: "Date and time" },
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
