import { authorType } from "./author";
import { categoryType } from "./category";
import { postType } from "./post";
import { siteSettingsType } from "./siteSettings";
import { fieldNoteCategoryType } from "./fieldNoteCategory";
import { fieldNoteType } from "./fieldNote";
import { devotionalType } from "./devotional";
import { basecampTripType } from "./basecampTrip";

export const schemaTypes = [
  postType,
  categoryType,
  fieldNoteType,
  fieldNoteCategoryType,
  devotionalType,
  authorType,
  siteSettingsType,
  basecampTripType,
];
