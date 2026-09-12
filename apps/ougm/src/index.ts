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
  fields: {
    key: string;
    label: string;
    multiline?: boolean;
    type?: "date" | "time" | "checkbox" | "select";
    options?: string[];
  }[];
  pdfUrl?: string;
};
export const securityTemplates: SecurityTemplate[] = [
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
      { key: "location", label: "Location(s) of incident", multiline: true },
      { key: "incidentDate", label: "Date of incident", type: "date" },
      { key: "incidentTime", label: "Time of incident", type: "time" },
      { key: "guests", label: "Guests / visitors involved", multiline: true },
      { key: "outcomes", label: "Outcomes of incident", multiline: true },
      ...["OPD", "CRU", "OFD", "EMT", "COR"].map((key) => ({
        key,
        label: key,
        type: "checkbox" as const,
      })),
      { key: "ban", label: "Ban" },
      { key: "trespass", label: "Trespass" },
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
