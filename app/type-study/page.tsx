import type { Metadata } from "next";
import TypographyStudy from "@/components/typography-study";
import ResonanceCopy from "@/components/resonance-copy";
import "../resonance.css";
import "../typography.css";
import "../wordmark.css";
import "./typography.css";

export const metadata: Metadata = {
  title: "TripHalo — Typography study",
  robots: { index: false, follow: false },
};

export default function TypeStudy() {
  return <TypographyStudy><ResonanceCopy /></TypographyStudy>;
}
