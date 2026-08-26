import { PinIcon } from "@sanity/icons/Pin";
import { defineField, defineType } from "sanity";

export const currentLocationType = defineType({
  name: "currentLocation",
  title: "Current Location",
  type: "document",
  icon: PinIcon,
  fields: [
    defineField({
      name: "city",
      title: "City or area",
      type: "string",
      readOnly: true,
    }),
    defineField({
      name: "region",
      title: "Region",
      type: "string",
      readOnly: true,
    }),
    defineField({
      name: "country",
      title: "Country",
      type: "string",
      readOnly: true,
    }),
    defineField({
      name: "displayName",
      title: "Public location",
      type: "string",
      readOnly: true,
    }),
    defineField({
      name: "updatedAt",
      title: "Last updated",
      type: "datetime",
      readOnly: true,
    }),
    defineField({
      name: "daypart",
      title: "Update window",
      type: "string",
      readOnly: true,
      options: {
        list: [
          { title: "Morning", value: "morning" },
          { title: "Afternoon", value: "afternoon" },
          { title: "Evening", value: "evening" },
        ],
        layout: "radio",
      },
    }),
    defineField({
      name: "lastMorningDate",
      type: "date",
      hidden: true,
      readOnly: true,
    }),
    defineField({
      name: "lastAfternoonDate",
      type: "date",
      hidden: true,
      readOnly: true,
    }),
    defineField({
      name: "lastEveningDate",
      type: "date",
      hidden: true,
      readOnly: true,
    }),
  ],
  preview: {
    select: { title: "displayName", subtitle: "updatedAt" },
    prepare: ({ title, subtitle }) => ({
      title: title || "Location not updated yet",
      subtitle: subtitle
        ? `Last updated ${new Date(subtitle).toLocaleString()}`
        : "Automatic updates",
    }),
  },
});
