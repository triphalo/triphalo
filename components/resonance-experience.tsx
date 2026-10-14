"use client";
import { useEffect, useRef, useState } from "react";
import type { ResonanceState } from "./resonance-engine";
const chapters = ["Opening", "Belief", "Work", "Contact"];
const initialState: ResonanceState = { progress: 0, pointerX: 0, pointerY: 0, active: false, pressed: false, paused: true, reducedMotion: false, tuning: .18, pulse: 0 };
export default function ResonanceExperience({ children, wordmark }: { children: React.ReactNode; wordmark?: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const engine = useRef<ReturnType<typeof import("./resonance-engine").createResonanceEngine> | null>(null);
  const scene = useRef<ResonanceState>({ ...initialState });
  const [paused, setPaused] = useState(false);
  const [ready, setReady] = useState(false);
  const [chapter, setChapter] = useState(0);
  const [tuning, setTuning] = useState(18);
  const [expanded, setExpanded] = useState(false);
  const held = useRef(false);
  const dragOrigin = useRef({ x: 0, tuning: 0, moved: false });
  const update = (patch: Partial<ResonanceState>) => { Object.assign(scene.current, patch); engine.current?.update(scene.current); };
  useEffect(() => {
    let disposed = false;
    let frame = 0;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const applyPreference = () => {
      scene.current.reducedMotion = media.matches;
      scene.current.paused = media.matches;
      setPaused(media.matches);
      document.documentElement.dataset.resonanceMotion = media.matches ? "paused" : "playing";
      engine.current?.update(scene.current);
    };
    applyPreference();
    import("./resonance-engine").then(({ createResonanceEngine }) => {
      if (disposed || !canvas.current) return;
      try {
        const currentCanvas = canvas.current;
        engine.current = createResonanceEngine(currentCanvas, { onReady: () => {
          const available = currentCanvas.dataset.fallback !== "true";
          currentCanvas.dataset.ready = available ? "true" : "false";
          if (!disposed) setReady(available);
        } });
        engine.current.update(scene.current);
      } catch { if (canvas.current) canvas.current.dataset.fallback = "true"; }
    });
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const sections = chapters.map(name => document.getElementById(name.toLowerCase()));
        const y = window.scrollY;
        let progress = 0;
        for (let i = 0; i < sections.length; i++) {
          const section = sections[i];
          if (!section) continue;
          const start = section.offsetTop;
          const next = sections[i + 1]?.offsetTop ?? start + section.offsetHeight;
          if (y >= start) progress = i + Math.min(1, (y - start) / Math.max(1, next - start));
        }
        progress = Math.min(3, progress);
        scene.current.progress = progress;
        engine.current?.update(scene.current);
        setChapter(Math.min(3, Math.round(progress)));
        root.current?.style.setProperty("--journey", String(progress / 3));
        const mobile = window.innerWidth < 760;
        const segment = Math.min(2, Math.floor(progress));
        const t = progress - segment;
        const eased = t * t * (3 - 2 * t);
        const xs = [.73, .73, .65, .65];
        const ys = [.47, .47, .58, .58];
        const x = mobile ? .5 : xs[segment] + (xs[segment + 1] - xs[segment]) * eased;
        const mobileYs = [.285, .285, .26, .75];
        const yPos = mobile ? mobileYs[segment] + (mobileYs[segment + 1] - mobileYs[segment]) * eased : ys[segment] + (ys[segment + 1] - ys[segment]) * eased;
        root.current?.style.setProperty("--halo-x", `${x * 100}%`);
        root.current?.style.setProperty("--halo-y", `${yPos * 100}%`);
      });
    };
    const onPointer = (event: PointerEvent) => {
      if (event.pointerType === "touch" && !held.current) return;
      scene.current.pointerX = event.clientX / window.innerWidth * 2 - 1;
      scene.current.pointerY = event.clientY / window.innerHeight * 2 - 1;
      engine.current?.update(scene.current);
    };
    const onBlur = () => { held.current = false; scene.current.pressed = false; scene.current.active = false; setExpanded(false); engine.current?.update(scene.current); };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("blur", onBlur);
    media.addEventListener("change", applyPreference);
    return () => {
      disposed = true; cancelAnimationFrame(frame); engine.current?.dispose(); engine.current = null;
      window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); window.removeEventListener("pointermove", onPointer); window.removeEventListener("blur", onBlur); media.removeEventListener("change", applyPreference);
      delete document.documentElement.dataset.resonanceMotion;
    };
  }, []);
  const toggleMotion = () => { const next = !paused; setPaused(next); update({ paused: next, reducedMotion: next ? scene.current.reducedMotion : false }); document.documentElement.dataset.resonanceMotion = next ? "paused" : "playing"; };
  const changeTuning = (value: number) => { const next = Math.max(0, Math.min(100, value)); setTuning(next); update({ tuning: next / 100 }); };
  return <div ref={root} className="resonance" data-chapter={chapter} data-ready={ready} data-paused={paused} data-expanded={expanded}>
    <a className="r-skip" href="#main">Skip to content</a>
    <noscript><style>{".r-controls,.r-halo-touch{display:none}.r-canvas{display:none}"}</style></noscript>
    <div className="r-atmosphere" aria-hidden="true" />
    <div className="r-artwork" aria-hidden="true"><div className="r-fallback"><div /><div /><div /></div><canvas ref={canvas} className="r-canvas" /></div>
    <div className="r-grain" aria-hidden="true" />
    <header className="r-header"><a href="#opening" className="r-brand" aria-label="TripHalo home">{wordmark ?? <span>TripHalo</span>}</a><nav aria-label="Main navigation"><a href="#belief" aria-current={chapter === 1 ? "location" : undefined}>Belief</a><a href="#work" aria-current={chapter === 2 ? "location" : undefined}>Work</a><a href="#contact" aria-current={chapter === 3 ? "location" : undefined}>Contact <span aria-hidden="true">↗</span></a></nav></header>
    <button className="r-halo-touch" aria-label="Resonate" aria-keyshortcuts="ArrowLeft ArrowRight"
      onPointerEnter={() => update({ active: true })}
      onPointerLeave={() => { if (!held.current) update({ active: false }); }}
      onPointerDown={event => { held.current = true; dragOrigin.current = { x: event.clientX, tuning, moved: false }; event.currentTarget.setPointerCapture(event.pointerId); setExpanded(true); update({ pressed: true, active: true }); }}
      onPointerMove={event => { if (!held.current) return; const distance = event.clientX - dragOrigin.current.x; if (Math.abs(distance) > 8) dragOrigin.current.moved = true; if (dragOrigin.current.moved) changeTuning(Math.round(Math.max(0, Math.min(100, dragOrigin.current.tuning + distance / 3)))); }}
      onPointerUp={() => { held.current = false; setExpanded(false); update({ pressed: false }); }}
      onPointerCancel={() => { held.current = false; setExpanded(false); update({ pressed: false, active: false }); }}
      onKeyDown={event => { if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); changeTuning(Math.round(scene.current.tuning * 100) + (event.key === "ArrowRight" ? 5 : -5)); } }}
      onClick={() => { if (!dragOrigin.current.moved) update({ pulse: scene.current.pulse + 1 }); dragOrigin.current.moved = false; }}>
    </button>
    {children}
    <div className="r-controls">
      <nav className="r-chapter-nav" aria-label="Chapters"><span className="r-chapter-count" aria-hidden="true">0{chapter + 1}<span> / 04</span></span><div className="r-chapter-dots">{chapters.map((name, i) => <a key={name} href={`#${name.toLowerCase()}`} aria-label={`Go to ${name}`} aria-current={chapter === i ? "location" : undefined}><span /><span className="r-dot-label">{name}</span></a>)}</div></nav>
      <button className="r-pause" onClick={toggleMotion} aria-label={paused ? "Motion off — resume animation" : "Motion on — pause animation"} aria-pressed={paused}>{paused ? "Motion off" : "Motion on"}</button>
    </div><div className="r-progress" aria-hidden="true" />
  </div>;
}
