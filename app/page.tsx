import ResonanceExperience from "@/components/resonance-experience";
import ResonanceCopy from "@/components/resonance-copy";
import TripHaloWordmark from "@/components/triphalo-wordmark";
import "./resonance.css";
import "./typography.css";
import "./wordmark.css";

export default function Home() {
  return <div className="r-typography" data-direction="precision"><ResonanceExperience wordmark={<TripHaloWordmark />}><ResonanceCopy /></ResonanceExperience></div>;
}
