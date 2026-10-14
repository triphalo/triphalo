import type { Metadata } from "next";
import ApertureStudy from "@/components/aperture-study";
import "./study.css";

export const metadata: Metadata = {
  title: "Aperture — Motion study 01 | TripHalo",
  description: "A motion study: intelligence makes room for human experience.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/study" },
};

export default function StudyPage() {
  return <ApertureStudy />;
}
