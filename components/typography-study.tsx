"use client";

import { useEffect, useRef, useState } from "react";
import ResonanceExperience from "./resonance-experience";
import TripHaloWordmark from "./triphalo-wordmark";

const directions = [
  { id: "precision", number: "01", name: "Precision", fonts: "Mona Sans + IBM Plex Mono", note: "The selected direction. Measured, quiet and contemporary." },
  { id: "humanist", number: "02", name: "Humanist", fonts: "Bricolage Grotesque + Source Sans 3", note: "More character in the letters. Warmth without a serif accent." },
  { id: "editorial", number: "03", name: "Editorial", fonts: "Newsreader + IBM Plex Sans", note: "A complete roman headline. Literary, calm and assured." },
  { id: "baseline", number: "00", name: "Original", fonts: "Manrope + Instrument Serif", note: "The original typography, for comparison." },
] as const;
type Direction = typeof directions[number]["id"];

function HaloWordmark() {
  return <span className="t-wordmark" aria-hidden="true">
    <span>TripHal</span><svg className="t-wordmark-halo" viewBox="0 0 40 40" fill="none">
      <circle className="t-halo-outer" cx="20" cy="20" r="15" />
      <circle className="t-halo-inner" cx="20" cy="20" r="11.5" />
      <circle className="t-halo-light" cx="30.6" cy="9.4" r="2.4" />
    </svg>
  </span>;
}

export default function TypographyStudy({ children }: { children: React.ReactNode }) {
  const [direction, setDirection] = useState<Direction>("precision");
  const [open, setOpen] = useState(true);
  const reopen = useRef<HTMLButtonElement>(null);
  const selectedOption = useRef<HTMLButtonElement>(null);
  const focusAfterToggle = useRef(false);
  const current = directions.find(item => item.id === direction)!;

  useEffect(() => {
    const sync = () => {
      const requested = new URLSearchParams(window.location.search).get("look");
      setDirection(directions.some(item => item.id === requested) ? requested as Direction : "precision");
    };
    sync();
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  useEffect(() => {
    if (!focusAfterToggle.current) return;
    (open ? selectedOption.current : reopen.current)?.focus({ preventScroll: true });
    focusAfterToggle.current = false;
  }, [open]);

  const toggleOptions = () => { focusAfterToggle.current = true; setOpen(value => !value); };

  const choose = (value: Direction) => {
    setDirection(value);
    const url = new URL(window.location.href);
    url.searchParams.set("look", value);
    window.history.replaceState(null, "", url);
  };

  return <div className="r-typography type-study" data-direction={direction}>
    <ResonanceExperience wordmark={direction === "precision" ? <TripHaloWordmark /> : direction === "baseline" ? undefined : <HaloWordmark />}>{children}</ResonanceExperience>
    <aside className="t-tools" aria-label="Typography comparison" data-open={open}>
      {open && <div id="type-options" className="t-panel">
        <div className="t-panel-heading"><span>Typography study</span><button type="button" onClick={toggleOptions} aria-label="Hide typography options">−</button></div>
        <div className="t-options" role="group" aria-label="Choose typography">
          {directions.map(item => <button ref={direction === item.id ? selectedOption : undefined} key={item.id} type="button" aria-pressed={direction === item.id} onClick={() => choose(item.id)}><span>{item.number}</span>{item.name}</button>)}
        </div>
        <div className="t-caption" aria-live="polite"><strong>{current.fonts}</strong><p>{current.note}</p></div>
      </div>}
      {!open && <button ref={reopen} className="t-reopen" type="button" onClick={toggleOptions} aria-label={`Type options — ${current.number}`} aria-expanded={false} aria-controls="type-options"><span className="t-reopen-label">Type<span className="t-reopen-extra"> options</span></span><span>{current.number}</span><span aria-hidden="true">+</span></button>}
    </aside>
  </div>;
}
