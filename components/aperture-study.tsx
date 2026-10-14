"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type SceneStatus = "loading" | "ready" | "paused" | "static" | "unavailable";
type Phase = "alignment" | "passage" | "world";
type StudyController = {
  setProgress(progress: number): void;
  setPaused(paused: boolean): void;
  dispose(): void;
};

const chapters: { number: string; label: string; phase: Phase; progress: number; description: string }[] = [
  { number: "01", label: "Align", phase: "alignment", progress: 0, description: "Separate parts find their place. A way opens towards the life beyond." },
  { number: "02", label: "Pass through", phase: "passage", progress: 0.53, description: "The structure creates access, then moves out of our attention." },
  { number: "03", label: "Be here", phase: "world", progress: 1, description: "A shared table. An unhurried conversation. People give the space its meaning." },
];

const clamp = (value: number) => Math.min(1, Math.max(0, value));
const smooth = (value: number) => {
  const bounded = clamp(value);
  return bounded * bounded * (3 - 2 * bounded);
};

function BrandMark() {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M24.7 7.3a12.3 12.3 0 1 0 0 17.4" stroke="currentColor" strokeWidth="2.4" />
      <path d="M23 10.3a8.1 8.1 0 1 0 0 11.4" stroke="currentColor" strokeWidth="1.1" />
      <circle cx="27.6" cy="16" r="1.6" fill="currentColor" />
    </svg>
  );
}

export default function ApertureStudy() {
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const mount = useRef<HTMLDivElement>(null);
  const controller = useRef<StudyController | null>(null);
  const scrollTarget = useRef(0);
  const paused = useRef(false);
  const currentPhase = useRef<Phase>("alignment");
  const [status, setStatus] = useState<SceneStatus>("loading");
  const [phase, setPhase] = useState<Phase>("alignment");
  const [enhanced, setEnhanced] = useState(false);

  useEffect(() => {
    const element = root.current;
    const surface = mount.current;
    const viewport = stage.current;
    if (!element || !surface || !viewport) return;

    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let disposed = false;
    let generation = 0;
    let scrollFrame = 0;
    let initialiseFrame = 0;

    function publishProgress(value: number) {
      if (disposed || !element) return;
      const progress = clamp(value);
      const nextPhase: Phase = progress < 0.34 ? "alignment" : progress < 0.82 ? "passage" : "world";
      element.dataset.progress = progress.toFixed(4);
      element.style.setProperty("--study-progress", String(progress));
      element.style.setProperty("--study-world-scale", String(1 + smooth((progress - 0.34) / 0.48) * 0.055));
      element.style.setProperty("--study-world-offset", `${14 * (1 - smooth(progress / 0.6))}%`);
      element.style.setProperty("--study-world-offset-y", `${12 * (1 - smooth(progress / 0.6))}%`);
      element.style.setProperty("--study-intro-opacity", String(1 - smooth((progress - 0.035) / 0.245)));
      element.style.setProperty("--study-middle-opacity", String(smooth((progress - 0.28) / 0.045) * (1 - smooth((progress - 0.42) / 0.06))));
      element.style.setProperty("--study-final-opacity", String(smooth((progress - 0.83) / 0.09)));
      element.dataset.onWorld = String(progress >= 0.66);
      if (nextPhase !== currentPhase.current) {
        currentPhase.current = nextPhase;
        setPhase(nextPhase);
      }
    }

    function measureScroll() {
      scrollFrame = 0;
      if (disposed || !element || !viewport) return;
      const top = element.getBoundingClientRect().top + window.scrollY;
      const distance = Math.max(1, element.offsetHeight - viewport.offsetHeight);
      scrollTarget.current = clamp((window.scrollY - top) / distance);
      if (!paused.current) controller.current?.setProgress(scrollTarget.current);
    }

    function queueScroll() {
      if (!scrollFrame) scrollFrame = window.requestAnimationFrame(measureScroll);
    }

    async function initialise() {
      const ownGeneration = ++generation;
      controller.current?.dispose();
      controller.current = null;
      surface!.replaceChildren();
      paused.current = false;
      setEnhanced(true);
      element!.dataset.sceneFrames = "0";

      if (preference.matches) {
        setStatus("static");
        publishProgress(1);
        return;
      }

      setStatus("loading");
      publishProgress(0);
      let failed = false;
      const valid = () => !disposed && ownGeneration === generation;
      function showFallback() {
        if (!valid()) return;
        failed = true;
        controller.current?.dispose();
        controller.current = null;
        paused.current = false;
        setStatus("unavailable");
        publishProgress(1);
      }

      try {
        const { createStudy } = await import("./study-engine");
        if (!valid()) return;
        const scene = createStudy(surface!, {
          ready: () => {
            if (!valid() || failed) return;
            setStatus(paused.current ? "paused" : "ready");
            queueScroll();
          },
          failed: showFallback,
          frame: (count: number, progress: number) => {
            if (!valid() || failed) return;
            element!.dataset.sceneFrames = String(count);
            publishProgress(progress);
          },
        });
        if (!valid() || failed) {
          scene.dispose();
          return;
        }
        controller.current = scene;
        measureScroll();
      } catch {
        showFallback();
      }
    }

    initialiseFrame = window.requestAnimationFrame(() => { void initialise(); });
    const changePreference = () => { void initialise(); };
    preference.addEventListener("change", changePreference);
    window.addEventListener("scroll", queueScroll, { passive: true });
    window.addEventListener("resize", queueScroll);

    return () => {
      disposed = true;
      generation += 1;
      window.cancelAnimationFrame(initialiseFrame);
      window.cancelAnimationFrame(scrollFrame);
      preference.removeEventListener("change", changePreference);
      window.removeEventListener("scroll", queueScroll);
      window.removeEventListener("resize", queueScroll);
      controller.current?.dispose();
      controller.current = null;
    };
  }, []);

  function goTo(progress: number) {
    if (!root.current || !stage.current) return;
    const top = root.current.getBoundingClientRect().top + window.scrollY;
    const distance = root.current.offsetHeight - stage.current.offsetHeight;
    window.scrollTo({ top: top + distance * progress, behavior: "smooth" });
  }

  function toggleMotion() {
    if (!controller.current) return;
    paused.current = !paused.current;
    if (!paused.current) controller.current.setProgress(scrollTarget.current);
    controller.current.setPaused(paused.current);
    setStatus(paused.current ? "paused" : "ready");
  }

  const live = status === "ready" || status === "paused";

  return (
    <main
      ref={root}
      className="aperture-study"
      data-testid="aperture-study"
      data-enhanced={enhanced}
      data-scene-status={status}
      data-scene-frames="0"
      data-progress="0.0000"
      data-phase={phase}
      aria-label="TripHalo aperture motion study"
    >
      <div className="study-scroll-track" data-testid="study-scroll-track">
      <div ref={stage} className="study-stage">
        <div className="study-world" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/study/garden-room.webp" alt="" fetchPriority="high" className="study-world-image" />
        </div>
        <div ref={mount} className="study-engine" aria-hidden="true" />
        <div className="study-loading-veil" aria-hidden="true" />
        <div className="study-world-shade" aria-hidden="true" />

        <header className="study-header">
          <Link className="study-brand" href="/" aria-label="TripHalo home" prefetch={false}><BrandMark /><span>TripHalo</span></Link>
          <p className="study-edition">Aperture <span>/</span> Motion study 01</p>
        </header>

        <div className="study-intro">
          <p className="study-eyebrow">Intelligence in service<br className="study-mobile-break" /> of human experience</p>
          <h1>Make room<br />for <em>possibility.</em></h1>
          <p className="study-scroll-cue"><span aria-hidden="true">↓</span> Scroll to make space</p>
        </div>

        <p className="study-middle" aria-hidden="true">Everything falls into place.</p>

        <div className="study-final">
          <p className="study-eyebrow">Technology creates the space.</p>
          <h2>More room<br />for <em>being human.</em></h2>
        </div>

        <footer className="study-controls" data-active={live}>
          <div className="study-progress-track" aria-hidden="true"><span /></div>
          <nav className="study-chapters" aria-label="Study chapters">
            {chapters.map(chapter => (
              <button
                key={chapter.phase}
                type="button"
                disabled={!live}
                aria-current={phase === chapter.phase ? "step" : undefined}
                onClick={() => goTo(chapter.progress)}
              ><span className="study-chapter-number">{chapter.number}</span><span>{chapter.label}</span></button>
            ))}
          </nav>
          <div className="study-playback">
            {phase === "world" && <button className="study-replay" type="button" onClick={() => goTo(0)} disabled={!live}><span aria-hidden="true">↺</span> Replay</button>}
            <button className="study-pause" type="button" onClick={toggleMotion} disabled={!live} aria-pressed={status === "paused"}>
              <svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
                {status === "paused" ? <path d="M3 1.5 10 6 3 10.5Z" /> : <><path d="M2 1h2v10H2Z" /><path d="M8 1h2v10H8Z" /></>}
              </svg>
              <span>{status === "paused" ? "Resume motion" : "Pause motion"}</span>
            </button>
          </div>
        </footer>
      </div>

      <ol className="study-narrative" aria-label="The story in three moments">
        {chapters.map(chapter => <li key={chapter.phase}><h3><span>{chapter.number}</span> {chapter.label}</h3><p>{chapter.description}</p></li>)}
      </ol>
      </div>
    </main>
  );
}
