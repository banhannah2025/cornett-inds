import type { Metadata } from "next";
import { SchoolCampus } from "./school-campus";
import "./school.css";

export const metadata: Metadata = {
  title: "Cornett School of Christianity | Blended Works",
  description:
    "An adult, nondenominational Christian learning community. Explore Scripture, history, psychology, and ministry through guided certificate pathways.",
};

export default function SchoolPage() {
  return <SchoolCampus />;
}
