import { defineField, defineType } from "sanity";

export const siteSettingsType = defineType({
  name: "siteSettings",
  title: "Homepage Settings",
  type: "document",
  fields: [
    defineField({
      name: "heroEyebrow",
      title: "Hero eyebrow",
      type: "string",
      validation: (rule) => rule.required().max(80),
    }),
    defineField({
      name: "heroHeadline",
      title: "Hero headline",
      type: "string",
      validation: (rule) => rule.required().max(80),
    }),
    defineField({
      name: "heroAccent",
      title: "Hero accent line",
      type: "string",
      validation: (rule) => rule.required().max(80),
    }),
    defineField({
      name: "heroIntroduction",
      title: "Hero introduction",
      type: "text",
      rows: 4,
      validation: (rule) => rule.required().max(320),
    }),
    defineField({
      name: "aboutHeadline",
      title: "About headline",
      type: "text",
      rows: 3,
      validation: (rule) => rule.required().max(240),
    }),
    defineField({
      name: "aboutRobinAndLaura",
      title: "About Robin and Laura",
      type: "text",
      rows: 5,
      validation: (rule) => rule.required().max(600),
    }),
    defineField({
      name: "aboutJournal",
      title: "About the journal",
      type: "text",
      rows: 5,
      validation: (rule) => rule.required().max(600),
    }),
  ],
  preview: {
    prepare: () => ({
      title: "Homepage Settings",
      subtitle: "Editable homepage copy",
    }),
  },
});
